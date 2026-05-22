import { queryOptions } from '@tanstack/react-query';
import { getNetworkData, getNetworkTree } from './service';

export const networkKeys = {
  all: ['network'] as const,
  list: () => [...networkKeys.all, 'list'] as const,
  tree: () => [...networkKeys.all, 'tree'] as const
};

export const networkQueryOptions = (token: string) =>
  queryOptions({
    queryKey: networkKeys.list(),
    queryFn: () => getNetworkData(token),
    enabled: !!token
  });

export const networkTreeQueryOptions = (token: string) =>
  queryOptions({
    queryKey: networkKeys.tree(),
    queryFn: () => getNetworkTree(token),
    enabled: !!token
  });
