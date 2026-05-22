export interface BrokerRate {
  brokerId: string;
  brokerName: string;
  selfRebateRate: number; // % rate the user receives for self-trades
  childRebateRate?: number; // % rate set for direct children
  maxRebateRate: number; // max allowable % split for their tier
}

export interface MyRatesResponse {
  tier: 'F0' | 'F1' | 'F2';
  rates: BrokerRate[];
}

export interface SetChildRatePayload {
  childUserId: string;
  childEmail: string;
  brokerId: string;
  targetRebateRate: number; // target rebate rate in %
}

export interface SetChildRateResponse {
  success: boolean;
  message: string;
  updatedRate: {
    childUserId: string;
    brokerId: string;
    targetRebateRate: number;
  };
}
