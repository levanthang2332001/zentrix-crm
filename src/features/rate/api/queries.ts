import { queryOptions } from '@tanstack/react-query';
import { getMyRates } from './service';

export const rateKeys = {
  all: ['rates'] as const,
  mine: (tier: string) => [...rateKeys.all, 'mine', tier] as const
};

export const myRatesQueryOptions = (token: string, tier: 'F0' | 'F1' | 'F2') =>
  queryOptions({
    queryKey: rateKeys.mine(tier),
    queryFn: () => getMyRates(token, tier),
    enabled: !!token && !!tier
  });
