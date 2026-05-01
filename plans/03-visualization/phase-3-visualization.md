# Phase 3: Data Visualization (Days 8-14)

## Goal
Build all chart components and interactive dashboard panels. Each component is ONE small file with single responsibility.

## UI Components (Single Files)

### Flow Visualization
| File | Responsibility |
|------|---------------|
| `components/flow/flow-sankey.tsx` | Recharts Sankey — renders nodes + links |
| `components/flow/node-tooltip.tsx` | Single tooltip for Sankey node |
| `components/flow/link-tooltip.tsx` | Single tooltip for Sankey link |
| `components/flow/tier-badge.tsx` | F0/F1/F2 colored badge |
| `components/flow/flow-legend.tsx` | Color legend for flow diagram |

### Volume Charts
| File | Responsibility |
|------|---------------|
| `components/volume/volume-bar-chart.tsx` | Stacked bar chart (F0/F1/F2) |
| `components/volume/volume-table.tsx` | Sortable data table |
| `components/volume/volume-row.tsx` | Single table row |
| `components/volume/period-filter.tsx` | Month/week toggle |

### Admin Panels
| File | Responsibility |
|------|---------------|
| `components/admin/webhook-monitor.tsx` | Real-time feed container |
| `components/admin/webhook-row.tsx` | Single webhook event row |
| `components/admin/webhook-filters.tsx` | Status/broker filter controls |
| `components/admin/sync-board.tsx` | 3-column pending/confirmed/failed grid |
| `components/admin/sync-card.tsx` | Single sync operation card |
| `components/admin/sync-filters.tsx` | Direction/status filter |
| `components/admin/dlq-manager.tsx` | DLQ table container |
| `components/admin/dlq-row.tsx` | Single DLQ entry row |
| `components/admin/dlq-resolve-dialog.tsx` | Confirmation dialog for resolve |

### Balance Panels
| File | Responsibility |
|------|---------------|
| `components/balances/pending-balance-table.tsx` | Main table container |
| `components/balances/balance-row.tsx` | Single wallet balance row |
| `components/balances/balance-filters.tsx` | Broker/tier/wallet search filters |
| `components/balances/expiry-countdown.tsx` | Live countdown timer |
| `components/balances/expiry-badge.tsx` | Color-coded expiry status badge |

### Shared UI Components
| File | Responsibility |
|------|---------------|
| `components/dashboard/metric-card.tsx` | KPI card with sparkline option |
| `components/dashboard/metric-skeleton.tsx` | Skeleton for metric card |
| `components/dashboard/tab-nav.tsx` | Tab navigation buttons |
| `components/dashboard/time-range-picker.tsx` | From/to month selector |
| `components/shared/sort-header.tsx` | Table column sort button |
| `components/shared/empty-state.tsx` | Reusable empty state |
| `components/shared/error-state.tsx` | Reusable error state |
| `components/shared/pagination.tsx` | Page navigation |

## Hooks (Bridge UI → Services)

| Hook | Responsibility |
|------|---------------|
| `lib/hooks/use-metrics.ts` | Dashboard hero metrics + 30s polling |
| `lib/hooks/use-flow-data.ts` | Flow Sankey data + 60s polling |
| `lib/hooks/use-volume-data.ts` | Volume series data + 60s polling |
| `lib/hooks/use-webhook-events.ts` | Webhook feed + 5s polling |
| `lib/hooks/use-sync-status.ts` | Sync board + 10s polling |
| `lib/hooks/use-dlq-entries.ts` | DLQ list + resolve mutation |
| `lib/hooks/use-pending-balances.ts` | Balance table + 30s polling |

## Steps

### Step 3.1: Build Flow Components
1. `flow-sankey.tsx` — Recharts `<Sankey>` with custom node/link renderers, responsive container
2. `node-tooltip.tsx` — Shows broker/user name, total rebate, tier
3. `link-tooltip.tsx` — Shows USDT flow amount + lot count
4. `tier-badge.tsx` — F0=purple, F1=green, F2=orange badge
5. `flow-legend.tsx` — Color key for the diagram

