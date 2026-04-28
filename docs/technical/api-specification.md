# Zentrix Backend MVP Spec (Off-chain First)

## 1) Mục tiêu

Build một **backend MVP** sẵn sàng production cho phân phối rebate mà không cần tích hợp smart contract trong phase 1.

Hệ thống phải:

- Nhận webhook rebate từ broker một cách bảo mật (HMAC).
- Enforce idempotency bằng `broker_id + tx_id`.
- Tính toán referral split cho F0/F1/F2.
- Lưu ledger entries và expose pending balances.
- Chạy hoàn toàn off-chain hiện tại, đồng thời giữ `chain-sync` module như một mockable stub.

Non-goal (phase 1):

- Không có on-chain transaction thực sự.
- Không có frontend scope trong spec này.

## 2) Tech & Runtime

- Language: TypeScript (Node.js 20+)
- Framework: **NestJS**
- DB: PostgreSQL 15+
- Queue/Background jobs: Redis + BullMQ
- HTTP format: JSON over REST
- Timezone: UTC cho tất cả persisted timestamps

## 3) MVP Database Scope

Chỉ sử dụng các bảng sau cho phase 1:

- `brokers`
- `broker_wallets`
- `fee_configs`
- `users`
- `user_accounts`
- `webhook_logs` (partitioned by `log_month`)
- `rebate_event_idempotency`
- `rebate_events` (partitioned by `partition_month`)
- `split_ledger` (partitioned by `partition_month`)
- `sc_sync_log` (mock/stub behavior only)
- `v_pending_balance` view

Out of scope cho phase 1:

- `relay_fund_log`
- `dead_letter_queue`
- advanced analytics views
- `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_users` (admin RBAC — phase 2)

## 4) Domain Rules

### 4.1 Broker + Webhook

- Mỗi broker có `webhook_secret`.
- Inbound webhook phải pass HMAC validation.
- Luôn ghi `webhook_logs` cho cả success và failure cases.

### 4.2 Idempotency

- Global unique key: `(broker_id, tx_id)` in `rebate_event_idempotency`.
- `rebate_events` is partitioned by `partition_month`, so DB-level global idempotency is enforced by the non-partitioned idempotency table instead of a unique key only on the partitioned event table.
- Use `create_rebate_event(...)` for raw SQL event creation; it derives `partition_month` from `occurredAt`, writes idempotency, and inserts `rebate_events`.
- Webhook được deliver lại với cùng tx id phải trả về success-safe response và không duplicate events.

### 4.3 Referral Model

- Các tier được hỗ trợ: `f0`, `f1`, `f2`.
- User hierarchy được biểu diễn qua `parent_user_id` và `ltree_path`.
- User tier được resolve qua `user_accounts.account_uid` (MT4/MT5 ID) mapping từ broker data tại thời điểm connect.
- Rebate rates được set per-user qua `users.rebate_rate_from_parent` ($/lot):
  - F0 set rate cho mỗi F1 child.
  - F1 set rate cho mỗi F2 child.
- Split calculation per rebate event:
  - F0 nhận: `totalUsdt - sum(F1_gross) - sum(F2_gross)`
  - F1 gross: `F1's rebate_rate_from_parent × F1_total_lot`
  - F2 gross: `F2's rebate_rate_from_parent × F2_total_lot`
- Nếu không có valid downline node cho một tier, không allocation nào được tạo cho tier đó.

### 4.4 Fee & Claimability

- Sử dụng current fee config cho broker (`is_current = true`).
- Fee config includes `total_fee`, `gas_fee`, `protocol_fee`, `min_claim`, `expiry_days`, `effective_from`.
- `split_ledger` snapshots fees as `relayer_fee` and `dev_fee`; `fee_amount = relayer_fee + dev_fee`.
- `net_amount = gross_amount - fee_amount`.
- `claim_status` bắt đầu là `pending_claim`.
- `expires_at = created_at + expiry_days`.

### 4.5 Audit & History
- **Rebate Rate History**: Mọi thay đổi với `users.rebate_rate_from_parent` phải được log trong `rebate_rate_history`.
- **Audit Traceability**: Users (F1/F2) có thể xem rate history để verify việc phân phối đúng đắn.
- **Admin Audit**: Mọi admin operations phải được log kèm ID của người thực hiện thay đổi.

