# Navigation RBAC System

## Overview

This document explains the fully client-side RBAC (Role-Based Access Control) system for navigation items.

**Key Insight**: Navigation visibility is UX only, not security. We filter navigation items instantly client-side using Clerk's `useUser()` hook!

---

## Architecture

### Core Files

1. **`src/hooks/use-nav.ts`** - Single hook that handles all filtering logic (fully client-side)
2. **`src/types/index.ts`** - Type definitions with `access` property

### Why Client-Side?

- **Zero server calls** - Instant filtering, no loading states, no UI flashing.
- **Better performance** - No network latency, no async complexity.
- **Security model** - Navigation visibility is a UX helper. Actual resource and action security (API routes, Web3 contract calls) is checked on the server and smart-contract level.

---

## Performance Characteristics

### User Tiers and Permission Mapping

The system categorizes users into three tiers, with deterministic permissions defined client-side in `src/hooks/use-nav.ts`:

- **F0** (Master IB / CM) — Highest tier, manages F1, F2, volumes, and rate configurations.
- **F1** (Sub-IB) — Mid tier, manages F2 list and rates.
- **F2** (Retail Trader) — Default tier, views own volume and claims rebates.

```typescript
const TIER_PERMISSIONS: Record<string, string[]> = {
  F0: ['f0:set_rate_f1', 'f0:view_f1_list', 'f0:view_f1_volumes', 'f0:view_f2_list', 'f0:view_f2_volumes'],
  F1: ['f1:set_rate_f2', 'f1:view_f2_list', 'f1:view_f2_volumes'],
  F2: ['f2:view_own_volume'],
};
```

---

## Usage

### In `nav-config.ts`

To restrict sidebar navigation items based on role (tier) or permission, configure the `access` property:

```typescript
{
  title: 'Withdrawals',
  url: '/dashboard/rebate/withdraw',
  icon: 'download',
  // Accessible to all authenticated users
}

{
  title: 'Sub-IB Management',
  url: '/dashboard/rebate/sub-ib',
  icon: 'users',
  access: {
    role: 'F0' // Only visible to Master IB (F0)
  }
}

{
  title: 'Commission Rates',
  url: '/dashboard/rebate/rates',
  icon: 'settings',
  access: {
    permission: 'f1:set_rate_f2' // Visible if user has the specific permission
  }
}
```

### In Components

Use the standard filtering hooks:

```typescript
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { navGroups } from '@/config/nav-config';

function Sidebar() {
  const filteredGroups = useFilteredNavGroups(navGroups);
  // Contains only the groups/items that the user is authorized to see
}
```

---

## Best Practices

1. **Keep it simple** — Only add an `access` constraint if the item should be hidden from certain tiers.
2. **UX only** — Remember that client-side RBAC is purely for a clean, customized user interface. Always enforce appropriate role checks on backend APIs and smart contracts.
