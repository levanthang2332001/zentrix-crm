import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { requestWalletLink, confirmWalletLink } from './service';
import { rebateKeys } from './queries';
import type { RequestWalletLinkPayload, ConfirmWalletLinkPayload } from './types';

export const requestWalletLinkMutation = (token: string) =>
  mutationOptions({
    mutationFn: (payload: RequestWalletLinkPayload) => requestWalletLink(payload, token),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: rebateKeys.profile() });
    }
  });

export const confirmWalletLinkMutation = (token: string) =>
  mutationOptions({
    mutationFn: (payload: ConfirmWalletLinkPayload) => confirmWalletLink(payload, token),
    onSuccess: (data, variables) => {
      getQueryClient().invalidateQueries({ queryKey: rebateKeys.profile() });
      getQueryClient().invalidateQueries({ queryKey: rebateKeys.balance(variables.walletAddress) });
      getQueryClient().invalidateQueries({ queryKey: rebateKeys.ledger(variables.walletAddress) });
    }
  });
