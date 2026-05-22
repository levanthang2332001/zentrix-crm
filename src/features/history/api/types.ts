export interface ClaimHistoryEntry {
  claimId: string;
  amount: string;
  walletAddress: string;
  txHash: string;
  status: 'claimed' | 'pending' | 'expired' | 'failed';
  requestedAt: string;
  completedAt?: string;
  broker: string;
}

export interface RebateSplitDetail {
  email: string;
  amount: string;
  percentage: number;
}

export interface RebateEvent {
  eventId: string;
  tradeVolume: string;
  totalRebate: string;
  broker: string;
  asset: string;
  timestamp: string;
  splits: {
    f0: RebateSplitDetail;
    f1: RebateSplitDetail;
    f2: RebateSplitDetail;
  };
}

export interface ClaimsHistoryResponse {
  claims: ClaimHistoryEntry[];
  totalClaimsCount: number;
}

export interface RebateEventsResponse {
  events: RebateEvent[];
  totalEventsCount: number;
}
