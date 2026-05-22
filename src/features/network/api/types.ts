export interface NetworkMember {
  userId: string;
  email: string;
  tier: 'F0' | 'F1' | 'F2';
  walletAddress?: string;
  registeredAt: string;
  totalVolume: string;
  rebatesEarned: string;
}

export interface NetworkTreeMember extends NetworkMember {
  children?: NetworkTreeMember[];
}

export interface NetworkResponse {
  members: NetworkMember[];
  referralLink: string;
  stats: {
    f1Count: number;
    f2Count: number;
    totalVolume: string;
    totalEarned: string;
  };
}