### Step 3.2: Build Volume Components
1. `volume-bar-chart.tsx` — Stacked `<BarChart>` with F0/F1/F2 segments, tooltips, legend
2. `volume-table.tsx` — Sortable columns, pagination (25 rows), export CSV button
3. `period-filter.tsx` — Toggle between month/week grouping

### Step 3.3: Build Admin Components
1. `webhook-monitor.tsx` — Scrollable feed with auto-scroll, pause on hover
2. `webhook-row.tsx` — Timestamp, broker, tx_id, HTTP status badge, HMAC badge, error
3. `webhook-filters.tsx` — Status filter dropdown, broker selector
4. `sync-board.tsx` — 3-column grid: Pending (yellow), Confirmed (green), Failed (red)
5. `sync-card.tsx` — Ledger ID, direction badge, attempt count, timestamp, retry button (failed)
6. `dlq-manager.tsx` — Table with resolve button, pagination
7. `dlq-row.tsx` — Source table, ID, reason, attempt count, created date
8. `dlq-resolve-dialog.tsx` — Confirmation modal for resolve action

### Step 3.4: Build Balance Components
1. `pending-balance-table.tsx` — Main table with filters, sorting, pagination
2. `balance-row.tsx` — Wallet (truncated), broker, tier badge, counts, amounts, next expiry
3. `balance-filters.tsx` — Broker select, tier select, wallet search input
4. `expiry-countdown.tsx` — Live `setInterval` timer, color-coded (green/yellow/red)
5. `expiry-badge.tsx` — Static badge for expired claims

### Step 3.5: Build Shared Components
1. `shared/sort-header.tsx` — Reusable table column header with sort indicator
2. `shared/empty-state.tsx` — Icon + message + optional action button
3. `shared/error-state.tsx` — Error message + retry button
4. `shared/pagination.tsx` — Prev/next + page numbers

### Step 3.6: Wire Hooks to Components
Each hook wraps TanStack Query with proper polling interval:
- `useFlowData` → `FlowSankey` + `TierCard`
- `useVolumeData` → `VolumeBarChart` + `VolumeTable`
- `useWebhookEvents` → `WebhookMonitor`
- `useSyncStatus` → `SyncBoard`
- `useDLQEntries` → `DLQManager`
- `usePendingBalances` → `PendingBalanceTable`
- `useMetrics` → hero `MetricCard` row

## Files to Create

### Components (22 files)
```
src/components/flow/
  flow-sankey.tsx
  node-tooltip.tsx
  link-tooltip.tsx
  tier-badge.tsx
  flow-legend.tsx
src/components/volume/
  volume-bar-chart.tsx
  volume-table.tsx
  volume-row.tsx
  period-filter.tsx
src/components/admin/
  webhook-monitor.tsx
  webhook-row.tsx
  webhook-filters.tsx
  sync-board.tsx
  sync-card.tsx
  sync-filters.tsx
  dlq-manager.tsx
  dlq-row.tsx
  dlq-resolve-dialog.tsx
src/components/balances/
  pending-balance-table.tsx
  balance-row.tsx
  balance-filters.tsx
  expiry-countdown.tsx
  expiry-badge.tsx
src/components/shared/
  sort-header.tsx
  empty-state.tsx
  error-state.tsx
  pagination.tsx
```

### Hooks (7 files)
```
src/lib/hooks/
  use-metrics.ts
  use-flow-data.ts
  use-volume-data.ts
  use-webhook-events.ts
  use-sync-status.ts
  use-dlq-entries.ts
  use-pending-balances.ts
```

## Verification
- [ ] Sankey renders with flows from Broker → F0 → F1 → F2
- [ ] Bar chart shows F0/F1/F2 stacked with correct colors
- [ ] Webhook feed updates within 5s of new event
- [ ] Sync board cards color-coded (pending/confirmed/failed)
- [ ] DLQ resolve button triggers confirmation dialog
- [ ] Expiry countdown decrements every second
- [ ] All charts responsive at 375px and 1440px