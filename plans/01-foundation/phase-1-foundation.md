# Phase 1: Foundation (Days 1-3)

## Goal
Set up dashboard shell with UI/business logic separation. Each file does ONE thing only — small, focused, maintainable.

## Architecture: UI / Business Logic Separation

```
components/     → Pure presentational (NO business logic, NO service imports)
lib/services/   → Pure functions (NO React, NO UI imports)
lib/hooks/      → Bridge (components ONLY talk to hooks, not services)
```

## Steps

### Step 1.1: Install Dependencies
```bash
bun add recharts @tanstack/react-query date-fns clsx tailwind-merge
bunx shadcn@latest init
bunx shadcn@latest add button card table tabs select badge tooltip skeleton separator dropdown-menu input label
```

### Step 1.2: Domain Types
Create `src/lib/types/domain.ts` — ONE file with all domain interfaces:
```typescript
export type UserTier = 'f0' | 'f1' | 'f2';
export type ClaimStatus = 'pending_claim' | 'claimed' | 'expired' | 'swept';
export type SyncDirection = 'allocate' | 'claim';
export type SyncStatus = 'pending' | 'confirmed' | 'failed';
export type HmacStatus = 'valid' | 'invalid' | 'missing';
export type BrokerSlug = string;
```

Create `src/lib/types/flow.ts` — Flow-specific types:
```typescript
import type { UserTier, BrokerSlug } from './domain';
export interface FlowNode {
  id: string;
  name: string;
  type: 'broker' | UserTier;
  totalRebate?: number;
}
export interface FlowLink {
  source: string;
  target: string;
  value: number;
}
export interface FlowData {
  nodes: FlowNode[];
  links: FlowLink[];
}
```

Create `src/lib/types/volume.ts`, `src/lib/types/admin.ts`, `src/lib/types/balance.ts` — each domain area has its own small types file.

### Step 1.3: Database Client
Create `src/lib/db/client.ts` — single file, exports typed pg client.

### Step 1.4: Dashboard Shell
Create `src/app/(dashboard)/layout.tsx` — shell with nav + metric cards.

### Step 1.5: Tab Pages
Create 5 small page files in `src/app/(dashboard)/`:
- `page.tsx` — redirect to /flow
- `flow/page.tsx`
- `volume/page.tsx`
- `admin/page.tsx`
- `balances/page.tsx`

### Step 1.6: Single-Responsibility UI Components
Each component is ONE file doing ONE thing:

| File | Responsibility |
|------|---------------|
| `components/ui/card.tsx` | shadcn card (installed) |
| `components/dashboard/metric-card.tsx` | Single KPI card with value + trend |
| `components/dashboard/sparkline.tsx` | Single mini chart line |
| `components/dashboard/tab-nav.tsx` | Tab buttons only |
| `components/dashboard/time-range-picker.tsx` | Month picker only |
| `components/flow/flow-sankey.tsx` | Sankey chart only |
| `components/flow/node-tooltip.tsx` | Single tooltip for Sankey node |
| `components/flow/link-tooltip.tsx` | Single tooltip for Sankey link |
| `components/volume/volume-bar-chart.tsx` | Bar chart only |
| `components/volume/volume-table.tsx` | Table only (no logic) |
| `components/admin/webhook-monitor.tsx` | Feed display only |
| `components/admin/webhook-row.tsx` | Single webhook row |
| `components/admin/sync-board.tsx` | 3-column sync board |
| `components/admin/sync-card.tsx` | Single sync card |
| `components/admin/dlq-manager.tsx` | DLQ table only |
| `components/admin/dlq-row.tsx` | Single DLQ row |
| `components/balances/pending-balance-table.tsx` | Table only |
| `components/balances/balance-row.tsx` | Single balance row |
| `components/balances/expiry-countdown.tsx` | Single countdown timer |

### Step 1.7: Domain Services (Small, Single-Responsibility)
Each service is ONE function or closely related group of functions:

