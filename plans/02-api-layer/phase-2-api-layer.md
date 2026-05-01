# Phase 2: API Layer (Days 4-7)

## Goal
Build 8 API routes. Each route is ONE small file that calls ONE service function. Services implement real SQL queries.

## Architecture

```
API Route                    Service                         DB
src/app/api/dashboard/
  ├── metrics/route.ts   →   flow-service.ts            →  PostgreSQL
  ├── flow/route.ts     →   flow-service.ts
  ├── volume/route.ts   →   volume-service.ts
  ├── admin/
  │   ├── webhooks/     →   admin-service/webhook-service.ts
  │   ├── sync/         →   admin-service/sync-service.ts
  │   └── dlq/          →   admin-service/dlq-service.ts
  └── balances/
      ├── route.ts      →   balance-service.ts
      └── [wallet]/     →   balance-service.ts
```

**Rule**: Routes ONLY deserialize request → call ONE service → serialize response. NO business logic in routes.

## Steps

### Step 2.1: Implement Services with Real SQL

**`src/lib/services/flow-service.ts`** (~60 lines):
```typescript
export async function getFlowData(fromMonth: number, toMonth: number, brokerId?: string): Promise<FlowData> {
  // SQL: split_ledger → users → brokers
  // WHERE partition_month BETWEEN :from AND :to
  // Returns {nodes, links}
}
```

**`src/lib/services/volume-service.ts`** (~60 lines):
```typescript
export async function getVolumeData(fromMonth: number, toMonth: number, brokerId?: string, groupBy?: 'month' | 'week'): Promise<VolumeData> {
  // SQL: query mv_monthly_volume or direct aggregation
  // Returns {series: [], totals: {}}
}
```

**`src/lib/services/admin-service/webhook-service.ts`** (~50 lines):
```typescript
export async function getWebhookEvents(params: WebhookQueryParams): Promise<WebhookEvent[]> {
  // SQL: webhook_logs partitioned table
  // Returns WebhookEvent[]
}
```

**`src/lib/services/admin-service/sync-service.ts`** (~50 lines):
```typescript
export async function getSyncStatus(params: SyncQueryParams): Promise<SyncOperations> {
  // SQL: sc_sync_log partitioned table
  // Returns {pending: [], recent: [], summary: {}}
}
```

**`src/lib/services/admin-service/dlq-service.ts`** (~50 lines):
```typescript
export async function getDLQEntries(params: DLQQueryParams): Promise<DLQEntry[]> {
  // SQL: dlq_entries table
  // Returns DLQEntry[]
}
```

**`src/lib/services/balance-service.ts`** (~60 lines):
```typescript
export async function getPendingBalances(params: BalanceQueryParams): Promise<PendingBalance[]> {
  // SQL: v_pending_balance view
  // Returns PendingBalance[]
}
export async function getWalletBalance(wallet: string): Promise<WalletBalance> {
  // SQL: SELECT * FROM get_pending_balance(:wallet)
}
```

### Step 2.2: Build API Routes (ONE function each, ~30 lines)

**`src/app/api/dashboard/metrics/route.ts`**:
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = parseInt(searchParams.get('from') ?? getDefaultFromMonth());
  const to = parseInt(searchParams.get('to') ?? getDefaultToMonth());
  const brokerId = searchParams.get('broker_id') ?? undefined;
  const data = await getDashboardMetrics(from, to, brokerId);
  return Response.json(data);
}
```

Same pattern for all 8 routes. Each route:
1. Parse query params
2. Call ONE service function
3. Return JSON

### Step 2.3: Create Materialized View Migration

**`src/lib/db/migrations/002-create-mv-monthly-volume.sql`**:
```sql
CREATE MATERIALIZED VIEW mv_monthly_volume AS
SELECT
  sl.partition_month, sl.broker_id, sl.tier,
  SUM(sl.gross_amount) as total_gross,
  SUM(sl.net_amount) as total_net,
  COUNT(*)::BIGINT as claim_count,
  COUNT(*) FILTER (WHERE sl.claim_status = 'pending_claim')::BIGINT as pending_count
FROM split_ledger sl
WHERE sl.partition_month >= 202401
GROUP BY sl.partition_month, sl.broker_id, sl.tier;
CREATE UNIQUE INDEX ON mv_monthly_volume(partition_month, broker_id, tier);
```

## Files to Create (8 routes + 6 services)

### API Routes
- `src/app/api/dashboard/metrics/route.ts`
- `src/app/api/dashboard/flow/route.ts`
- `src/app/api/dashboard/volume/route.ts`
- `src/app/api/dashboard/admin/webhooks/route.ts`
- `src/app/api/dashboard/admin/sync/route.ts`
- `src/app/api/dashboard/admin/dlq/route.ts`
- `src/app/api/dashboard/balances/route.ts`
- `src/app/api/dashboard/balances/[wallet]/route.ts`

### Service Implementations
- `src/lib/services/flow-service.ts` (implement with SQL)
- `src/lib/services/volume-service.ts` (implement with SQL)
- `src/lib/services/admin-service/webhook-service.ts` (implement with SQL)
- `src/lib/services/admin-service/sync-service.ts` (implement with SQL)
- `src/lib/services/admin-service/dlq-service.ts` (implement with SQL)
- `src/lib/services/balance-service.ts` (implement with SQL)

### Migrations
- `src/lib/db/migrations/002-create-mv-monthly-volume.sql`

## Verification
- [ ] Each route file is ~30 lines (no business logic)
- [ ] Each service file is ~60 lines (one function or closely related group)
- [ ] All SQL queries include partition bounds
- [ ] API returns types match `src/lib/types/*` definitions