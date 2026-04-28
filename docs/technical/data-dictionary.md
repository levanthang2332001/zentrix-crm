# Data Dictionary - Zentrix Backend

Tài liệu này mô tả chi tiết tất cả các bảng (tables) và các cột (columns) trong database của Zentrix.

---

## Mục lục

1. [brokers](#1-brokers)
2. [broker_wallets](#2-broker_wallets)
3. [fee_configs](#3-fee_configs)
4. [users](#4-users)
5. [user_accounts](#5-user_accounts)
6. [webhook_logs](#6-webhook_logs)
7. [rebate_event_idempotency](#7-rebate_event_idempotency)
8. [rebate_events](#8-rebate_events)
9. [split_ledger](#9-split_ledger)
10. [sc_sync_log](#10-sc_sync_log)
11. [relay_fund_log](#11-relay_fund_log)
12. [dead_letter_queue](#12-dead_letter_queue)
13. [wallet_link_codes](#13-wallet_link_codes)
14. [rebate_rate_history](#14-rebate_rate_history)
15. [admin_roles](#15-admin_roles)
16. [admin_permissions](#16-admin_permissions)
17. [admin_role_permissions](#17-admin_role_permissions)
18. [admin_users](#18-admin_users)

---

## 1. brokers

Lưu thông tin broker/exchange partners.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `broker_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `name` | VARCHAR(120) | NO | - | Tên broker (VD: "Exness", "IC Markets") |
| `slug` | VARCHAR(60) | NO | - | Slug unique cho API (VD: "exness", "icmarkets") |
| `webhook_secret` | TEXT | NO | - | Secret key để verify HMAC từ broker webhook |
| `webhook_url` | TEXT | YES | - | URL broker gửi webhook về (nullable) |
| `ref_api_url` | TEXT | YES | - | API URL để verify MT4/MT5 UID với broker |
| `is_active` | BOOLEAN | NO | TRUE | Broker có đang active không |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm cập nhật cuối |

**Ví dụ:**
```json
{
  "broker_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Exness",
  "slug": "exness",
  "webhook_secret": "whsec_xxxxx",
  "webhook_url": "https://api.zentrix.io/webhooks/rebate",
  "ref_api_url": "https://api.exness.com/verify-uid",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

---

## 2. broker_wallets

Lưu ví của broker để funding SMC và trả gas.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `wallet_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `broker_id` | UUID | NO | - | FK → brokers |
| `wallet_type` | ENUM | NO | - | `treasury` hoặc `relay_fund` |
| `wallet_address` | VARCHAR(42) | NO | - | Địa chỉ ví EVM (0x...) |
| `label` | VARCHAR(120) | YES | - | Nhãn ví (VD: "Main Treasury", "Gas Pool") |
| `is_active` | BOOLEAN | NO | TRUE | Ví có đang active không |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm cập nhật cuối |

**wallet_type ENUM values:**
- `treasury` → Ví chứa USDT để nạp vào SMC (fund)
- `relay_fund` → Ví chứa BNB để trả gas cho tx allocate

**Ví dụ:**
```json
{
  "wallet_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "broker_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "wallet_type": "treasury",
  "wallet_address": "0x1111111111111111111111111111111111111111",
  "label": "Main Treasury",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

---

## 3. fee_configs

Lưu cấu hình phí cho mỗi broker.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `config_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `broker_id` | UUID | NO | - | FK → brokers |
| `gas_fee` | NUMERIC(10,6) | NO | 0.100000 | Phí trả cho relayer (gas reimbursement) = 0.1 USDT |
| `is_current` | BOOLEAN | NO | FALSE | Đây có phải config hiện tại không |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |

**Ví dụ:**
```json
{
  "config_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "broker_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "gas_fee": "0.100000",
  "is_current": true,
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

**Note:** Dev fee (0.4 USDT) là fixed constant trong SMC contract, không lưu trong DB.

---

## 4. users

Lưu thông tin user. **1 user có thể có nhiều rows** (1 row per broker), với tier và rebate_rate khác nhau trên mỗi broker.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `user_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `broker_id` | UUID | NO | - | FK → brokers |
| `tier` | ENUM | NO | - | `f0`, `f1`, hoặc `f2` |
| `wallet_address` | VARCHAR(42) | YES | - | Địa chỉ ví EVM (nullable - có thể chưa có ví) |
| `email` | VARCHAR(255) | NO | - | Email user (UNIQUE global) |
| `rebate_rate_from_parent` | NUMERIC(10,4) | NO | 0 | Rate ($/lot) mà parent set cho user này |
| `parent_user_id` | UUID | YES | - | FK → users (parent trong cây referral) |
| `depth` | SMALLINT | NO | 0 | Độ sâu: 0=F0, 1=F1, 2=F2 |
| `ltree_path` | LTREE | NO | 'placeholder' | Materialized path cho hierarchical queries |
| `status` | ENUM | NO | 'active' | `active`, `suspended`, hoặc `deleted` |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm cập nhật cuối |

**tier ENUM values:**
- `f0` → Campaign Manager (CM) - root, tạo ra rebate
- `f1` → Introducing Broker (IB) - giới thiệu F2
- `f2` → End User - người trade cuối cùng

**Ví dụ - 1 user có 2 broker:**

```json
// Row 1: User trade trên Exness với tier F1
{
  "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "broker_id": "broker_exness_id",
  "tier": "f1",
  "wallet_address": "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
  "email": "tran@email.com",
  "rebate_rate_from_parent": "0.5000",
  "parent_user_id": "f0_exness_user_id",
  "depth": 1,
  "ltree_path": "ua1b2c3d4.ud5e6f7a8",
  "status": "active",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}

// Row 2: Cùng user trade trên IC Markets với tier F2
{
  "user_id": "u9z8y7x6-w5v4-3210-9876-543210fedcba",
  "broker_id": "broker_icmarkets_id",
  "tier": "f2",
  "wallet_address": "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",  // cùng ví!
  "email": "tran@email.com",  // cùng email!
  "rebate_rate_from_parent": "0.3000",  // rate khác!
  "parent_user_id": "f1_icmarkets_user_id",
  "depth": 2,
  "ltree_path": "ux9y8z7w6.uw5v4u3x2",
  "status": "active",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

**Note:** `email` là UNIQUE global (1 user = 1 email = 1 wallet), nhưng `broker_id` có thể khác nhau tạo nhiều rows.

---

## 5. user_accounts

Lưu tài khoản MT4/MT5 của user. **1 user có thể có nhiều accounts** trên cùng broker (nhiều MT4/MT5 IDs).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `account_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | FK → users |
| `broker_id` | UUID | NO | - | FK → brokers |
| `platform` | ENUM | NO | - | `mt4` hoặc `mt5` |
| `account_uid` | VARCHAR(128) | NO | - | MT4/MT5 login ID |
| `is_active` | BOOLEAN | NO | TRUE | Account có đang active không |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |

**platform ENUM values:**
- `mt4` → MetaTrader 4
- `mt5` → MetaTrader 5

**Ví dụ:**

```json
// User có 3 tài khoản trên Exness
[
  {
    "account_id": "acc001",
    "user_id": "u1a2b3c4-...",
    "broker_id": "broker_exness_id",
    "platform": "mt4",
    "account_uid": "12345678",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "account_id": "acc002",
    "user_id": "u1a2b3c4-...",
    "broker_id": "broker_exness_id",
    "platform": "mt5",
    "account_uid": "87654321",
    "is_active": true,
    "created_at": "2026-01-02T00:00:00.000Z"
  },
  {
    "account_id": "acc003",
    "user_id": "u1a2b3c4-...",
    "broker_id": "broker_exness_id",
    "platform": "mt4",
    "account_uid": "11111111",
    "is_active": true,
    "created_at": "2026-01-03T00:00:00.000Z"
  }
]
```

---

## 6. webhook_logs

Ghi log tất cả webhook requests. **Partitioned by `log_month`**.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `log_id` | UUID | NO | uuid_generate_v4() | Primary key (part of composite PK) |
| `broker_id` | UUID | YES | - | FK → brokers (nullable - có thể resolve failed) |
| `tx_id` | VARCHAR(128) | YES | - | Transaction ID từ broker |
| `http_status` | SMALLINT | YES | - | HTTP status code response |
| `hmac_valid` | ENUM | NO | 'missing' | `valid`, `invalid`, hoặc `missing` |
| `raw_payload` | JSONB | YES | - | Raw JSON payload từ broker |
| `error_msg` | TEXT | YES | - | Error message nếu có |
| `received_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm nhận webhook |
| `log_month` | INTEGER | NO | TO_CHAR(NOW(),'YYYYMM') | Partition key (part of composite PK) |

**hmac_valid ENUM values:**
- `valid` → HMAC signature hợp lệ
- `invalid` → HMAC signature không hợp lệ
- `missing` → Không có signature

**Ví dụ:**
```json
{
  "log_id": "log001abc",
  "broker_id": "broker_exness_id",
  "tx_id": "broker_tx_123456",
  "http_status": 202,
  "hmac_valid": "valid",
  "raw_payload": { "txId": "broker_tx_123456", "totalUsdt": "200.000000" },
  "error_msg": null,
  "received_at": "2026-04-26T10:00:00.000Z",
  "log_month": 202604
}
```

---

## 7. rebate_event_idempotency

Bảng idempotency để đảm bảo không duplicate webhook. Non-partitioned.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `broker_id` | UUID | NO | - | FK → brokers |
| `tx_id` | VARCHAR(128) | NO | - | Transaction ID từ broker |
| `event_id` | UUID | NO | - | FK → rebate_events |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |

**Primary Key:** `(broker_id, tx_id)` - đảm bảo unique globally

**Ví dụ:**
```json
{
  "broker_id": "broker_exness_id",
  "tx_id": "broker_tx_123456",
  "event_id": "event001abc",
  "created_at": "2026-04-26T10:00:00.000Z"
}
```

---

## 8. rebate_events

Lưu rebate events từ broker webhook. **Partitioned by `partition_month`**.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `event_id` | UUID | NO | uuid_generate_v4() | Primary key (part of composite PK) |
| `broker_id` | UUID | NO | - | FK → brokers |
| `fee_config_id` | UUID | NO | - | FK → fee_configs |
| `tx_id` | VARCHAR(128) | NO | - | Transaction ID từ broker |
| `f0_user_id` | UUID | NO | - | FK → users (F0 user nhận rebate) |
| `total_usdt` | NUMERIC(18,6) | NO | - | Tổng USDT rebate từ sàn |
| `status` | ENUM | NO | 'pending' | `pending`, `processing`, `distributed`, `failed` |
| `error_msg` | TEXT | YES | - | Error message nếu failed |
| `occurred_at` | TIMESTAMPTZ | NO | - | Thời điểm trade xảy ra |
| `partition_month` | INTEGER | NO | - | Partition key (part of composite PK) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm cập nhật cuối |

**status ENUM values:**
- `pending` → Đang chờ process
- `processing` → Đang xử lý split
- `distributed` → Đã tạo split_ledger
- `failed` → Xử lý thất bại

**Ví dụ:**
```json
{
  "event_id": "event001abc",
  "broker_id": "broker_exness_id",
  "fee_config_id": "config001",
  "tx_id": "broker_tx_123456",
  "f0_user_id": "f0_user_id",
  "total_usdt": "200.000000",
  "status": "distributed",
  "error_msg": null,
  "occurred_at": "2026-04-26T08:00:00.000Z",
  "partition_month": 202604,
  "created_at": "2026-04-26T10:00:00.000Z",
  "updated_at": "2026-04-26T10:05:00.000Z"
}
```

---

## 9. split_ledger

Lưu phân bổ rebate cho từng user (F0/F1/F2). **Partitioned by `partition_month`**.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `ledger_id` | UUID | NO | uuid_generate_v4() | Primary key (part of composite PK) |
| `event_id` | UUID | NO | - | FK → rebate_events |
| `event_partition_month` | INTEGER | NO | - | FK → rebate_events(partition_month) |
| `recipient_user_id` | UUID | NO | - | FK → users (user nhận rebate) |
| `broker_id` | UUID | NO | - | FK → brokers |
| `tier` | ENUM | NO | - | `f0`, `f1`, hoặc `f2` |
| `gross_amount` | NUMERIC(18,6) | NO | - | Tổng allocated (trước fee) |
| `relayer_fee` | NUMERIC(18,6) | NO | 0.100000 | Phí trả gas = 0.1 USDT |
| `dev_fee` | NUMERIC(18,6) | NO | 0.400000 | Phí dev = 0.4 USDT |
| `fee_amount` | NUMERIC(18,6) | NO | GENERATED | = relayer_fee + dev_fee |
| `net_amount` | NUMERIC(18,6) | NO | - | = gross_amount - fee_amount (user nhận) |
| `claim_status` | ENUM | NO | 'pending_claim' | `pending_claim`, `claimed`, `expired`, `swept` |
| `sc_payout_id` | BYTEA | YES | - | Payout ID trên blockchain |
| `claim_tx_hash` | VARCHAR(66) | YES | - | Transaction hash khi claim |
| `claimed_at` | TIMESTAMPTZ | YES | - | Thời điểm claim thành công |
| `expires_at` | TIMESTAMPTZ | NO | - | Thời điểm hết hạn claim |
| `partition_month` | INTEGER | NO | - | Partition key (part of composite PK) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |

**claim_status ENUM values:**
- `pending_claim` → Chờ user claim
- `claimed` → User đã claim thành công
- `expired` → Hết hạn, không thể claim
- `swept` → Đã được sweep về treasury

**Fee Calculation Example:**
```
gross_amount = 1.000000 USDT
relayer_fee  = 0.100000 USDT (fixed)
dev_fee      = 0.400000 USDT (fixed)
fee_amount   = 0.500000 USDT (auto: 0.1 + 0.4)
net_amount   = 0.500000 USDT (1.0 - 0.5)

Khi user claim thành công:
- User nhận:   0.500000 USDT
- Relayer nhận: 0.100000 USDT (gas reimbursement)
- Dev nhận:    0.400000 USDT
```

**Ví dụ:**
```json
{
  "ledger_id": "ledger001",
  "event_id": "event001abc",
  "event_partition_month": 202604,
  "recipient_user_id": "user_f1_id",
  "broker_id": "broker_exness_id",
  "tier": "f1",
  "gross_amount": "1.000000",
  "relayer_fee": "0.100000",
  "dev_fee": "0.400000",
  "fee_amount": "0.500000",
  "net_amount": "0.500000",
  "claim_status": "pending_claim",
  "sc_payout_id": null,
  "claim_tx_hash": null,
  "claimed_at": null,
  "expires_at": "2026-10-23T00:00:00.000Z",
  "partition_month": 202604,
  "created_at": "2026-04-26T10:05:00.000Z"
}
```

---

## 10. sc_sync_log

Ghi log sync trạng thái với blockchain (allocate/claim). **Partitioned by `synced_month`**.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `sync_id` | UUID | NO | uuid_generate_v4() | Primary key (part of composite PK) |
| `ledger_id` | UUID | NO | - | FK → split_ledger |
| `sc_tx_hash` | VARCHAR(66) | YES | - | Transaction hash trên blockchain |
| `direction` | ENUM | NO | - | `allocate` hoặc `claim` |
| `status` | ENUM | NO | 'pending' | `pending`, `confirmed`, `failed` |
| `attempt` | SMALLINT | NO | 1 | Số lần thử |
| `error_msg` | TEXT | YES | - | Error message nếu failed |
| `synced_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm sync |
| `synced_month` | INTEGER | NO | - | Partition key (part of composite PK) |

**direction ENUM values:**
- `allocate` → Ghi allocation vào SMC
- `claim` → User claim từ SMC

**status ENUM values:**
- `pending` → Đang chờ confirm
- `confirmed` → Đã confirm on-chain
- `failed` → Thất bại

**Ví dụ:**
```json
{
  "sync_id": "sync001",
  "ledger_id": "ledger001",
  "sc_tx_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "direction": "allocate",
  "status": "confirmed",
  "attempt": 1,
  "error_msg": null,
  "synced_at": "2026-04-26T10:10:00.000Z",
  "synced_month": 202604
}
```

---

## 11. relay_fund_log

Ghi log relay fund (gas P&L). **Partitioned by `log_month`**.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `log_id` | UUID | NO | uuid_generate_v4() | Primary key (part of composite PK) |
| `ledger_id` | UUID | NO | - | FK → split_ledger |
| `broker_id` | UUID | NO | - | FK → brokers |
| `bnb_used` | NUMERIC(18,8) | NO | - | Số BNB đã dùng trả gas |
| `bnb_price_usd` | NUMERIC(10,4) | NO | - | Giá BNB theo USD tại thời điểm |
| `usdt_collected` | NUMERIC(10,6) | NO | - | Số USDT thu được từ relayer_fee |
| `pnl` | NUMERIC(10,6) | NO | GENERATED | = usdt_collected - bnb_used * bnb_price_usd |
| `logged_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm ghi log |
| `log_month` | INTEGER | NO | - | Partition key (part of composite PK) |

**Ví dụ:**
```json
{
  "log_id": "relay001",
  "ledger_id": "ledger001",
  "broker_id": "broker_exness_id",
  "bnb_used": "0.05000000",
  "bnb_price_usd": "600.0000",
  "usdt_collected": "0.100000",
  "pnl": "0.100000 - (0.05 * 600) = -29.9",
  "logged_at": "2026-04-26T10:10:00.000Z",
  "log_month": 202604
}
```

---

## 12. dead_letter_queue

Lưu các job/record bị failed vĩnh viễn, cần manual intervention.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `dlq_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `source_table` | ENUM | NO | - | Bảng nguồn gây lỗi |
| `source_id` | UUID | NO | - | ID của record gây lỗi |
| `event_id` | UUID | YES | - | Event liên quan (nếu có) |
| `reason` | TEXT | NO | - | Lý do failed |
| `attempt_count` | SMALLINT | NO | 5 | Số lần thử đã thất bại |
| `resolved_by` | VARCHAR(120) | YES | - | Ai đã resolve |
| `resolution` | TEXT | YES | - | Cách resolve |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm vào DLQ |
| `resolved_at` | TIMESTAMPTZ | YES | - | Thời điểm resolve |

**source_table ENUM values:**
- `rebate_events`
- `split_ledger`
- `sc_sync_log`
- `relay_fund_log`

**Ví dụ:**
```json
{
  "dlq_id": "dlq001",
  "source_table": "split_ledger",
  "source_id": "ledger001",
  "event_id": "event001abc",
  "reason": "SMC contract reverted: insufficient balance",
  "attempt_count": 5,
  "resolved_by": null,
  "resolution": null,
  "created_at": "2026-04-26T10:30:00.000Z",
  "resolved_at": null
}
```

---

## 13. wallet_link_codes

Lưu mã xác thực email để link ví (trong quá trình onboarding).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `code_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | FK → users |
| `wallet_address` | VARCHAR(42) | NO | - | Ví cần link |
| `code` | VARCHAR(6) | NO | - | Mã 6 số |
| `expires_at` | TIMESTAMPTZ | NO | - | Thời điểm hết hạn (15 phút) |
| `used` | BOOLEAN | NO | FALSE | Đã sử dụng chưa |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |

**Ví dụ:**
```json
{
  "code_id": "code001",
  "user_id": "user001",
  "wallet_address": "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
  "code": "123456",
  "expires_at": "2026-04-26T10:15:00.000Z",
  "used": false,
  "created_at": "2026-04-26T10:00:00.000Z"
}
```

**Luồng sử dụng:**
```
1. POST /auth/request-wallet-link → Tạo code, lưu vào đây
2. User nhận email, nhập code
3. POST /auth/confirm-wallet-link → Verify code
4. Update users.wallet_address → Set ví
5. Mark used = true
```

---

## 14. rebate_rate_history

Ghi log thay đổi rebate rate.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `history_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | FK → users (user bị thay đổi rate) |
| `changed_by_user_id` | UUID | NO | - | FK → users (ai thay đổi) |
| `old_rate` | NUMERIC(10,4) | NO | - | Rate cũ |
| `new_rate` | NUMERIC(10,4) | NO | - | Rate mới |
| `reason` | TEXT | YES | - | Lý do thay đổi |
| `changed_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm thay đổi |

**Ví dụ:**
```json
{
  "history_id": "hist001",
  "user_id": "user_f2_id",
  "changed_by_user_id": "user_f1_id",
  "old_rate": "0.3000",
  "new_rate": "0.5000",
  "reason": "Increased rate for high volume performer",
  "changed_at": "2026-04-26T12:00:00.000Z"
}
```

---

## 15. admin_roles

Lưu roles cho admin users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `role_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `role_name` | VARCHAR(50) | NO | - | Tên role (UNIQUE) |
| `description` | TEXT | YES | - | Mô tả role |
| `is_active` | BOOLEAN | NO | TRUE | Role có đang active không |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm cập nhật cuối |

**Ví dụ:**
```json
{
  "role_id": "role001",
  "role_name": "super_admin",
  "description": "Full system access - all permissions",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

---

## 16. admin_permissions

Lưu danh sách permissions có thể assign.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `permission` | VARCHAR(80) | NO | - | Primary key - VD: "broker:create" |
| `category` | VARCHAR(30) | NO | - | Nhóm permission (broker, user, rebate...) |
| `description` | TEXT | YES | - | Mô tả permission |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |

**Ví dụ:**
```json
{
  "permission": "broker:create",
  "category": "broker",
  "description": "Create new broker",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

---

## 17. admin_role_permissions

Junction table giữa roles và permissions (many-to-many).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `role_id` | UUID | NO | - | FK → admin_roles |
| `permission` | VARCHAR(80) | NO | - | FK → admin_permissions |
| `granted_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm grant |

**Primary Key:** `(role_id, permission)`

**Ví dụ:**
```json
{
  "role_id": "role001",
  "permission": "broker:create",
  "granted_at": "2026-01-01T00:00:00.000Z"
}
```

---

## 18. admin_users

Lưu thông tin admin users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `admin_user_id` | UUID | NO | uuid_generate_v4() | Primary key |
| `username` | VARCHAR(50) | NO | - | Username (UNIQUE) |
| `password_hash` | TEXT | NO | - | Bcrypt password hash |
| `email` | VARCHAR(255) | NO | - | Email (UNIQUE) |
| `role_id` | UUID | YES | - | FK → admin_roles |
| `is_active` | BOOLEAN | NO | TRUE | Admin có đang active không |
| `last_login_at` | TIMESTAMPTZ | YES | - | Thời điểm login cuối |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Thời điểm cập nhật cuối |

**Ví dụ:**
```json
{
  "admin_user_id": "admin001",
  "username": "admin_zentrix",
  "password_hash": "$2b$12$...",
  "email": "admin@zentrix.io",
  "role_id": "role001",
  "is_active": true,
  "last_login_at": "2026-04-26T10:00:00.000Z",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-04-26T10:00:00.000Z"
}
```

---

## Summary

| Table | Partitioned | Mô tả |
|-------|-------------|-------|
| `brokers` | No | Thông tin broker partners |
| `broker_wallets` | No | Ví của broker (treasury + relay_fund) |
| `fee_configs` | No | Cấu hình phí cho broker |
| `users` | No | User identity (1 user = N rows per broker) |
| `user_accounts` | No | MT4/MT5 accounts của user |
| `webhook_logs` | Yes (log_month) | Log webhook requests |
| `rebate_event_idempotency` | No | Đảm bảo không duplicate webhook |
| `rebate_events` | Yes (partition_month) | Rebate events từ broker |
| `split_ledger` | Yes (partition_month) | Phân bổ rebate cho F0/F1/F2 |
| `sc_sync_log` | Yes (synced_month) | Sync trạng thái blockchain |
| `relay_fund_log` | Yes (log_month) | Gas P&L tracking |
| `dead_letter_queue` | No | Failed jobs cần manual intervention |
| `wallet_link_codes` | No | Mã xác thực link ví |
| `rebate_rate_history` | No | Log thay đổi rebate rate |
| `admin_roles` | No | Admin roles |
| `admin_permissions` | No | Permission definitions |
| `admin_role_permissions` | No | Role-Permission mapping |
| `admin_users` | No | Admin user accounts |