| File | Responsibility |
|------|---------------|
| `lib/services/flow-service.ts` | `getFlowData(from, to, brokerId)` — ONE query |
| `lib/services/volume-service.ts` | `getVolumeData(...)` — ONE query |
| `lib/services/admin-service/webhook-service.ts` | `getWebhookEvents()` — ONE function |
| `lib/services/admin-service/sync-service.ts` | `getSyncStatus()` — ONE function |
| `lib/services/admin-service/dlq-service.ts` | `getDLQEntries()` — ONE function |
| `lib/services/balance-service.ts` | `getPendingBalances()`, `getWalletBalance()` |

**Rule**: Each service file is max ~50-80 lines. If it grows larger, split it.

### Step 1.8: Hooks (Bridge UI → Services)
Each hook is ONE file:

| Hook | Responsibility |
|------|---------------|
| `lib/hooks/use-flow-data.ts` | Fetch + cache flow data |
| `lib/hooks/use-volume-data.ts` | Fetch + cache volume data |
| `lib/hooks/use-webhook-events.ts` | Fetch + 5s poll webhooks |
| `lib/hooks/use-sync-status.ts` | Fetch + 10s poll sync |
| `lib/hooks/use-dlq-entries.ts` | Fetch DLQ entries |
| `lib/hooks/use-pending-balances.ts` | Fetch + cache balances |

### Step 1.9: Mock Data
Create `src/lib/mock/flow-mock.ts`, `src/lib/mock/volume-mock.ts`, etc. — small mock files per domain.

## Directory Structure (Small Files)

```
src/
├── app/(dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── flow/page.tsx
│   ├── volume/page.tsx
│   ├── admin/page.tsx
│   └── balances/page.tsx
│
├── components/                    # UI ONLY — single responsibility
│   ├── ui/                        # shadcn installed
│   ├── dashboard/
│   │   ├── metric-card.tsx        # 1 KPI card
│   │   ├── sparkline.tsx          # 1 mini chart
│   │   ├── tab-nav.tsx            # tab buttons
│   │   └── time-range-picker.tsx  # month picker
│   ├── flow/
│   │   ├── flow-sankey.tsx        # sankey chart
│   │   ├── node-tooltip.tsx       # 1 tooltip
│   │   └── link-tooltip.tsx       # 1 tooltip
│   ├── volume/
│   │   ├── volume-bar-chart.tsx   # bar chart
│   │   └── volume-table.tsx       # data table
│   ├── admin/
│   │   ├── webhook-monitor.tsx     # feed display
│   │   ├── webhook-row.tsx        # 1 row
│   │   ├── sync-board.tsx         # 3-col board
│   │   ├── sync-card.tsx          # 1 card
│   │   ├── dlq-manager.tsx        # table
│   │   └── dlq-row.tsx            # 1 row
│   └── balances/
│       ├── pending-balance-table.tsx
│       ├── balance-row.tsx
│       └── expiry-countdown.tsx
│
└── lib/                           # BUSINESS LOGIC ONLY
    ├── types/
    │   ├── domain.ts              # base types
    │   ├── flow.ts
    │   ├── volume.ts
    │   ├── admin.ts
    │   └── balance.ts
    ├── db/
    │   ├── client.ts              # postgres connection
    │   └── queries.ts             # query helpers
    ├── services/                  # SMALL single-function files
    │   ├── flow-service.ts
    │   ├── volume-service.ts
    │   └── admin-service/
    │       ├── webhook-service.ts
    │       ├── sync-service.ts
    │       └── dlq-service.ts
    │   └── balance-service.ts
    ├── hooks/                     # bridge UI → services
    │   ├── use-flow-data.ts
    │   ├── use-volume-data.ts
    │   ├── use-webhook-events.ts
    │   ├── use-sync-status.ts
    │   ├── use-dlq-entries.ts
    │   └── use-pending-balances.ts
    └── mock/                      # small per-domain mocks
        ├── flow-mock.ts
        ├── volume-mock.ts
        ├── admin-mock.ts
        └── balance-mock.ts
```

## Verification
- [ ] `bun run dev` starts without errors
- [ ] Dashboard shell renders with 4 metric cards
- [ ] Tab navigation works between 4 pages
- [ ] Every file has single responsibility (max 80 lines for services/hooks)
- [ ] No component imports from services — only from hooks
- [ ] Types split into small domain-specific files