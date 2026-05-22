import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tier = (searchParams.get('tier') as 'F0' | 'F1' | 'F2') || 'F0';

  let rateModifier = 1.0;
  if (tier === 'F1') rateModifier = 0.6;
  if (tier === 'F2') rateModifier = 0.3;

  return NextResponse.json({
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
  });
}
