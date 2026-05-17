import { queryOptions } from '@tanstack/react-query';
import { getProfile, getPendingBalance, getLedgerEntries } from './service';

export const rebateKeys = {
  all: ['rebate'] as const,
  profile: () => [...rebateKeys.all, 'profile'] as const,
  balance: (wallet: string) => [...rebateKeys.all, 'balance', wallet] as const,
  ledger: (wallet: string) => [...rebateKeys.all, 'ledger', wallet] as const
};

export const profileQueryOptions = (token: string) =>
  queryOptions({
    queryKey: rebateKeys.profile(),
    queryFn: () => getProfile(token),
    enabled: !!token
  });

export const pendingBalanceQueryOptions = (wallet: string, token: string) =>
  queryOptions({
    queryKey: rebateKeys.balance(wallet),
    queryFn: () => getPendingBalance(wallet, token),
    enabled: !!wallet && !!token
  });

export const ledgerEntriesQueryOptions = (wallet: string, token: string) =>
  queryOptions({
    queryKey: rebateKeys.ledger(wallet),
    queryFn: () => getLedgerEntries(wallet, token),
    enabled: !!wallet && !!token
  });
export type { LedgerEntry, PendingBalance, ProfileResponse } from './types';