### 4.6 Off-chain Sync Stub

- `sc_sync_log` được dùng như internal simulation queue.
- Không có blockchain calls trong phase 1.
- Mock worker có thể chuyển `pending -> confirmed` để end-to-end validation.

## 5) Required API Endpoints

### 5.1 Common Request/Response Contract

Headers (tất cả endpoints):

- `Content-Type: application/json`
- `X-Request-Id: <uuid>` (optional từ client; generate nếu missing)

Success response envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

Error response envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload validation failed",
    "details": [
      {
        "field": "totalUsdt",
        "issue": "Must be a positive decimal string"
      }
    ]
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

### 5.2 POST `/webhooks/rebate`

Purpose: broker gửi rebate event.

Headers:

- `X-Broker-Slug: <slug>`
- `X-Signature: sha256=<hex-hmac>`
- `X-Timestamp: <unix-seconds>` (anti-replay window: 5 minutes)

Request body:

```json
{
  "txId": "broker_tx_123",
  "f0Wallet": "0x1111111111111111111111111111111111111111",
  "totalUsdt": "200.000000",
  "totalLot": "100.500000",
  "occurredAt": "2026-04-21T10:00:00.000Z",
  "details": [
    { "exchangeUid": "uid_f1_1", "lots": "40.500000" },
    { "exchangeUid": "uid_f2_1", "lots": "60.000000" }
  ]
}
```

Note: `totalUsdt` là tổng rebate amount mà F0 (CM) nhận từ broker, dựa trên total volume của F1+F2 downline.

Validation rules:

- `txId`: required, string, 1..128 chars
- `f0Wallet`: required, EVM address `^0x[a-fA-F0-9]{40}$`
- `totalUsdt`: required, decimal string with max 6 decimals, `> 0`
- `occurredAt`: required, ISO 8601 datetime
- reject request nếu `X-Timestamp` ngoài allowed drift window

Behavior:

- Resolve broker bằng `X-Broker-Slug`.
- Validate HMAC signature (`HMAC_SHA256(secret, timestamp + "." + rawBody)`).
- Insert `webhook_logs`.
- Resolve F0 user và current fee config.
- Create/reuse `rebate_events` via `create_rebate_event(...)` (idempotent by broker + tx id).
- `rebate_events.occurred_at` stores payload `occurredAt`; `partition_month` must match `occurred_at` in UTC month.
- Note: `ref_link_id` không còn được dùng; split được tính per-user dựa trên `users.rebate_rate_from_parent`.

Responses:

- `202 Accepted`: newly accepted event
- `200 OK`: duplicate idempotent event
- `401 Unauthorized`: invalid signature
- `404 Not Found`: unknown broker or f0 user
- `422 Unprocessable Entity`: valid JSON but invalid business constraints

Success example (`202`):

