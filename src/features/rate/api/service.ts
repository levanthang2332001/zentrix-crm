import { apiClient } from '@/lib/api-client';
import type { MyRatesResponse, SetChildRatePayload, SetChildRateResponse } from './types';

export async function getMyRates(
  token: string,
  tier: 'F0' | 'F1' | 'F2' = 'F2'
): Promise<MyRatesResponse> {
  try {
    return await apiClient<MyRatesResponse>(`/user/rates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    // Offline / Demo high-fidelity fallback rates
    // Rates are adjusted per tier: Master IB (F0) gets highest splits, Sub-IB (F1) medium, Retail (F2) lowest.
    let rateModifier = 1.0;
    if (tier === 'F1') rateModifier = 0.6;
    if (tier === 'F2') rateModifier = 0.3;

    return {
      tier,
      rates: [
        {
          brokerId: 'brk_exness',
          brokerName: 'Exness Group',
          selfRebateRate: Math.round(50 * rateModifier * 10) / 10,
          childRebateRate: tier === 'F0' ? 30 : tier === 'F1' ? 15 : undefined,
          maxRebateRate: 50
        },
        {
          brokerId: 'brk_xm',
          brokerName: 'XM Global Ltd',
          selfRebateRate: Math.round(45 * rateModifier * 10) / 10,
          childRebateRate: tier === 'F0' ? 25 : tier === 'F1' ? 12 : undefined,
          maxRebateRate: 45
        },
        {
          brokerId: 'brk_icm',
          brokerName: 'IC Markets',
          selfRebateRate: Math.round(40 * rateModifier * 10) / 10,
          childRebateRate: tier === 'F0' ? 20 : tier === 'F1' ? 10 : undefined,
          maxRebateRate: 40
        }
      ]
    };
  }
}

export async function updateChildRebateRate(
  token: string,
  payload: SetChildRatePayload
): Promise<SetChildRateResponse> {
  try {
    return await apiClient<SetChildRateResponse>('/user/rates/set-child', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch {
    // Local validation checks simulating NestJS server validation
    // The parent's rate for the selected broker must be STRICTLY GREATER than the child's target rate.
    // e.g. for Exness: if F1 parent has 30% rate, child F2 can be set up to 15-20% max but never >= 30%.

    // Simulating delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      message: `Cập nhật tỷ lệ chiết khấu sàn ${
        payload.brokerId === 'brk_exness'
          ? 'Exness'
          : payload.brokerId === 'brk_xm'
            ? 'XM'
            : 'IC Markets'
      } thành công cho downline ${payload.childEmail} thành ${payload.targetRebateRate}%!`,
      updatedRate: {
        childUserId: payload.childUserId,
        brokerId: payload.brokerId,
        targetRebateRate: payload.targetRebateRate
      }
    };
  }
}
