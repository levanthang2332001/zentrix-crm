export interface LedgerEntry {
  ledgerId: string;
  eventId: string;
  tier: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  claimStatus: 'pending_claim' | 'claimed' | 'expired' | 'swept';
  expiresAt: string;
  createdAt: string;
  brokerId: string;
}

export interface LedgerEntriesResponse {
  entries: LedgerEntry[];
}

export interface PendingBalance {
  walletAddress: string;
  pendingCount: number;
  totalGross: string;
  totalFeeAmount: string;
  totalNet: string;
  nextExpiry: string | null;
}

export interface ProfileResponse {
  userId: string;
  email: string;
  walletAddress?: string;
  tier?: string;
}

export interface RequestWalletLinkPayload {
  walletAddress: string;
}

export interface ConfirmWalletLinkPayload {
  walletAddress: string;
  code: string;
}
