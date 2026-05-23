'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth } from '@clerk/nextjs';
import { getMyRates } from '@/features/rate/api/service';
import type { BrokerRate } from '@/features/rate/api/types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function MyRatesPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rates, setRates] = useState<BrokerRate[]>([]);
  const userTier = (user?.publicMetadata?.tier as 'F0' | 'F1' | 'F2') || 'F2';

  // Simulator Reactive States
  const [simLots, setSimLots] = useState<number>(50);
  const [simBrokerId, setSimBrokerId] = useState<string>('brk_exness');
  const [simAsset, setSimAsset] = useState<string>('XAUUSD');
  const [simTrader, setSimTrader] = useState<'self' | 'f1' | 'f2'>('self');

  useEffect(() => {
    if (userTier === 'F2') {
      setSimTrader('self');
    } else if (userTier === 'F1' && simTrader === 'f1') {
      setSimTrader('self');
    }
  }, [userTier, simTrader]);

  const getBrokerRatesForTier = (brokerId: string) => {
    if (brokerId === 'brk_exness') {
      return { f0: 50, f1: 30, f2: 15 };
    } else if (brokerId === 'brk_xm') {
      return { f0: 45, f1: 25, f2: 12 };
    } else {
      return { f0: 40, f1: 20, f2: 10 };
    }
  };

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getMyRates(token, userTier);
      setRates(data.rates || []);
    } catch {
      toast.error('Không thể đồng bộ tỷ lệ chiết khấu cá nhân!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userTier]);

  const getTierDetails = (tier: string) => {
    switch (tier) {
      case 'F0':
        return {
          label: 'Master IB (Cấp F0)',
          badge: 'bg-amber-500 text-amber-950 hover:bg-amber-600',
          desc: 'Cấp độ đại lý cao nhất. Bạn có toàn quyền thiết lập tỷ lệ hoa hồng cho Sub-IB (F1), xem sơ đồ downlines và nhận mức chiết khấu tự doanh tối đa lên tới 50%.'
        };
      case 'F1':
        return {
          label: 'Sub-IB (Cấp F1)',
          badge: 'bg-violet-500 text-violet-50 hover:bg-violet-600',
          desc: 'Cấp độ đại lý trung gian. Bạn có thể xây dựng đội nhóm giới thiệu trực tiếp (F2) và tự cấu hình tỷ lệ hoàn phí cho họ, đồng thời hưởng chiết khấu tự doanh lên tới 30%.'
        };
      case 'F2':
      default:
        return {
          label: 'Retail Trader (Cấp F2)',
          badge: 'bg-emerald-500 text-emerald-50 hover:bg-emerald-600',
          desc: 'Cấp độ giao dịch cá nhân. Bạn nhận hoàn tiền mặt trực tiếp lên tới 15% phí giao dịch cá nhân nhưng không được cấp link tiếp thị và không thể phân chia tỷ lệ cho người khác.'
        };
    }
  };

  const tierInfo = getTierDetails(userTier);

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto animate-in fade-in duration-500'>
        {/* Header */}
        <div className='space-y-1.5'>
          <h2 className='text-3xl font-black tracking-tight text-foreground'>
            Cấu hình tỷ lệ hoa hồng 💰
          </h2>
          <p className='text-xs text-muted-foreground leading-normal'>
            Tra cứu cấu trúc tỷ lệ chiết khấu tự động (Rebate) của tài khoản đối với từng sàn Broker
            liên kết trong hệ thống.
          </p>
        </div>

        {/* User Tier Overview Card */}
        <Card className='border-border bg-gradient-to-tr from-card to-muted/20 shadow-xl rounded-2xl p-6 relative overflow-hidden group'>
          <div className='absolute -bottom-10 -right-10 p-6 opacity-5 pointer-events-none group-hover:scale-105 transition-all duration-300'>
            <Icons.billing className='size-80 text-primary' />
          </div>
          <div className='space-y-4 max-w-3xl'>
            <div className='flex items-center gap-2'>
              <span className='text-xs uppercase font-extrabold text-muted-foreground'>
                Tài khoản của bạn:
              </span>
              <Badge className={`text-xs font-black py-0.5 px-2 rounded-full ${tierInfo.badge}`}>
                {tierInfo.label}
              </Badge>
            </div>
            <p className='text-sm text-muted-foreground leading-relaxed'>{tierInfo.desc}</p>
            {userTier !== 'F2' ? (
              <div className='pt-2'>
                <Link href='/dashboard/rate/set'>
                  <Button className='bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-10 rounded-xl gap-1.5 shadow-md shadow-primary/10'>
                    <Icons.settings className='size-4' />
                    Thiết lập tỷ lệ downline
                  </Button>
                </Link>
              </div>
            ) : (
              <div className='pt-2'>
                <Button className='bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-10 rounded-xl gap-1.5 shadow-md shadow-primary/10'>
                  <Icons.exclusive className='size-4' />
                  Yêu cầu nâng cấp Đại lý
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Current Rates list */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {isLoading ? (
            <div className='lg:col-span-3 py-20 text-center text-xs text-muted-foreground'>
              <Icons.spinner className='size-8 animate-spin text-primary mx-auto mb-2' />
              Đang phân tích cấu trúc chiết khấu hoa hồng...
            </div>
          ) : (
            rates.map((rate) => (
              <Card
                key={rate.brokerId}
                className='border border-border bg-card shadow-lg rounded-2xl flex flex-col justify-between overflow-hidden group hover:scale-[1.01] transition-all'
              >
                <div className='p-6 space-y-6'>
                  <div className='flex justify-between items-start'>
                    <div className='space-y-1'>
                      <h4 className='font-extrabold text-base text-foreground'>
                        {rate.brokerName}
                      </h4>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block'>
                        Broker Liên kết
                      </span>
                    </div>
                    <Badge
                      variant='outline'
                      className='text-[10px] font-black border-border py-0.5 px-2 bg-muted/20 text-foreground/80'
                    >
                      Active
                    </Badge>
                  </div>

                  {/* Percentage grid */}
                  <div className='grid grid-cols-2 gap-4 border-t border-b border-border/60 py-5'>
                    <div className='space-y-1'>
                      <span className='text-[9px] uppercase font-bold text-muted-foreground tracking-wider block'>
                        Tỷ lệ tự giao dịch
                      </span>
                      <p className='text-2xl font-black font-mono text-primary'>
                        {rate.selfRebateRate}%
                      </p>
                      <p className='text-[9px] text-muted-foreground leading-none'>
                        Hoàn trực tiếp vào ví
                      </p>
                    </div>

                    {userTier !== 'F2' && rate.childRebateRate !== undefined && (
                      <div className='space-y-1 border-l border-border/60 pl-4'>
                        <span className='text-[9px] uppercase font-bold text-muted-foreground tracking-wider block'>
                          Tỷ lệ cấp dưới
                        </span>
                        <p className='text-2xl font-black font-mono text-foreground'>
                          {rate.childRebateRate}%
                        </p>
                        <p className='text-[9px] text-muted-foreground leading-none'>
                          Tỷ lệ gán mặc định
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer description */}
                <div className='px-6 py-4 bg-muted/10 border-t border-border/40 flex items-center justify-between text-[10px] font-bold text-muted-foreground'>
                  <span>Mức chiết khấu tối đa:</span>
                  <span className='font-mono text-foreground'>{rate.maxRebateRate}%</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Rebate Simulator Card */}
        <Card className='border border-border bg-card shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-700'>
          <CardHeader className='bg-muted/10 border-b border-border py-5 px-6'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.adjustments className='size-5 text-primary' />
              Công Cụ Mô Phỏng Chia Sẻ Hoa Hồng Đa Tầng (Rebate Simulator) 🧮
            </CardTitle>
            <CardDescription>
              Nhập sản lượng giao dịch dự kiến và xem tỷ lệ phân bổ hoa hồng (USD) thực tế giữa các
              cấp bậc đại lý (F0 / F1 / F2).
            </CardDescription>
          </CardHeader>
          <CardContent className='p-6 space-y-8'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
              {/* Left Column: Form Parameters */}
              <div className='lg:col-span-5 space-y-6'>
                {/* Select Broker */}
                <div className='space-y-2'>
                  <label className='text-xs uppercase font-extrabold text-muted-foreground block'>
                    Sàn Broker Liên Kết
                  </label>
                  <select
                    value={simBrokerId}
                    onChange={(e) => setSimBrokerId(e.target.value)}
                    className='w-full bg-muted/30 border border-border text-xs rounded-xl h-11 px-3.5 font-bold text-foreground focus:outline-none focus:border-primary'
                  >
                    <option value='brk_exness'>Exness Group (Max 50% Rebate)</option>
                    <option value='brk_xm'>XM Global Ltd (Max 45% Rebate)</option>
                    <option value='brk_icm'>IC Markets (Max 40% Rebate)</option>
                  </select>
                </div>

                {/* Select Asset and Commission rate */}
                <div className='space-y-2'>
                  <label className='text-xs uppercase font-extrabold text-muted-foreground block'>
                    Sản Phẩm & Phí Giao Dịch
                  </label>
                  <select
                    value={simAsset}
                    onChange={(e) => setSimAsset(e.target.value)}
                    className='w-full bg-muted/30 border border-border text-xs rounded-xl h-11 px-3.5 font-bold text-foreground focus:outline-none focus:border-primary'
                  >
                    <option value='XAUUSD'>Vàng (XAUUSD) — Phí $15 / lot</option>
                    <option value='EURUSD'>Forex (EURUSD, GBPUSD) — Phí $10 / lot</option>
                    <option value='BTCUSD'>Tiền điện tử (BTCUSD) — Phí $25 / lot</option>
                  </select>
                </div>

                {/* Simulated Lots (Volume) */}
                <div className='space-y-3.5'>
                  <div className='flex justify-between items-center'>
                    <label className='text-xs uppercase font-extrabold text-muted-foreground block'>
                      Sản Lượng Giao Dịch (Lots)
                    </label>
                    <span className='font-mono font-bold text-sm text-primary'>{simLots} Lots</span>
                  </div>
                  <div className='flex items-center gap-4'>
                    <input
                      type='range'
                      min='1'
                      max='1000'
                      value={simLots}
                      onChange={(e) => setSimLots(parseInt(e.target.value))}
                      className='flex-1 accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer'
                    />
                    <input
                      type='number'
                      min='1'
                      max='1000'
                      value={simLots}
                      onChange={(e) =>
                        setSimLots(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))
                      }
                      className='w-20 bg-muted/30 border border-border text-xs rounded-xl h-9 text-center font-mono font-bold text-foreground focus:outline-none focus:border-primary'
                    />
                  </div>
                </div>

                {/* Trading Party (Who Traded) */}
                <div className='space-y-2.5'>
                  <label className='text-xs uppercase font-extrabold text-muted-foreground block'>
                    Đối Tượng Thực Hiện Giao Dịch
                  </label>
                  <div className='grid grid-cols-3 gap-2.5'>
                    <Button
                      variant={simTrader === 'self' ? 'default' : 'outline'}
                      onClick={() => setSimTrader('self')}
                      className={`h-11 rounded-xl text-xs font-bold ${
                        simTrader === 'self'
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/95'
                          : 'border-border hover:bg-muted/10'
                      }`}
                    >
                      Cá Nhân (Tôi)
                    </Button>
                    <Button
                      variant={simTrader === 'f1' ? 'default' : 'outline'}
                      disabled={userTier === 'F2' || userTier === 'F1'}
                      onClick={() => setSimTrader('f1')}
                      className={`h-11 rounded-xl text-xs font-bold ${
                        simTrader === 'f1'
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/95'
                          : 'border-border hover:bg-muted/10'
                      }`}
                    >
                      Downline F1
                    </Button>
                    <Button
                      variant={simTrader === 'f2' ? 'default' : 'outline'}
                      disabled={userTier === 'F2'}
                      onClick={() => setSimTrader('f2')}
                      className={`h-11 rounded-xl text-xs font-bold ${
                        simTrader === 'f2'
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/95'
                          : 'border-border hover:bg-muted/10'
                      }`}
                    >
                      Downline F2
                    </Button>
                  </div>
                  {userTier === 'F2' && (
                    <span className='text-[10px] text-amber-500 font-semibold leading-normal block italic mt-1'>
                      ⚠️ Cấp F2 chỉ có thể mô phỏng hiệu suất giao dịch cá nhân.
                    </span>
                  )}
                  {userTier === 'F1' && (
                    <span className='text-[10px] text-amber-500 font-semibold leading-normal block italic mt-1'>
                      ⚠️ Cấp F1 chỉ có thể mô phỏng giao dịch cá nhân và tuyến dưới F2.
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Calculated Splits & visual graphs */}
              <div className='lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border/60 pt-6 lg:pt-0 lg:pl-8 space-y-6'>
                {/* Total commission summary */}
                <div className='bg-muted/20 border border-border/85 rounded-2xl p-5 space-y-1.5 shadow-sm'>
                  <span className='text-[10px] uppercase font-black text-muted-foreground tracking-wider block'>
                    Tổng Phí Giao Dịch Phát Sinh
                  </span>
                  <div className='flex justify-between items-baseline'>
                    <h3 className='text-3xl font-black font-mono text-foreground'>
                      $
                      {(
                        simLots * (simAsset === 'XAUUSD' ? 15 : simAsset === 'EURUSD' ? 10 : 25)
                      ).toFixed(2)}
                    </h3>
                    <span className='text-xs font-semibold text-muted-foreground'>
                      ({simLots} lots x $
                      {simAsset === 'XAUUSD' ? 15 : simAsset === 'EURUSD' ? 10 : 25}/lot)
                    </span>
                  </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className='space-y-3.5'>
                  <div className='flex justify-between items-center text-xs font-extrabold uppercase tracking-wider text-muted-foreground'>
                    <span>Phân bổ hoa hồng (Rebate Split)</span>
                    <span className='text-primary font-mono'>100% Phí</span>
                  </div>

                  {/* Multi-segment Bar */}
                  {(() => {
                    const brRates = getBrokerRatesForTier(simBrokerId);
                    const assetVal = simAsset === 'XAUUSD' ? 15 : simAsset === 'EURUSD' ? 10 : 25;
                    const totalC = simLots * assetVal;

                    // Compute percentages based on Trader selection
                    let f2Pct = 0;
                    let f1Pct = 0;
                    let f0Pct = 0;

                    if (simTrader === 'self') {
                      if (userTier === 'F0') {
                        f0Pct = brRates.f0; // F0 gets their full rate
                      } else if (userTier === 'F1') {
                        f1Pct = brRates.f1; // F1 gets their rate
                        f0Pct = brRates.f0 - brRates.f1; // F0 gets override
                      } else {
                        f2Pct = brRates.f2; // F2 gets their rate
                        f1Pct = brRates.f1 - brRates.f2; // F1 gets override
                        f0Pct = brRates.f0 - brRates.f1; // F0 gets override
                      }
                    } else if (simTrader === 'f1') {
                      f1Pct = brRates.f1; // F1 gets rate
                      f0Pct = brRates.f0 - brRates.f1; // F0 override
                    } else if (simTrader === 'f2') {
                      f2Pct = brRates.f2; // F2 gets rate
                      f1Pct = brRates.f1 - brRates.f2; // F1 override
                      f0Pct = brRates.f0 - brRates.f1; // F0 override
                    }

                    const platformPct = 100 - brRates.f0;

                    const f2Val = (f2Pct / 100) * totalC;
                    const f1Val = (f1Pct / 100) * totalC;
                    const f0Val = (f0Pct / 100) * totalC;
                    const platformVal = (platformPct / 100) * totalC;

                    return (
                      <div className='space-y-5'>
                        {/* Segment labels/legend dynamically adjusted for roles */}
                        <div className='flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/5 p-3 rounded-xl border border-border/40'>
                          <div className='flex items-center gap-1.5'>
                            <span
                              className={`size-2 rounded-full ${userTier === 'F0' ? 'bg-muted-foreground/30' : 'bg-emerald-500 animate-pulse'}`}
                            />
                            <span>
                              {userTier === 'F2'
                                ? 'F2 Trader (Bạn)'
                                : userTier === 'F1'
                                  ? 'Trader F2'
                                  : 'Trader F2 (Ẩn)'}
                            </span>
                          </div>
                          <div className='flex items-center gap-1.5'>
                            <span
                              className={`size-2 rounded-full ${userTier === 'F2' ? 'bg-muted-foreground/30' : 'bg-violet-500 animate-pulse'}`}
                            />
                            <span>
                              {userTier === 'F2'
                                ? 'Đại lý F1 (Khóa)'
                                : userTier === 'F1'
                                  ? 'Sub-IB F1 (Bạn)'
                                  : 'Sub-IB F1'}
                            </span>
                          </div>
                          <div className='flex items-center gap-1.5'>
                            <span
                              className={`size-2 rounded-full ${userTier === 'F0' ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/30'}`}
                            />
                            <span>
                              {userTier === 'F0' ? 'Master F0 (Bạn)' : 'Master F0 (Khóa)'}
                            </span>
                          </div>
                          <div className='flex items-center gap-1.5 ml-auto'>
                            <span className='size-2 rounded-full bg-neutral-700' />
                            <span>Broker / Platform</span>
                          </div>
                        </div>

                        <div className='w-full h-4 bg-muted rounded-full overflow-hidden flex shadow-inner'>
                          {f2Pct > 0 && (
                            <div
                              style={{ width: `${f2Pct}%` }}
                              className={`h-full transition-all duration-300 ${userTier === 'F0' ? 'bg-muted-foreground/20' : 'bg-emerald-500'}`}
                              title={userTier === 'F0' ? 'F2 Trader (Ẩn)' : `F2 Trader: ${f2Pct}%`}
                            />
                          )}
                          {f1Pct > 0 && (
                            <div
                              style={{ width: `${f1Pct}%` }}
                              className={`h-full transition-all duration-300 ${userTier === 'F2' ? 'bg-muted-foreground/15' : 'bg-violet-500'}`}
                              title={userTier === 'F2' ? 'Đại lý F1 (Khóa)' : `F1: ${f1Pct}%`}
                            />
                          )}
                          {f0Pct > 0 && (
                            <div
                              style={{ width: `${f0Pct}%` }}
                              className={`h-full transition-all duration-300 ${userTier !== 'F0' ? 'bg-muted-foreground/15' : 'bg-amber-500'}`}
                              title={userTier !== 'F0' ? 'Master F0 (Khóa)' : `F0: ${f0Pct}%`}
                            />
                          )}
                          <div
                            style={{ width: `${platformPct}%` }}
                            className='h-full bg-neutral-700/80 transition-all duration-300'
                            title={`Platform: ${platformPct}%`}
                          />
                        </div>

                        {/* Detail Cards */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                          {/* F2 Split Card */}
                          {userTier !== 'F0' ? (
                            <div
                              className={`p-4 border rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-sm ${
                                f2Pct > 0
                                  ? 'bg-emerald-500/5 border-emerald-500/30'
                                  : 'bg-muted/10 border-border/40 opacity-40'
                              }`}
                            >
                              <div className='space-y-0.5'>
                                <span className='text-[9px] uppercase font-bold text-muted-foreground block'>
                                  Trader F2 Nhận ({f2Pct}%) {userTier === 'F2' && '(Bạn)'}
                                </span>
                                <h4 className='text-xl font-black font-mono text-emerald-500'>
                                  ${f2Val.toFixed(2)}
                                </h4>
                              </div>
                              <span className='text-[9px] text-muted-foreground mt-2 leading-none font-medium'>
                                Hoàn phí tự động vào ví
                              </span>
                            </div>
                          ) : (
                            <div className='p-4 border border-border/40 bg-muted/10 opacity-50 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group'>
                              <div className='absolute inset-0 bg-background/5 backdrop-blur-[0.5px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                <span className='text-[9px] font-black text-muted-foreground bg-muted border border-border py-1 px-2.5 rounded-full flex items-center gap-1'>
                                  <Icons.lock className='size-3' />
                                  Bảo mật tuyến dưới
                                </span>
                              </div>
                              <div className='space-y-0.5'>
                                <span className='text-[9px] uppercase font-bold text-muted-foreground block flex items-center gap-1'>
                                  Trader F2 Nhận{' '}
                                  <Icons.lock className='size-2.5 text-muted-foreground' />
                                </span>
                                <h4 className='text-xl font-black font-mono text-muted-foreground/60'>
                                  $•••
                                </h4>
                              </div>
                              <span className='text-[9px] text-muted-foreground mt-2 leading-none font-medium italic'>
                                Ẩn thông tin giao dịch F2
                              </span>
                            </div>
                          )}

                          {/* F1 Split Card */}
                          {userTier === 'F2' ? (
                            <div className='p-4 border border-border/40 bg-muted/10 opacity-50 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group'>
                              <div className='absolute inset-0 bg-background/5 backdrop-blur-[0.5px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                <span className='text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/25 py-1 px-2.5 rounded-full flex items-center gap-1'>
                                  <Icons.lock className='size-3' />
                                  Bảo mật cấp trên
                                </span>
                              </div>
                              <div className='space-y-0.5'>
                                <span className='text-[9px] uppercase font-bold text-muted-foreground block flex items-center gap-1'>
                                  Đại lý F1 Nhận{' '}
                                  <Icons.lock className='size-2.5 text-muted-foreground' />
                                </span>
                                <h4 className='text-xl font-black font-mono text-muted-foreground/60'>
                                  $•••
                                </h4>
                              </div>
                              <span className='text-[9px] text-muted-foreground mt-2 leading-none font-medium italic'>
                                Hoa hồng F1 được ẩn
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`p-4 border rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-sm ${
                                f1Pct > 0
                                  ? 'bg-violet-500/5 border-violet-500/30'
                                  : 'bg-muted/10 border-border/40 opacity-40'
                              }`}
                            >
                              <div className='space-y-0.5'>
                                <span className='text-[9px] uppercase font-bold text-muted-foreground block'>
                                  Đại lý F1 Nhận ({f1Pct}%) {userTier === 'F1' && '(Bạn)'}
                                </span>
                                <h4 className='text-xl font-black font-mono text-violet-400'>
                                  ${f1Val.toFixed(2)}
                                </h4>
                              </div>
                              <span className='text-[9px] text-muted-foreground mt-2 leading-none font-medium'>
                                Chiết khấu chênh lệch F1
                              </span>
                            </div>
                          )}

                          {/* F0 Split Card */}
                          {userTier !== 'F0' ? (
                            <div className='p-4 border border-border/40 bg-muted/10 opacity-50 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group'>
                              <div className='absolute inset-0 bg-background/5 backdrop-blur-[0.5px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                <span className='text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/25 py-1 px-2.5 rounded-full flex items-center gap-1'>
                                  <Icons.lock className='size-3' />
                                  Bảo mật cấp trên
                                </span>
                              </div>
                              <div className='space-y-0.5'>
                                <span className='text-[9px] uppercase font-bold text-muted-foreground block flex items-center gap-1'>
                                  Đại lý F0 Nhận{' '}
                                  <Icons.lock className='size-2.5 text-muted-foreground' />
                                </span>
                                <h4 className='text-xl font-black font-mono text-muted-foreground/60'>
                                  $•••
                                </h4>
                              </div>
                              <span className='text-[9px] text-muted-foreground mt-2 leading-none font-medium italic'>
                                Hoa hồng F0 được ẩn
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`p-4 border rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-sm ${
                                f0Pct > 0
                                  ? 'bg-amber-500/5 border-amber-500/30'
                                  : 'bg-muted/10 border-border/40 opacity-40'
                              }`}
                            >
                              <div className='space-y-0.5'>
                                <span className='text-[9px] uppercase font-bold text-muted-foreground block'>
                                  Đại lý F0 Nhận ({f0Pct}%) (Bạn)
                                </span>
                                <h4 className='text-xl font-black font-mono text-amber-500'>
                                  ${f0Val.toFixed(2)}
                                </h4>
                              </div>
                              <span className='text-[9px] text-muted-foreground mt-2 leading-none font-medium'>
                                Chiết khấu chênh lệch F0
                              </span>
                            </div>
                          )}

                          {/* Platform Share Card */}
                          <div className='p-4 border border-border/60 bg-neutral-900/20 rounded-2xl flex flex-col justify-between shadow-sm'>
                            <div className='space-y-0.5'>
                              <span className='text-[9px] uppercase font-bold text-muted-foreground block'>
                                Broker Giữ Lại ({platformPct}%)
                              </span>
                              <h4 className='text-xl font-black font-mono text-neutral-400'>
                                ${platformVal.toFixed(2)}
                              </h4>
                            </div>
                            <span className='text-[9px] text-muted-foreground mt-2 leading-none font-medium'>
                              Platform fee & Spread
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Advantage Matrix */}
        <Card className='bg-card border border-border shadow-xl rounded-2xl overflow-hidden'>
          <CardHeader className='bg-muted/10 border-b border-border py-5 px-6'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.listCheck className='size-5 text-primary' />
              Bảng So Sánh Quyền Lợi & Hạn Mức Từng Cấp
            </CardTitle>
            <CardDescription>
              So sánh cơ chế tỷ lệ rebate khả dụng giữa các cấp bậc đại lý và trader trong hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto w-full'>
              <table className='w-full border-collapse text-left min-w-[700px]'>
                <thead>
                  <tr className='border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider h-11'>
                    <th className='pl-6 px-4'>Cấp Bậc Đối Tác</th>
                    <th className='px-4 text-center'>Tỷ lệ Tự doanh tối đa</th>
                    <th className='px-4 text-center'>Cấu hình tỷ lệ Downline</th>
                    <th className='px-4 text-center'>Link Giới Thiệu (Referral)</th>
                    <th className='px-4 text-center'>Sơ đồ Downline Tree</th>
                    <th className='pr-6 px-4 text-center'>Phương thức chi trả</th>
                  </tr>
                </thead>
                <tbody>
                  {/* F0 Master */}
                  <tr
                    className={`border-b border-border hover:bg-muted/5 h-16 ${userTier === 'F0' ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className='pl-6 px-4'>
                      <div className='flex items-center gap-2'>
                        <Badge className='bg-amber-500 text-amber-950 font-black text-[9px] rounded'>
                          F0
                        </Badge>
                        <span className='text-xs font-bold text-foreground'>
                          Master IB (Cấp F0)
                        </span>
                      </div>
                    </td>
                    <td className='px-4 text-center text-xs font-mono font-bold text-foreground'>
                      Up to 50%
                    </td>
                    <td className='px-4 text-center text-xs font-semibold text-emerald-500'>
                      Tùy ý cấu hình cho F1 & F2
                    </td>
                    <td className='px-4 text-center text-xs font-bold text-emerald-500'>Có sẵn</td>
                    <td className='px-4 text-center text-xs text-emerald-500 font-bold'>
                      Toàn quyền xem
                    </td>
                    <td className='pr-6 px-4 text-center text-xs text-muted-foreground font-semibold'>
                      Tự động qua BSC Smart Contract
                    </td>
                  </tr>
                  {/* F1 Sub-IB */}
                  <tr
                    className={`border-b border-border hover:bg-muted/5 h-16 ${userTier === 'F1' ? 'bg-violet-500/5' : ''}`}
                  >
                    <td className='pl-6 px-4'>
                      <div className='flex items-center gap-2'>
                        <Badge className='bg-violet-500 text-violet-50 font-black text-[9px] rounded'>
                          F1
                        </Badge>
                        <span className='text-xs font-bold text-foreground'>Sub-IB (Cấp F1)</span>
                      </div>
                    </td>
                    <td className='px-4 text-center text-xs font-mono font-bold text-foreground'>
                      Up to 30%
                    </td>
                    <td className='px-4 text-center text-xs font-semibold text-emerald-500'>
                      Chỉ cấu hình cho downline F2
                    </td>
                    <td className='px-4 text-center text-xs font-bold text-emerald-500'>Có sẵn</td>
                    <td className='px-4 text-center text-xs text-emerald-500 font-bold'>
                      Được xem downlines trực tiếp
                    </td>
                    <td className='pr-6 px-4 text-center text-xs text-muted-foreground font-semibold'>
                      Tự động qua BSC Smart Contract
                    </td>
                  </tr>
                  {/* F2 Retail */}
                  <tr
                    className={`border-b border-border hover:bg-muted/5 h-16 ${userTier === 'F2' ? 'bg-emerald-500/5' : ''}`}
                  >
                    <td className='pl-6 px-4'>
                      <div className='flex items-center gap-2'>
                        <Badge className='bg-emerald-500 text-emerald-50 font-black text-[9px] rounded'>
                          F2
                        </Badge>
                        <span className='text-xs font-bold text-foreground'>
                          Retail Trader (Cấp F2)
                        </span>
                      </div>
                    </td>
                    <td className='px-4 text-center text-xs font-mono font-bold text-foreground'>
                      Up to 15%
                    </td>
                    <td className='px-4 text-center text-xs text-destructive font-semibold'>
                      Không thể thiết lập
                    </td>
                    <td className='px-4 text-center text-xs font-bold text-destructive'>Bị Khóa</td>
                    <td className='px-4 text-center text-xs text-destructive font-bold'>Bị Ẩn</td>
                    <td className='pr-6 px-4 text-center text-xs text-muted-foreground font-semibold'>
                      Tự động qua BSC Smart Contract
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
