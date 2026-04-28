erDiagram
    brokers {
        uuid broker_id PK "UUID primary key"
        varchar name "120 chars"
        varchar slug "60 chars UNIQUE"
        text webhook_secret ""
        text webhook_url "nullable"
        text ref_api_url "nullable"
        boolean is_active "default TRUE"
        timestamptz created_at ""
        timestamptz updated_at ""
    }

    broker_wallets {
        uuid wallet_id PK "UUID primary key"
        uuid broker_id FK "NOT NULL -> brokers"
        wallet_type wallet_type "NOT NULL enum: treasury, relay_fund"
        varchar wallet_address "42 chars CHECK 0x40 hex"
        varchar label "120 chars nullable"
        boolean is_active "default TRUE"
        timestamptz created_at ""
        timestamptz updated_at ""
    }

    fee_configs {
        uuid config_id PK "UUID primary key"
        uuid broker_id FK "NOT NULL -> brokers"
        numeric gas_fee "10,6 default 0.100000"
        boolean is_current "default FALSE"
        timestamptz created_at ""
    }

    users {
        uuid user_id PK "UUID primary key"
        uuid broker_id FK "NOT NULL -> brokers"
        user_tier tier "NOT NULL enum: f0, f1, f2"
        varchar wallet_address "42 chars CHECK 0x40 hex nullable"
        varchar email "255 chars UNIQUE"
        numeric rebate_rate_from_parent "10,4 default 0 CHECK >= 0"
        uuid parent_user_id FK "nullable -> users self-ref"
        smallint depth "default 0"
        ltree ltree_path "NOT NULL default placeholder"
        user_status status "default active enum: active, suspended, deleted"
        timestamptz created_at ""
        timestamptz updated_at ""
    }

    user_accounts {
        uuid account_id PK "UUID primary key"
        uuid user_id FK "NOT NULL -> users"
        uuid broker_id FK "NOT NULL -> brokers"
        platform platform "NOT NULL enum: mt4, mt5"
        varchar account_uid "128 chars NOT NULL"
        boolean is_active "default TRUE"
        timestamptz created_at ""
    }

    admin_roles {
        uuid role_id PK "UUID primary key"
        varchar role_name "50 chars UNIQUE"
        text description "nullable"
        boolean is_active "default TRUE"
        timestamptz created_at ""
        timestamptz updated_at ""
    }

    admin_permissions {
        varchar permission PK "80 chars primary key"
        varchar category "30 chars NOT NULL"
        text description "nullable"
        timestamptz created_at ""
    }

    admin_role_permissions {
        uuid role_id FK "NOT NULL -> admin_roles"
        varchar permission FK "NOT NULL -> admin_permissions"
        timestamptz granted_at "default NOW()"
    }

    admin_users {
        uuid admin_user_id PK "UUID primary key"
        varchar username "50 chars UNIQUE"
        text password_hash "NOT NULL"
        varchar email "255 chars UNIQUE"
        uuid role_id FK "nullable -> admin_roles"
        boolean is_active "default TRUE"
        timestamptz last_login_at "nullable"
        timestamptz created_at ""
        timestamptz updated_at ""
    }

    webhook_logs {
        uuid log_id PK "UUID default"
        uuid broker_id FK "nullable -> brokers"
        varchar tx_id "128 chars nullable"
        smallint http_status "nullable"
        hmac_valid hmac_valid "NOT NULL default missing enum: valid, invalid, missing"
        jsonb raw_payload "nullable"
        text error_msg "nullable"
        timestamptz received_at "NOT NULL default NOW()"
        integer log_month PK "PARTITION KEY"
    }

    rebate_event_idempotency {
        uuid broker_id PK "FK -> brokers"
        varchar tx_id PK "Transaction ID from broker"
        uuid event_id "FK -> rebate_events"
        timestamptz created_at "default NOW()"
    }

    rebate_events {
        uuid event_id PK "UUID default"
        uuid broker_id FK "NOT NULL -> brokers"
        uuid fee_config_id FK "NOT NULL -> fee_configs(config_id)"
        varchar tx_id "128 chars NOT NULL"
        uuid f0_user_id FK "NOT NULL -> users"
        numeric total_usdt "18,6 NOT NULL CHECK > 0"
        event_status status "NOT NULL default pending enum: pending, processing, distributed, failed"
        text error_msg "nullable"
        timestamptz occurred_at "NOT NULL"
        integer partition_month PK "PARTITION KEY"
        timestamptz created_at ""
        timestamptz updated_at ""
    }

    split_ledger {
        uuid ledger_id PK "UUID default"
        uuid event_id FK "NOT NULL -> rebate_events(event_id)"
        integer event_partition_month FK "NOT NULL -> rebate_events(partition_month)"
        uuid recipient_user_id FK "NOT NULL -> users"
        uuid broker_id FK "NOT NULL -> brokers"
        user_tier tier "NOT NULL enum: f0, f1, f2"
        numeric gross_amount "18,6 NOT NULL"
        numeric relayer_fee "18,6 default 0.100000"
        numeric dev_fee "18,6 default 0.400000"
        numeric fee_amount "18,6 GENERATED (relayer_fee + dev_fee)"
        numeric net_amount "18,6 NOT NULL"
        claim_status claim_status "NOT NULL default pending_claim enum: pending_claim, claimed, expired, swept"
        bytea sc_payout_id "nullable"
        varchar claim_tx_hash "66 chars nullable"
        timestamptz claimed_at "nullable"
        timestamptz expires_at "NOT NULL"
        integer partition_month PK "PARTITION KEY"
        timestamptz created_at ""
    }

    sc_sync_log {
        uuid sync_id PK "UUID default"
        uuid ledger_id "NOT NULL"
        varchar sc_tx_hash "66 chars nullable"
        sync_direction direction "NOT NULL enum: allocate, claim"
        sync_status status "NOT NULL default pending enum: pending, confirmed, failed"
        smallint attempt "NOT NULL default 1"
        text error_msg "nullable"
        timestamptz synced_at "NOT NULL default NOW()"
        integer synced_month PK "PARTITION KEY"
    }

    relay_fund_log {
        uuid log_id PK "UUID default"
        uuid ledger_id "NOT NULL"
        uuid broker_id FK "NOT NULL -> brokers"
        numeric bnb_used "18,8 NOT NULL"
        numeric bnb_price_usd "10,4 NOT NULL"
        numeric usdt_collected "10,6 NOT NULL"
        numeric pnl "10,6 GENERATED STORED"
        timestamptz logged_at "NOT NULL default NOW()"
        integer log_month PK "PARTITION KEY"
    }

    dead_letter_queue {
        uuid dlq_id PK "UUID primary key"
        dlq_source source_table "NOT NULL enum: rebate_events, split_ledger, sc_sync_log, relay_fund_log"
        uuid source_id "NOT NULL"
        uuid event_id "nullable"
        text reason "NOT NULL"
        smallint attempt_count "NOT NULL default 5"
        varchar resolved_by "120 chars nullable"
        text resolution "nullable"
        timestamptz created_at "NOT NULL default NOW()"
        timestamptz resolved_at "nullable"
    }

    wallet_link_codes {
        uuid code_id PK "UUID primary key"
        uuid user_id FK "NOT NULL -> users"
        varchar wallet_address "42 chars CHECK 0x40 hex"
        varchar code "6 chars CHECK 6-digit"
        timestamptz expires_at "NOT NULL"
        boolean used "NOT NULL default FALSE"
        timestamptz created_at ""
    }

    rebate_rate_history {
        uuid history_id PK "UUID primary key"
        uuid user_id FK "NOT NULL -> users"
        uuid changed_by_user_id FK "NOT NULL -> users"
        numeric old_rate "10,4 NOT NULL"
        numeric new_rate "10,4 NOT NULL"
        text reason "nullable"
        timestamptz changed_at "NOT NULL default NOW()"
    }

    brokers ||--o{ broker_wallets : "1:N"
    brokers ||--o{ fee_configs : "1:N"
    brokers ||--o{ users : "1:N"
    users ||--o{ users : "self-ref: parent_user_id"
    users ||--o{ user_accounts : "1:N"
    brokers ||--o{ user_accounts : "1:N"
    brokers ||--o{ webhook_logs : "1:N"
    brokers ||--o{ rebate_event_idempotency : "1:N"
    rebate_event_idempotency }o--|| rebate_events : "1:1"
    brokers ||--o{ rebate_events : "1:N"
    brokers ||--o{ relay_fund_log : "1:N"
    fee_configs ||--o{ rebate_events : "1:N"
    users ||--o{ rebate_events : "F0 rebate generator"
    users ||--o{ split_ledger : "recipient"
    brokers ||--o{ split_ledger : "1:N"
    rebate_events ||--o{ split_ledger : "1:N FK(event_id,partition_month)"
    split_ledger ||--o{ sc_sync_log : "1:N"
    admin_roles ||--o{ admin_role_permissions : "1:N"
    admin_permissions ||--o{ admin_role_permissions : "1:N"
    admin_roles ||--o{ admin_users : "1:N"
    users ||--o{ wallet_link_codes : "1:N"
    users ||--o{ rebate_rate_history : "1:N"