```json
{
  "success": true,
  "data": {
    "eventId": "c0db49ef-a0ef-4e55-a54d-cb9780f5fc6f",
    "status": "pending",
    "isIdempotentReplay": false
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

### 5.3 POST `/rebates/:eventId/process`

Purpose: trigger split distribution (manual trigger in MVP).

Behavior:

- Load pending event.
- Compute recipient rows:
  - F1 gross = `F1_lots * F1_rate_from_parent`
  - F2 gross = `F2_lots * F2_rate_from_parent`
  - F0 (CM) gross = `totalUsdt - sum(F1_gross) - sum(F2_gross)`
- Validation: Đảm bảo `sum(child_gross) <= totalUsdt`. Nếu vượt, mark event là `failed` và log a business rule violation.
- Insert vào `split_ledger` atomically sử dụng database transaction với pessimistic lock on event row.
- Mark event status: `distributed` or `failed`.
- Create `sc_sync_log` rows (`direction=allocate`, `status=pending`).

Validation:

- `eventId`: required UUID path param
- only events in `pending` status được processable

Responses:

- `200 OK`: processed successfully
- `409 Conflict`: event đang được processed hoặc đã processed
- `404 Not Found`: event not found

Success example:

```json
{
  "success": true,
  "data": {
    "eventId": "c0db49ef-a0ef-4e55-a54d-cb9780f5fc6f",
    "status": "distributed",
    "ledgerRowsCreated": 3
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

### 5.4 GET `/balances/pending?wallet=0x...`

Purpose: read pending balances cho một wallet.

Headers:
- `Authorization: Bearer <jwt>` (Required để verify wallet ownership)

Behavior:

- Verify JWT belongs to requested wallet.
- Resolve user by wallet.
- Query `v_pending_balance` or call `get_pending_balance(wallet)`, which wraps the view.
- Return totals và next expiry.

Validation:

- `wallet`: required query param, EVM address format

Responses:

- `200 OK`: found or empty balance
- `404 Not Found`: wallet not mapped to any user

### 5.5 GET `/events/:txId?brokerSlug=...`

Purpose: fetch event processing state.

Behavior:

- Return event + summary của related ledger rows.

Validation:

- `txId`: required, string, 1..128
- `brokerSlug`: required query param

### 5.6 POST `/admin/sync/:ledgerId/mock-confirm`

Purpose: dev-only endpoint để simulate chain confirmation.

Behavior:

- Update latest pending sync log to confirmed.
- Optional: mark ledger as claimed only khi claim simulation endpoint được explicitly called.

Validation:

- `ledgerId`: required UUID path param
- allowed only in non-production environments

### 5.7 GET `/users/me`
Purpose: get current authenticated user profile.
Headers: `Authorization: Bearer <jwt>`
Responses: `200 OK` (user data + tier + current rate)

### 5.8 PUT /users/:userId/rebate-rate
Purpose: set rebate rate cho direct child (F0 -> F1 or F1 -> F2).
Headers: `Authorization: Bearer <jwt>`
Body: `{ "newRate": string, "reason": string }`
Behavior:
- Verify target user là direct child của authenticated user.
- Update `users.rebate_rate_from_parent`.
- Log to `rebate_rate_history`.
Responses: `200 OK`, `403 Forbidden` (not your child)

### 5.9 POST `/accounts/connect-broker-uid`

Purpose: link user's exchange UID để resolve tier (F1/F2).

Headers:

- `Authorization: Bearer <jwt>`
- `X-Request-Id: <uuid>` (optional)

Request body:

```json
{
  "exchangeUid": "broker_uid_12345",
  "brokerSlug": "broker-a"
}
```

Validation rules:

- `exchangeUid`: required, string, 1..128 chars
- `brokerSlug`: required, string, 1..60 chars
- User phải được authenticated và sở hữu account đang được linked
- UID không được đã map với account khác
- UID phải tồn tại trong broker ref data và resolve về valid tier (F1 or F2)

Behavior:

- Resolve broker bằng slug và lấy `brokers.ref_api_url`.
- Call broker's UID validation API để confirm UID tồn tại và lấy tier (F1/F2).
- Map tier (F1 or F2) vào user và tạo `user_accounts` entry.
- Update `users.tier` nếu chưa set.
- Nếu tier đã set cho user này, return current state (idempotent).
- Nếu account_uid đã link với user khác, reject với CONFLICT.

Responses:

- `200 OK`: linked successfully hoặc đã linked (idempotent)
- `401 Unauthorized`: invalid or missing auth
- `404 Not Found`: unknown broker or UID not found in broker ref data
- `409 Conflict`: UID đã link với account khác
- `422 Unprocessable Entity`: UID cannot resolve về valid tier

Success example (`200`):

```json
{
  "success": true,
  "data": {
    "userId": "f0db49ef-a0ef-4e55-a54d-cb9780f5fc6f",
    "exchangeUid": "broker_uid_12345",
    "tier": "f1",
    "isIdempotent": false
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

### 5.10 POST `/auth/login`

Purpose: login với Clerk token → issue system JWT.

Request body:

```json
{
  "clerkToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Validation rules:

- `clerkToken`: required, non-empty string

Behavior:

- Verify Clerk token via `clerkClient.verifyToken()`.
- Extract `email` from Clerk session.
- Nếu user với email không tồn tại → create user với status `no_wallet`, tier `f2` (default), no wallet.
- Issue JWT access + refresh tokens.
- Return user profile (email, wallet_status, tier).

Responses:

- `200 OK`: login success với JWT
- `401 Unauthorized`: invalid or expired Clerk token

Success example (`200`):

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "userId": "f0db49ef-a0ef-4e55-a54d-cb9780f5fc6f",
      "email": "user@example.com",
      "walletAddress": null,
      "walletStatus": "no_wallet",
      "tier": "f2"
    }
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

### 5.11 POST `/auth/request-wallet-link`

Purpose: request email confirmation để link một wallet (requires JWT auth).

Headers: `Authorization: Bearer <jwt>`

Request body:

```json
{
  "walletAddress": "0x1111111111111111111111111111111111111111"
}
```

Validation rules:

- `walletAddress`: required, EVM address format `^0x[a-fA-F0-9]{40}$`

Behavior:

- Verify JWT belongs to requesting user.
- Generate 6-digit verification code, store với user_id + wallet + expiry (15 min).
- Send email đến user's Clerk email với code.
- Nếu wallet đã link với user khác → reject với CONFLICT.

Responses:

- `200 OK`: verification email sent
- `400 Bad Request`: invalid wallet format
- `401 Unauthorized`: missing or invalid JWT
- `409 Conflict`: wallet đã link với account khác

Success example (`200`):

```json
{
  "success": true,
  "data": {
    "message": "Verification code sent to user@example.com",
    "expiresAt": "2026-04-21T10:15:00.000Z"
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

### 5.12 POST `/auth/confirm-wallet-link`

Purpose: confirm wallet linking với verification code (requires JWT auth).

Headers: `Authorization: Bearer <jwt>`

Request body:

```json
{
  "walletAddress": "0x1111111111111111111111111111111111111111",
  "code": "123456"
}
```

Validation rules:

- `walletAddress`: required, EVM address format
- `code`: required, 6-digit string

Behavior:

- Verify code matches stored code for this user + wallet.
- Code không được expired (15 min) hoặc đã used.
- Update `users.wallet_address` và set status `active`.
- Mark code as used.
- Nếu wallet address đã link với user khác → reject với CONFLICT.

Responses:

- `200 OK`: wallet linked successfully
- `400 Bad Request`: invalid wallet or code format
- `401 Unauthorized`: missing or invalid JWT or code expired/wrong
- `409 Conflict`: wallet đã link với account khác

Success example (`200`):

```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "walletStatus": "active"
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

### 5.13 GET `/auth/me`

Purpose: get current authenticated user profile (email + wallet status).

Headers: `Authorization: Bearer <jwt>`

Responses: `200 OK`

Success example (`200`):

```json
{
  "success": true,
  "data": {
    "userId": "f0db49ef-a0ef-4e55-a54d-cb9780f5fc6f",
    "email": "user@example.com",
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "walletStatus": "active",
    "tier": "f2"
  },
  "meta": {
    "requestId": "a3b9a6f7-1bca-4d88-9dd0-12d603af1f90",
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

## 6) Background Jobs

### 6.1 Rebate Distributor Worker

- Pull pending events.
- **Bulk Insert Strategy**: Khi processing một event với nhiều recipients, sử dụng single bulk `INSERT` operation cho `split_ledger` rows (batch size: 500-1000) thay vì individual inserts để minimize database round-trips.
- Retry với exponential backoff.
- Hard fail -> mark event failed với `error_msg`.

### 6.2 Expiry Worker

- Schedule interval job.
- Move `split_ledger.claim_status` từ `pending_claim` sang `expired` khi `expires_at < now()`.

### 6.3 Mock Sync Worker

- Poll `sc_sync_log` where status = pending.
- Simulate confirmation/failure dựa trên deterministic rule (configurable).

## 7) Validation & Error Handling

### 7.1 Validation Strategy

- Sử dụng Zod cho params, query, headers, và body (separate schema per endpoint).
- Validate theo thứ tự này: headers -> path params -> query -> body -> business rules.
- Chỉ dùng coercion khi safe (`z.coerce.number` không được phép cho monetary fields).
- Monetary values phải giữ là decimal strings trong API layer, convert sử dụng safe decimal lib trong service layer.

### 7.2 Error Codes

Sử dụng một stable machine-readable error code set:

- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED_SIGNATURE` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `BUSINESS_RULE_VIOLATION` (422)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

### 7.3 Error Mapping Rules

- Zod parse errors -> `VALIDATION_ERROR` với per-field issues.
- Domain errors (missing fee config, inactive broker, invalid split) -> `BUSINESS_RULE_VIOLATION`.
- Duplicate unique constraint on idempotent create -> return `200` idempotent success (not error).
- Unexpected exceptions -> `INTERNAL_ERROR`; hide internal stack from response.

### 7.4 Logging Rules

- Log một dòng per request completion với `requestId`, route, statusCode, durationMs.
- Log errors với sanitized context:
  - include: `requestId`, `brokerId`, `txId`, `eventId` when available
  - exclude: webhook secret, raw HMAC, private keys
- Chỉ giữ raw payload trong `webhook_logs.raw_payload` với access controls.

### 7.5 Global Error Handler Requirements

- Centralized HTTP error middleware required.
- Luôn return standard error envelope.
- Preserve original HTTP status từ mapped domain error.
- Attach `requestId` vào mọi success và error response.

## 8) Observability

Minimum required:

- Structured logs với correlation id (`request_id`, `tx_id`, `event_id`).
- Metrics:
  - webhook accepted/rejected count
  - event processing latency
  - distribution success/failure count
  - pending claim total count
- Health endpoints:
  - `/health/live`
  - `/health/ready` (checks DB + Redis)

## 9) Security

- Validate HMAC với constant-time compare.
- Rate-limit webhook endpoint per broker IP/slug.
- Giữ admin endpoints disabled ngoài non-production environments.
- Store secrets in env vars only.

## 10) Performance & Scaling Strategy

### 10.1 Database Optimization
- **Bulk Operations**: Tất cả worker-driven database writes (Ledger, Sync Logs) PHẢI sử dụng bulk insertion.
- **Connection Pooling**: Sử dụng connection pooler (e.g., PgBouncer) in production để manage database connections efficiently.
- **Read Replicas**: Offload heavy read queries (e.g., admin reports, user history) sang read replicas nếu CPU usage on master DB vượt 70%.

### 10.2 Application Scaling
- **Horizontal Scaling**: NestJS API và Workers là stateless và có thể scale horizontally across multiple containers/nodes.
- **Queue Partitioning**: Nếu job volume trở nên extreme, partition BullMQ queues by broker or event type để distribute load across worker clusters.

## 11) Project Structure (NestJS)

```
src/
  main.ts
  app.module.ts
  config/
  common/
    decorators/
    filters/           # Global error handler
    guards/            # Auth guards
    interceptors/      # Logging, response envelope
    pipes/             # Validation pipe (Zod)
  database/
    migrations/
    entities/          # TypeORM entities
  modules/
    brokers/
    webhooks/
      dto/
      webhook.controller.ts
      webhook.service.ts
    rebate-events/
    split-ledger/
    balances/
    chain-sync/
    admin/
    auth/
  workers/
    rebate-distributor.processor.ts
    expiry.processor.ts
    mock-sync.processor.ts
  libs/
    crypto/            # HMAC validation
    errors/            # Error code enum + helpers
    logger/            # Structured logger
```

## 11) Definition of Done (MVP)

MVP hoàn thành khi:

- Webhook ingestion hoạt động với HMAC validation.
- Idempotent duplicate webhook handling được verify.
- Event distribution tạo correct ledger rows.
- Pending balance API trả về correct aggregates.
- Expiry job updates stale pending claims.
- Mock sync flow updates `sc_sync_log` states.
- E2E test passes: webhook -> process -> pending balance -> mock sync.

## 12) Next Phase (Sau MVP)

- Replace mock sync worker với real blockchain adapter.
- Introduce `dead_letter_queue` và reconciliation jobs.
- Add relay fund P&L và ops dashboard tables/views.
- Add `relay_fund_log` cho gas P&L tracking.
- Add `dead_letter_queue` cho failed event retry management.
- Add admin RBAC tables (`admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_users`).

---

## 13) Các File Tham khảo


| File                     | Mục đích                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `docs/db.sql`            | Lược đồ database đầy đủ (PostgreSQL 15+)                       |
| `docs/Roles.md`          | User roles (CM/F0, IB/F1, User/F2) và quy tắc phân phối rebate |
| `docs/contract.md`       | Luồng smart contract và ánh xạ DB                              |
| `docs/smc-build-flow.md` | Kế hoạch thực thi phát triển SMC                               |

