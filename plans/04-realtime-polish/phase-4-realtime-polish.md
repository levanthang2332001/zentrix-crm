# Phase 4: Real-Time + Polish (Days 15-18)

## Goal
Add skeleton loaders, empty states, error boundaries, mobile responsiveness, URL param sync, and final verification. Every fix is a small focused file.

## Steps

### Step 4.1: Add Skeleton Loaders
Each skeleton is ONE small file matching the component it replaces:

| Skeleton | Replaces |
|----------|----------|
| `components/dashboard/metric-card-skeleton.tsx` | `metric-card.tsx` |
| `components/flow/flow-sankey-skeleton.tsx` | `flow-sankey.tsx` |
| `components/volume/volume-bar-chart-skeleton.tsx` | `volume-bar-chart.tsx` |
| `components/volume/volume-table-skeleton.tsx` | `volume-table.tsx` |
| `components/admin/webhook-monitor-skeleton.tsx` | `webhook-monitor.tsx` |
| `components/admin/sync-board-skeleton.tsx` | `sync-board.tsx` |
| `components/balances/pending-balance-table-skeleton.tsx` | `pending-balance-table.tsx` |

Each skeleton: same dimensions as component, shimmer animation using `animate-pulse`.

### Step 4.2: Add Empty States
Create `src/components/shared/empty-state.tsx` (reusable):
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

Usage in each tab:
- Flow tab: "No rebate events in selected period"
- Volume tab: "No volume data for selected filters"
- Webhooks: "No webhook events recorded"
- Sync: "No sync operations pending"
- Balances: "No pending claims for selected filters"

### Step 4.3: Add Error Boundaries
Wrap each tab page with `<ErrorBoundary>`:
Create `src/components/shared/error-boundary.tsx`:
```typescript
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}
```

Each tab page (`flow/page.tsx`, `volume/page.tsx`, etc.) wraps content in ErrorBoundary. Error fallback shows "Unable to load [tab name]" + retry button.

### Step 4.4: TanStack Query Polish
In `src/app/(dashboard)/layout.tsx`:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,        // 10s
      gcTime: 5 * 60_000,       // 5 min
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});
```

Per-query polling overrides:
- `useWebhookEvents`: `refetchInterval: 5_000` (5s)
- `useSyncStatus`: `refetchInterval: 10_000` (10s)
- `useMetrics`: `refetchInterval: 30_000` (30s)
- `useFlowData`: `refetchInterval: 60_000` (60s)

### Step 4.5: Mobile Responsive Layout
Add to `src/app/(dashboard)/layout.tsx`:
- Sidebar collapses to bottom tab bar on `< 768px`
- Metric cards: `grid-cols-4` → `grid-cols-2` → `grid-cols-1`
- Flow Sankey: horizontal scroll with pinch-zoom on mobile
- Tables: horizontal scroll with sticky first column
- All touch targets: `min-h-11 min-w-11` (44px minimum)

### Step 4.6: URL Params Sync
Create `src/lib/hooks/use-filters.ts`:
```typescript
// Reads/writes: ?from=YYYYMM&to=YYYYMM&broker=slug
// Returns: { fromMonth, toMonth, brokerSlug, setFilters }
```

Time range picker and broker filter in header update URL. Tab pages read URL params and pass to hooks.

### Step 4.7: Final Integration Test
Manual verification:
1. Navigate all 4 tabs
2. Change time range — all data updates
3. Change broker filter — flow + volume + balances update
4. Check webhook feed updates in real-time
5. Verify expiry countdowns decrement
6. Test error state: stop PostgreSQL, refresh, see error boundary

### Step 4.8: Build Verification
```bash
bun run build
```
Must pass with 0 TypeScript errors. Run `bunx eslint` for lint check.

## Files to Create
```
src/components/dashboard/metric-card-skeleton.tsx
src/components/flow/flow-sankey-skeleton.tsx
src/components/volume/volume-bar-chart-skeleton.tsx
src/components/volume/volume-table-skeleton.tsx
src/components/admin/webhook-monitor-skeleton.tsx
src/components/admin/sync-board-skeleton.tsx
src/components/balances/pending-balance-table-skeleton.tsx
src/components/shared/empty-state.tsx
src/components/shared/error-boundary.tsx
src/lib/hooks/use-filters.ts
```

## Verification
- [ ] Skeleton loaders appear during data fetch (no flash of empty content)
- [ ] Empty states show meaningful messages with icons
- [ ] Error boundary catches failures gracefully with retry
- [ ] Mobile: 1-col on phone, 2-col on tablet, 4-col on desktop
- [ ] URL params work: `?from=202603&to=202605&broker=exness`
- [ ] `bun run build` passes with 0 errors
- [ ] `bun run lint` passes with 0 errors