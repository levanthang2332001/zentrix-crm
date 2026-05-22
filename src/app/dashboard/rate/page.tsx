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
