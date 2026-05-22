import { apiClient } from '@/lib/api-client';
import type {
  ClaimsHistoryResponse,
  RebateEventsResponse,
  ClaimHistoryEntry,
  RebateEvent
} from './types';
import historyData from '@/constants/json/history.json';

export async function getClaimsHistory(
  token: string,
  filters: {
    walletAddress?: string;
    broker?: string;
    status?: string;
  } = {}
): Promise<ClaimsHistoryResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.walletAddress) params.append('wallet', filters.walletAddress);
    if (filters.broker) params.append('broker', filters.broker);
    if (filters.status) params.append('status', filters.status);

    return await apiClient<ClaimsHistoryResponse>(`/user/claims?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    // Offline / Demo high-fidelity fallback claims data loaded from separated JSON
    const mockClaims = historyData.claims as ClaimHistoryEntry[];

    // Filter local mocks
    let filteredClaims = mockClaims;
    if (filters.broker && filters.broker !== 'ALL') {
      filteredClaims = filteredClaims.filter(
        (c) => c.broker.toLowerCase() === filters.broker!.toLowerCase()
      );
    }
    if (filters.status && filters.status !== 'ALL') {
      filteredClaims = filteredClaims.filter((c) => c.status === filters.status);
    }

    return {
      claims: filteredClaims,
      totalClaimsCount: filteredClaims.length
    };
  }
}

export async function getRebateEvents(
  token: string,
  filters: {
    broker?: string;
    asset?: string;
  } = {}
): Promise<RebateEventsResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.broker) params.append('broker', filters.broker);
    if (filters.asset) params.append('asset', filters.asset);

    return await apiClient<RebateEventsResponse>(`/user/rebate-events?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    // Offline / Demo high-fidelity fallback split events loaded from separated JSON
    const mockEvents = historyData.events as unknown as RebateEvent[];

    // Filter local mocks
    let filteredEvents = mockEvents;
    if (filters.broker && filters.broker !== 'ALL') {
      filteredEvents = filteredEvents.filter(
        (e) => e.broker.toLowerCase() === filters.broker!.toLowerCase()
      );
    }
    if (filters.asset && filters.asset !== 'ALL') {
      filteredEvents = filteredEvents.filter(
        (e) => e.asset.toLowerCase() === filters.asset!.toLowerCase()
      );
    }

    return {
      events: filteredEvents,
      totalEventsCount: filteredEvents.length
    };
  }
}
