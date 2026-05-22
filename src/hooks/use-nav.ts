'use client';

/**
 * Fully client-side hook for filtering navigation items based on RBAC using user's tier.
 *
 * This hook uses Clerk's client-side useUser hook to retrieve the user's publicMetadata.tier
 * and filter navigation options instantly.
 *
 * Tiers:
 * - F0: Master IB / CM (highest level)
 * - F1: Direct Sub-IB (mid level)
 * - F2: Retail Client / Trader (default)
 */

import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import type { NavItem, NavGroup } from '@/types';

// Deterministic permission mapping based on user tier (matches backend specs)
const TIER_PERMISSIONS: Record<string, string[]> = {
  F0: [
    'f0:set_rate_f1',
    'f0:view_f1_list',
    'f0:view_f1_volumes',
    'f0:view_f2_list',
    'f0:view_f2_volumes'
  ],
  F1: ['f1:set_rate_f2', 'f1:view_f2_list', 'f1:view_f2_volumes'],
  F2: ['f2:view_own_volume']
};

/**
 * Hook to filter navigation items based on user's tier (fully client-side)
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { user } = useUser();

  // Extract active user context and tier
  const accessContext = useMemo(() => {
    // Default tier is F2 (standard retail client)
    const tier = (user?.publicMetadata?.tier as string) || 'F2';
    const permissions = TIER_PERMISSIONS[tier] || TIER_PERMISSIONS.F2;

    return {
      user: user ?? undefined,
      tier,
      permissions
    };
  }, [user?.id, user?.publicMetadata?.tier]);

  // Filter items synchronously (all client-side)
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // No access restrictions
        if (!item.access) {
          return true;
        }

        // Check required tier role
        if (item.access.role) {
          const roles = Array.isArray(item.access.role) ? item.access.role : [item.access.role];
          if (!roles.includes(accessContext.tier)) {
            return false;
          }
        }

        // Check required permission
        if (item.access.permission) {
          if (!accessContext.permissions.includes(item.access.permission)) {
            return false;
          }
        }

        return true;
      })
      .map((item) => {
        // Recursively filter child items
        if (item.items && item.items.length > 0) {
          const filteredChildren = item.items.filter((childItem) => {
            // No access restrictions
            if (!childItem.access) {
              return true;
            }

            // Check required tier role
            if (childItem.access.role) {
              const childRoles = Array.isArray(childItem.access.role)
                ? childItem.access.role
                : [childItem.access.role];
              if (!childRoles.includes(accessContext.tier)) {
                return false;
              }
            }

            // Check required permission
            if (childItem.access.permission) {
              if (!accessContext.permissions.includes(childItem.access.permission)) {
                return false;
              }
            }

            return true;
          });

          return {
            ...item,
            items: filteredChildren
          };
        }

        return item;
      });
  }, [items, accessContext]);

  return filteredItems;
}

/**
 * Hook to filter navigation groups based on user's tier (fully client-side)
 *
 * @param groups - Array of navigation groups to filter
 * @returns Filtered groups (empty groups are removed)
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
