CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_tier AS ENUM ('f0', 'f1', 'f2');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('pending', 'processing', 'distributed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM ('pending_claim', 'claimed', 'expired', 'swept');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_direction AS ENUM ('allocate', 'claim');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('pending', 'confirmed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE hmac_valid AS ENUM ('valid', 'invalid', 'missing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wallet_type AS ENUM ('treasury', 'relay_fund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dlq_source AS ENUM ('rebate_events', 'split_ledger', 'sc_sync_log', 'relay_fund_log');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE platform AS ENUM ('mt4', 'mt5');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION uuid_to_ltree_label(p_id UUID)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT 'u' || REPLACE(p_id::TEXT, '-', '_');
$$;

CREATE OR REPLACE FUNCTION trg_set_ltree_path()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_parent_path LTREE;
BEGIN
  IF NEW.parent_user_id IS NULL THEN
    NEW.ltree_path := uuid_to_ltree_label(NEW.user_id)::LTREE;
  ELSE
    SELECT ltree_path INTO v_parent_path FROM users WHERE user_id = NEW.parent_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'parent_user_id % not found', NEW.parent_user_id;
    END IF;
    NEW.ltree_path := (v_parent_path::TEXT || '.' || uuid_to_ltree_label(NEW.user_id))::LTREE;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_update_ltree_path()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_old_prefix TEXT := OLD.ltree_path::TEXT;
  v_new_prefix TEXT;
  v_parent_path LTREE;
BEGIN
  IF NEW.parent_user_id IS NULL THEN
    NEW.ltree_path := uuid_to_ltree_label(NEW.user_id)::LTREE;
  ELSE
    SELECT ltree_path INTO v_parent_path FROM users WHERE user_id = NEW.parent_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'parent_user_id % not found', NEW.parent_user_id;
    END IF;
    NEW.ltree_path := (v_parent_path::TEXT || '.' || uuid_to_ltree_label(NEW.user_id))::LTREE;
  END IF;

  v_new_prefix := NEW.ltree_path::TEXT;

  IF v_old_prefix IS DISTINCT FROM v_new_prefix THEN
    UPDATE users
    SET ltree_path = (v_new_prefix || '.' || subpath(ltree_path, nlevel(v_old_prefix::LTREE))::TEXT)::LTREE
    WHERE ltree_path <@ v_old_prefix::LTREE
      AND user_id != NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_partition_month()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.partition_month = TO_CHAR(NEW.occurred_at AT TIME ZONE 'UTC', 'YYYYMM')::INTEGER;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_log_month()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.log_month = TO_CHAR(COALESCE(NEW.received_at, NOW()), 'YYYYMM')::INTEGER;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_synced_month()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.synced_month = TO_CHAR(COALESCE(NEW.synced_at, NOW()), 'YYYYMM')::INTEGER;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_relay_log_month()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.log_month = TO_CHAR(COALESCE(NEW.logged_at, NOW()), 'YYYYMM')::INTEGER;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_split_ledger_partition_month()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.partition_month = NEW.event_partition_month;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS brokers (
  broker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE,
  webhook_secret TEXT NOT NULL,
  webhook_url TEXT,
  ref_api_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broker_wallets (
  wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES brokers(broker_id) ON DELETE CASCADE,
  wallet_type wallet_type NOT NULL,
  wallet_address VARCHAR(42) NOT NULL CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  label VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_configs (
  config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES brokers(broker_id) ON DELETE CASCADE,
  total_fee NUMERIC(10,6) NOT NULL DEFAULT 0.500000,
  gas_fee NUMERIC(10,6) NOT NULL DEFAULT 0.100000,
  protocol_fee NUMERIC(10,6) NOT NULL DEFAULT 0.400000,
  min_claim NUMERIC(10,6) NOT NULL DEFAULT 5.000000,
  expiry_days INTEGER NOT NULL DEFAULT 180 CHECK (expiry_days > 0),
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fee_parts CHECK (gas_fee + protocol_fee = total_fee),
  CONSTRAINT chk_fee_pos CHECK (total_fee > 0 AND gas_fee >= 0 AND protocol_fee >= 0),
  CONSTRAINT chk_min_claim CHECK (min_claim > total_fee)
);

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES brokers(broker_id) ON DELETE CASCADE,
  tier user_tier NOT NULL,
  wallet_address VARCHAR(42) CHECK (wallet_address IS NULL OR wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  email VARCHAR(255) NOT NULL UNIQUE,
  rebate_rate_from_parent NUMERIC(10,4) NOT NULL DEFAULT 0 CHECK (rebate_rate_from_parent >= 0),
  parent_user_id UUID REFERENCES users(user_id),
  depth SMALLINT NOT NULL DEFAULT 0,
  ltree_path LTREE NOT NULL DEFAULT 'placeholder',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_depth_tier CHECK (
    (tier = 'f0' AND depth = 0) OR
    (tier = 'f1' AND depth = 1) OR
    (tier = 'f2' AND depth = 2)
  ),
  CONSTRAINT chk_f0_no_parent CHECK (
    (tier = 'f0' AND parent_user_id IS NULL) OR
    (tier != 'f0' AND parent_user_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS user_accounts (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES brokers(broker_id) ON DELETE CASCADE,
  platform platform NOT NULL,
  account_uid VARCHAR(128) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (broker_id, account_uid)
);

CREATE TABLE IF NOT EXISTS admin_roles (
  role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  permission VARCHAR(80) PRIMARY KEY,
  category VARCHAR(30) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id UUID NOT NULL REFERENCES admin_roles(role_id) ON DELETE CASCADE,
  permission VARCHAR(80) NOT NULL REFERENCES admin_permissions(permission) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS admin_users (
  admin_user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_id UUID REFERENCES admin_roles(role_id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_active_has_role CHECK (is_active = FALSE OR role_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  log_id UUID DEFAULT uuid_generate_v4(),
  broker_id UUID REFERENCES brokers(broker_id),
  tx_id VARCHAR(128),
  http_status SMALLINT,
  hmac_valid hmac_valid NOT NULL DEFAULT 'missing',
  raw_payload JSONB,
  error_msg TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_month INTEGER NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYYMM')::INTEGER,
  PRIMARY KEY (log_id, log_month)
) PARTITION BY RANGE (log_month);

CREATE TABLE IF NOT EXISTS rebate_events (
  event_id UUID DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES brokers(broker_id),
  fee_config_id UUID NOT NULL REFERENCES fee_configs(config_id),
  tx_id VARCHAR(128) NOT NULL,
  f0_user_id UUID NOT NULL REFERENCES users(user_id),
  total_usdt NUMERIC(18,6) NOT NULL,
  status event_status NOT NULL DEFAULT 'pending',
  error_msg TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  partition_month INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_total_positive CHECK (total_usdt > 0),
  CONSTRAINT chk_event_partition_month CHECK (
    partition_month = TO_CHAR(occurred_at AT TIME ZONE 'UTC', 'YYYYMM')::INTEGER
  ),
  PRIMARY KEY (event_id, partition_month),
  CONSTRAINT uq_broker_tx_partition UNIQUE (broker_id, tx_id, partition_month)
) PARTITION BY RANGE (partition_month);

CREATE TABLE IF NOT EXISTS rebate_event_idempotency (
  broker_id UUID NOT NULL REFERENCES brokers(broker_id) ON DELETE CASCADE,
  tx_id VARCHAR(128) NOT NULL,
  event_id UUID NOT NULL,
  event_partition_month INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (broker_id, tx_id)
);

CREATE TABLE IF NOT EXISTS split_ledger (
  ledger_id UUID DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  event_partition_month INTEGER NOT NULL,
  recipient_user_id UUID NOT NULL REFERENCES users(user_id),
  broker_id UUID NOT NULL REFERENCES brokers(broker_id),
  tier user_tier NOT NULL,
  gross_amount NUMERIC(18,6) NOT NULL,
  relayer_fee NUMERIC(18,6) NOT NULL DEFAULT 0.100000,
  dev_fee NUMERIC(18,6) NOT NULL DEFAULT 0.400000,
  fee_amount NUMERIC(18,6) GENERATED ALWAYS AS (relayer_fee + dev_fee) STORED,
  net_amount NUMERIC(18,6) NOT NULL,
  claim_status claim_status NOT NULL DEFAULT 'pending_claim',
  sc_payout_id BYTEA,
  claim_tx_hash VARCHAR(66),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  partition_month INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ledger_id, partition_month),
  CONSTRAINT chk_amounts CHECK (gross_amount > 0 AND net_amount >= 0 AND fee_amount >= 0),
  CONSTRAINT chk_net_eq CHECK (net_amount = gross_amount - fee_amount),
  CONSTRAINT chk_claimed_has_hash CHECK (claim_status != 'claimed' OR claim_tx_hash IS NOT NULL),
  CONSTRAINT fk_split_event FOREIGN KEY (event_id, event_partition_month)
    REFERENCES rebate_events(event_id, partition_month)
) PARTITION BY RANGE (partition_month);

CREATE TABLE IF NOT EXISTS sc_sync_log (
  sync_id UUID DEFAULT uuid_generate_v4(),
  ledger_id UUID NOT NULL,
  sc_tx_hash VARCHAR(66),
  direction sync_direction NOT NULL,
  status sync_status NOT NULL DEFAULT 'pending',
  attempt SMALLINT NOT NULL DEFAULT 1,
  error_msg TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_month INTEGER NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYYMM')::INTEGER,
  PRIMARY KEY (sync_id, synced_month)
) PARTITION BY RANGE (synced_month);

CREATE TABLE IF NOT EXISTS relay_fund_log (
  log_id UUID DEFAULT uuid_generate_v4(),
  ledger_id UUID NOT NULL,
  broker_id UUID NOT NULL REFERENCES brokers(broker_id),
  bnb_used NUMERIC(18,8) NOT NULL,
  bnb_price_usd NUMERIC(10,4) NOT NULL,
  usdt_collected NUMERIC(10,6) NOT NULL,
  pnl NUMERIC(10,6) GENERATED ALWAYS AS (usdt_collected - bnb_used * bnb_price_usd) STORED,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_month INTEGER NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYYMM')::INTEGER,
  PRIMARY KEY (log_id, log_month)
) PARTITION BY RANGE (log_month);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  dlq_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_table dlq_source NOT NULL,
  source_id UUID NOT NULL,
  event_id UUID,
  reason TEXT NOT NULL,
  attempt_count SMALLINT NOT NULL DEFAULT 5,
  resolved_by VARCHAR(120),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT chk_resolved CHECK (
    (resolved_at IS NULL AND resolved_by IS NULL) OR
    (resolved_at IS NOT NULL AND resolved_by IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS wallet_link_codes (
  code_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  wallet_address VARCHAR(42) NOT NULL CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  code VARCHAR(6) NOT NULL CHECK (code ~ '^[0-9]{6}$'),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rebate_rate_history (
  history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  changed_by_user_id UUID NOT NULL REFERENCES users(user_id),
  old_rate NUMERIC(10,4) NOT NULL,
  new_rate NUMERIC(10,4) NOT NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
  i INTEGER;
  current_key INTEGER;
  next_key INTEGER;
BEGIN
  FOR i IN 0..12 LOOP
    current_key := TO_CHAR(NOW() + (i || ' months')::INTERVAL, 'YYYYMM')::INTEGER;
    next_key := TO_CHAR(NOW() + ((i + 1) || ' months')::INTERVAL, 'YYYYMM')::INTEGER;

    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS webhook_logs_%s PARTITION OF webhook_logs FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS rebate_events_%s PARTITION OF rebate_events FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS split_ledger_%s PARTITION OF split_ledger FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS sc_sync_log_%s PARTITION OF sc_sync_log FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS relay_fund_log_%s PARTITION OF relay_fund_log FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_brokers_updated_at ON brokers;
CREATE TRIGGER trg_brokers_updated_at
  BEFORE UPDATE ON brokers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_broker_wallets_updated_at ON broker_wallets;
CREATE TRIGGER trg_broker_wallets_updated_at
  BEFORE UPDATE ON broker_wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_ltree_path ON users;
CREATE TRIGGER trg_users_ltree_path
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION trg_set_ltree_path();

DROP TRIGGER IF EXISTS trg_users_ltree_path_update ON users;
CREATE TRIGGER trg_users_ltree_path_update
  BEFORE UPDATE OF parent_user_id ON users
  FOR EACH ROW
  WHEN (OLD.parent_user_id IS DISTINCT FROM NEW.parent_user_id)
  EXECUTE FUNCTION trg_update_ltree_path();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_admin_roles_updated_at ON admin_roles;
CREATE TRIGGER trg_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_webhook_logs_partition ON webhook_logs;
CREATE TRIGGER trg_webhook_logs_partition
  BEFORE INSERT ON webhook_logs
  FOR EACH ROW EXECUTE FUNCTION set_log_month();

DROP TRIGGER IF EXISTS trg_rebate_events_partition ON rebate_events;
CREATE TRIGGER trg_rebate_events_partition
  BEFORE INSERT ON rebate_events
  FOR EACH ROW EXECUTE FUNCTION set_partition_month();

DROP TRIGGER IF EXISTS trg_rebate_events_updated_at ON rebate_events;
CREATE TRIGGER trg_rebate_events_updated_at
  BEFORE UPDATE ON rebate_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_split_ledger_partition ON split_ledger;
CREATE TRIGGER trg_split_ledger_partition
  BEFORE INSERT ON split_ledger
  FOR EACH ROW EXECUTE FUNCTION set_split_ledger_partition_month();

DROP TRIGGER IF EXISTS trg_sc_sync_log_synced_month ON sc_sync_log;
CREATE TRIGGER trg_sc_sync_log_synced_month
  BEFORE INSERT ON sc_sync_log
  FOR EACH ROW EXECUTE FUNCTION set_synced_month();

DROP TRIGGER IF EXISTS trg_relay_fund_log_month ON relay_fund_log;
CREATE TRIGGER trg_relay_fund_log_month
  BEFORE INSERT ON relay_fund_log
  FOR EACH ROW EXECUTE FUNCTION set_relay_log_month();

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_wallet ON broker_wallets(broker_id, wallet_type) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_broker_wallets_broker ON broker_wallets(broker_id, wallet_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_configs_current ON fee_configs(broker_id) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_fee_configs_broker ON fee_configs(broker_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_users_ltree ON users USING GIST(ltree_path);
CREATE INDEX IF NOT EXISTS idx_users_broker_tier ON users(broker_id, tier);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_user_id) WHERE parent_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_wallet ON users(broker_id, wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_accounts_broker_uid ON user_accounts(broker_id, account_uid);
CREATE INDEX IF NOT EXISTS idx_user_accounts_user ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_perms ON admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_broker ON webhook_logs(broker_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tx ON webhook_logs(tx_id) WHERE tx_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_logs_broker_tx_month ON webhook_logs(broker_id, tx_id, log_month) WHERE broker_id IS NOT NULL AND tx_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_broker_status ON rebate_events(broker_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_f0_user ON rebate_events(f0_user_id);
CREATE INDEX IF NOT EXISTS idx_rebate_event_idempotency_event ON rebate_event_idempotency(event_id, event_partition_month);
CREATE INDEX IF NOT EXISTS idx_ledger_recipient_pending ON split_ledger(partition_month, recipient_user_id, claim_status) WHERE claim_status = 'pending_claim';
CREATE INDEX IF NOT EXISTS idx_ledger_event ON split_ledger(event_id);
CREATE INDEX IF NOT EXISTS idx_ledger_broker ON split_ledger(broker_id);
CREATE INDEX IF NOT EXISTS idx_ledger_expires ON split_ledger(expires_at) WHERE claim_status = 'pending_claim';
CREATE INDEX IF NOT EXISTS idx_ledger_user_claim_expires ON split_ledger(recipient_user_id, expires_at) WHERE claim_status = 'pending_claim';
CREATE INDEX IF NOT EXISTS idx_sc_sync_ledger ON sc_sync_log(ledger_id);
CREATE INDEX IF NOT EXISTS idx_sc_sync_failed ON sc_sync_log(status, synced_at DESC) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_sc_sync_hash ON sc_sync_log(sc_tx_hash) WHERE sc_tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_relay_fund_ledger ON relay_fund_log(ledger_id);
CREATE INDEX IF NOT EXISTS idx_relay_fund_date ON relay_fund_log(log_month, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_relay_fund_broker ON relay_fund_log(broker_id, log_month);
CREATE INDEX IF NOT EXISTS idx_dlq_unresolved ON dead_letter_queue(created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dlq_source ON dead_letter_queue(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_dlq_event ON dead_letter_queue(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_link_codes_user ON wallet_link_codes(user_id, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_rebate_rate_history_user ON rebate_rate_history(user_id, changed_at DESC);

INSERT INTO admin_roles (role_name, description) VALUES
  ('super_admin', 'Full system access - all permissions'),
  ('ops_admin', 'Operations: view logs, retry events, manage DLQ'),
  ('finance_admin', 'Finance: view P&L, manage broker wallets, fee configs'),
  ('support_admin', 'Support: view users, webhook logs, rebate events')
ON CONFLICT (role_name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO admin_permissions (permission, category, description) VALUES
  ('broker:create', 'broker', 'Create new broker'),
  ('broker:update', 'broker', 'Update broker settings'),
  ('broker:delete', 'broker', 'Soft-delete broker'),
  ('broker:view', 'broker', 'View broker list/details'),
  ('broker_wallet:create', 'wallet', 'Add broker wallet'),
  ('broker_wallet:update', 'wallet', 'Update wallet label/active status'),
  ('broker_wallet:delete', 'wallet', 'Remove broker wallet'),
  ('broker_wallet:view', 'wallet', 'View broker wallets'),
  ('fee_config:create', 'fee', 'Create fee configuration'),
  ('fee_config:update', 'fee', 'Update active fee config'),
  ('fee_config:view', 'fee', 'View fee configs'),
  ('user:view', 'user', 'View end-user list'),
  ('user:suspend', 'user', 'Suspend end-user'),
  ('user:delete', 'user', 'Soft-delete end-user'),
  ('user:view_tier', 'user', 'View tier/volume of end-user'),
  ('webhook_log:view', 'webhook', 'View webhook history'),
  ('webhook_log:replay', 'webhook', 'Replay/reprocess webhook'),
  ('rebate_event:view', 'rebate', 'View rebate events'),
  ('rebate_event:retry', 'rebate', 'Retry failed event'),
  ('rebate_event:force_process', 'rebate', 'Force process event'),
  ('split_ledger:view', 'ledger', 'View split ledger'),
  ('split_ledger:manual_claim', 'ledger', 'Manual claim for user'),
  ('dlq:view', 'dlq', 'View dead letter queue'),
  ('dlq:resolve', 'dlq', 'Resolve DLQ entry'),
  ('dlq:retry', 'dlq', 'Retry from DLQ'),
  ('relay_fund:view_pnl', 'relay', 'View relay fund P&L'),
  ('relay_fund:topup', 'relay', 'Top up relay fund'),
  ('system:health', 'system', 'View system health'),
  ('system:config', 'system', 'Update system config'),
  ('admin_user:create', 'admin', 'Create admin user'),
  ('admin_user:update', 'admin', 'Update admin user'),
  ('admin_user:delete', 'admin', 'Delete admin user'),
  ('admin_user:assign_role', 'admin', 'Assign role to admin user')
ON CONFLICT (permission) DO UPDATE
SET category = EXCLUDED.category,
    description = EXCLUDED.description;

INSERT INTO admin_role_permissions (role_id, permission)
SELECT r.role_id, p.permission
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.role_name = 'super_admin'
ON CONFLICT (role_id, permission) DO NOTHING;

CREATE OR REPLACE FUNCTION set_current_fee_config(p_broker_id UUID, p_config_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_broker_id::TEXT));

  UPDATE fee_configs
  SET is_current = FALSE
  WHERE broker_id = p_broker_id
    AND is_current = TRUE
    AND config_id != p_config_id;

  UPDATE fee_configs
  SET is_current = TRUE
  WHERE config_id = p_config_id
    AND broker_id = p_broker_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_rebate_event(
  p_broker_id UUID,
  p_fee_config_id UUID,
  p_tx_id VARCHAR(128),
  p_f0_user_id UUID,
  p_total_usdt NUMERIC,
  p_occurred_at TIMESTAMPTZ
)
RETURNS TABLE (
  event_id UUID,
  partition_month INTEGER,
  is_idempotent_replay BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
  v_event_id UUID := uuid_generate_v4();
  v_partition_month INTEGER := TO_CHAR(p_occurred_at AT TIME ZONE 'UTC', 'YYYYMM')::INTEGER;
BEGIN
  INSERT INTO rebate_event_idempotency (broker_id, tx_id, event_id, event_partition_month)
  VALUES (p_broker_id, p_tx_id, v_event_id, v_partition_month)
  ON CONFLICT (broker_id, tx_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      rei.event_id,
      rei.event_partition_month,
      TRUE
    FROM rebate_event_idempotency rei
    WHERE rei.broker_id = p_broker_id
      AND rei.tx_id = p_tx_id;
    RETURN;
  END IF;

  INSERT INTO rebate_events (
    event_id,
    broker_id,
    fee_config_id,
    tx_id,
    f0_user_id,
    total_usdt,
    occurred_at,
    partition_month
  )
  VALUES (
    v_event_id,
    p_broker_id,
    p_fee_config_id,
    p_tx_id,
    p_f0_user_id,
    p_total_usdt,
    p_occurred_at,
    v_partition_month
  );

  RETURN QUERY SELECT v_event_id, v_partition_month, FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION get_relay_fund_pnl(
  p_from_month INTEGER DEFAULT NULL,
  p_to_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
  month TIMESTAMPTZ,
  claim_count BIGINT,
  total_bnb_used NUMERIC,
  total_usdt_collected NUMERIC,
  total_pnl NUMERIC,
  avg_pnl_per_claim NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
  v_from INTEGER := COALESCE(p_from_month, TO_CHAR(NOW() - INTERVAL '3 months', 'YYYYMM')::INTEGER);
  v_to INTEGER := COALESCE(p_to_month, TO_CHAR(NOW(), 'YYYYMM')::INTEGER);
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', logged_at),
    COUNT(*)::BIGINT,
    SUM(bnb_used),
    SUM(usdt_collected),
    SUM(pnl),
    AVG(pnl)
  FROM relay_fund_log
  WHERE log_month BETWEEN v_from AND v_to
  GROUP BY DATE_TRUNC('month', logged_at)
  ORDER BY DATE_TRUNC('month', logged_at) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_f0_downline_summary(
  p_f0_user_id UUID,
  p_from_month INTEGER DEFAULT NULL,
  p_to_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
  f0_user_id UUID,
  f1_count BIGINT,
  f2_count BIGINT,
  total_rebate_generated NUMERIC,
  total_events BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
  v_from INTEGER := COALESCE(p_from_month, TO_CHAR(NOW() - INTERVAL '3 months', 'YYYYMM')::INTEGER);
  v_to INTEGER := COALESCE(p_to_month, TO_CHAR(NOW(), 'YYYYMM')::INTEGER);
BEGIN
  RETURN QUERY
  SELECT
    root.user_id,
    COUNT(DISTINCT child.user_id) FILTER (WHERE child.tier = 'f1'),
    COUNT(DISTINCT child.user_id) FILTER (WHERE child.tier = 'f2'),
    COALESCE(SUM(sl.gross_amount), 0),
    COUNT(DISTINCT re.event_id)
  FROM users root
  JOIN users child
    ON child.ltree_path <@ root.ltree_path
    AND child.user_id != root.user_id
  LEFT JOIN split_ledger sl
    ON sl.recipient_user_id = child.user_id
    AND sl.partition_month BETWEEN v_from AND v_to
  LEFT JOIN rebate_events re
    ON re.f0_user_id = root.user_id
    AND re.partition_month BETWEEN v_from AND v_to
  WHERE root.tier = 'f0'
    AND root.user_id = p_f0_user_id
  GROUP BY root.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION initialise_broker_fees(p_broker_id UUID)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_config_id UUID;
BEGIN
  INSERT INTO fee_configs (
    broker_id,
    total_fee,
    gas_fee,
    protocol_fee,
    min_claim,
    expiry_days,
    is_current
  )
  VALUES (p_broker_id, 0.50, 0.10, 0.40, 5.00, 180, TRUE)
  RETURNING config_id INTO v_config_id;

  RETURN v_config_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_next_month_partitions()
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  i INTEGER;
  current_key INTEGER;
  next_key INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    current_key := TO_CHAR(NOW() + (i || ' months')::INTERVAL, 'YYYYMM')::INTEGER;
    next_key := TO_CHAR(NOW() + ((i + 1) || ' months')::INTERVAL, 'YYYYMM')::INTEGER;

    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS webhook_logs_%s PARTITION OF webhook_logs FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS rebate_events_%s PARTITION OF rebate_events FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS split_ledger_%s PARTITION OF split_ledger FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS sc_sync_log_%s PARTITION OF sc_sync_log FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
    EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS relay_fund_log_%s PARTITION OF relay_fund_log FOR VALUES FROM (%s) TO (%s)', current_key, current_key, next_key);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION get_pending_balance(p_wallet VARCHAR(42))
RETURNS TABLE (
  recipient_user_id UUID,
  broker_id UUID,
  wallet_address VARCHAR(42),
  tier user_tier,
  pending_count BIGINT,
  total_gross NUMERIC,
  total_fee_amount NUMERIC,
  total_net NUMERIC,
  next_expiry TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    vpb.recipient_user_id,
    vpb.broker_id,
    vpb.wallet_address,
    vpb.tier,
    vpb.pending_count,
    vpb.total_gross,
    vpb.total_fee_amount,
    vpb.total_net,
    vpb.next_expiry
  FROM v_pending_balance vpb
  WHERE vpb.wallet_address = p_wallet;
END;
$$;

CREATE OR REPLACE VIEW v_pending_balance AS
SELECT
  sl.recipient_user_id,
  u.broker_id,
  u.wallet_address,
  u.tier,
  COUNT(*)::BIGINT AS pending_count,
  SUM(sl.gross_amount) AS total_gross,
  SUM(sl.fee_amount) AS total_fee_amount,
  SUM(sl.net_amount) AS total_net,
  MIN(sl.expires_at) AS next_expiry
FROM split_ledger sl
JOIN users u ON u.user_id = sl.recipient_user_id
WHERE sl.claim_status = 'pending_claim'
  AND u.wallet_address IS NOT NULL
  AND sl.partition_month BETWEEN TO_CHAR(NOW() - INTERVAL '7 months', 'YYYYMM')::INTEGER
                             AND TO_CHAR(NOW() + INTERVAL '1 month', 'YYYYMM')::INTEGER
GROUP BY sl.recipient_user_id, u.broker_id, u.wallet_address, u.tier;
