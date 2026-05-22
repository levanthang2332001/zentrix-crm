import { queryOptions } from '@tanstack/react-query';
import { getClaimsHistory, getRebateEvents } from './service';

export const historyKeys = {
  all: ['history'] as const,
  claims: (filters: { walletAddress?: string; broker?: string; status?: string }) =>
    [...historyKeys.all, 'claims', filters] as const,
  events: (filters: { broker?: string; asset?: string }) =>
    [...historyKeys.all, 'events', filters] as const
};

export const claimsHistoryQueryOptions = (
  token: string,
  filters: { walletAddress?: string; broker?: string; status?: string }
) =>
  queryOptions({
    queryKey: historyKeys.claims(filters),
    queryFn: () => getClaimsHistory(token, filters),
    enabled: !!token
  });

export const rebateEventsQueryOptions = (
  token: string,
  filters: { broker?: string; asset?: string }
) =>
  queryOptions({
    queryKey: historyKeys.events(filters),
    queryFn: () => getRebateEvents(token, filters),
    enabled: !!token
  });
