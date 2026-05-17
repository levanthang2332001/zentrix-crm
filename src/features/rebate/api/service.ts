import { apiClient } from '@/lib/api-client';
import type {
  LedgerEntriesResponse,
  PendingBalance,
  ProfileResponse,
  ConfirmWalletLinkPayload,
  RequestWalletLinkPayload
} from './types';

export async function getProfile(token: string): Promise<ProfileResponse> {
  return apiClient<ProfileResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getPendingBalance(wallet: string, token: string): Promise<PendingBalance> {
  return apiClient<PendingBalance>(`/balances/pending?wallet=${wallet}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getLedgerEntries(
  wallet: string,
  token: string
): Promise<LedgerEntriesResponse> {
  return apiClient<LedgerEntriesResponse>(`/ledger/entries?wallet=${wallet}&status=pending_claim`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function requestWalletLink(
  payload: RequestWalletLinkPayload,
  token: string
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>('/auth/request-wallet-link', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function confirmWalletLink(
  payload: ConfirmWalletLinkPayload,
  token: string
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>('/auth/confirm-wallet-link', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${token}` }
  });
}
