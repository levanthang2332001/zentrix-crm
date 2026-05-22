'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth } from '@clerk/nextjs';
import { getRebateEvents } from '@/features/history/api/service';
import type { RebateEvent } from '@/features/history/api/types';
import { toast } from 'sonner';

export default function RebateEventsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<RebateEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const userTier = (user?.publicMetadata?.tier as 'F0' | 'F1' | 'F2') || 'F2';

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await getRebateEvents(token, {
        broker: selectedBroker,
        asset: selectedAsset
      });
      setEvents(res.events || []);
    } catch (error) {
      toast.error('Không thể đồng bộ danh sách sự kiện hoa hồng!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedBroker, selectedAsset]);

  const toggleExpandEvent = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Search by Event ID or broker or asset
    if (event.eventId.toLowerCase().includes(query)) return true;
    if (event.broker.toLowerCase().includes(query)) return true;
    if (event.asset.toLowerCase().includes(query)) return true;

    // Search by allowed splits depending on tier
    if (userTier === 'F0') {
      // F0 can view F0 and F1 emails
      return (
        event.splits.f0.email.toLowerCase().includes(query) ||
        event.splits.f1.email.toLowerCase().includes(query)
      );
    } else if (userTier === 'F1') {
      // F1 can view F1 and F2 emails
      return (
        event.splits.f1.email.toLowerCase().includes(query) ||
        event.splits.f2.email.toLowerCase().includes(query)
      );
    } else {
      // F2 can only view F2 email
      return event.splits.f2.email.toLowerCase().includes(query);
    }
  });

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto animate-in fade-in duration-500'>
        {/* Header */}
        <div className='space-y-1.5'>
          <h2 className='text-3xl font-black tracking-tight text-foreground'>
            Lịch sử chia tách Rebate 📈
          </h2>
          <p className='text-xs text-muted-foreground leading-normal'>
            Bản ghi chi tiết các sự kiện phân phối dòng tiền hoàn phí tự động. Click vào từng dòng
            để xem tỷ lệ phân tách cụ thể từ Master IB (F0) đến các Retail Trader (F2).
          </p>
        </div>

        {/* Filters Panel */}
        <Card className='border-border bg-card shadow-lg rounded-2xl p-4'>
          <div className='flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4'>
            <div className='flex flex-wrap items-center gap-3'>
              {/* Broker Filter */}
              <div className='space-y-1'>
                <span className='text-[10px] uppercase font-black text-muted-foreground tracking-wider block'>
                  Sàn Broker
                </span>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className='bg-muted/50 border border-border text-xs rounded-xl h-10 px-3 font-semibold text-foreground focus:outline-none focus:border-primary min-w-[140px]'
                >
                  <option value='ALL'>Tất cả sàn</option>
                  <option value='Exness'>Exness</option>
                  <option value='XM Global'>XM Global</option>
                  <option value='IC Markets'>IC Markets</option>
                </select>
              </div>

              {/* Asset Filter */}
              <div className='space-y-1'>
                <span className='text-[10px] uppercase font-black text-muted-foreground tracking-wider block'>
                  Cặp Tài Sản
                </span>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className='bg-muted/50 border border-border text-xs rounded-xl h-10 px-3 font-semibold text-foreground focus:outline-none focus:border-primary min-w-[140px]'
                >
                  <option value='ALL'>Tất cả cặp</option>
                  <option value='XAUUSD'>XAUUSD (Vàng)</option>
                  <option value='EURUSD'>EURUSD</option>
                  <option value='GBPUSD'>GBPUSD</option>
                  <option value='BTCUSD'>BTCUSD</option>
                </select>
              </div>
            </div>

            {/* Search Input & Action */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:max-w-md w-full'>
              <div className='relative flex-1 group'>
                <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                <Input
                  placeholder='Tìm Event ID, email downline...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9 h-10 bg-muted/30 border-border text-xs rounded-xl focus:ring-0 focus:border-primary w-full'
                />
              </div>
              <Button
                variant='outline'
                onClick={fetchEvents}
                disabled={isLoading}
                className='rounded-xl border-border h-10 px-4 font-bold text-xs gap-1.5 shrink-0'
              >
                <Icons.refresh className='size-4' />
                Tải lại
              </Button>
            </div>
          </div>
        </Card>

        {/* Events Table Card */}
        <Card className='bg-card border border-border shadow-xl overflow-hidden rounded-2xl'>
          <CardHeader className='pb-4 border-b border-border bg-muted/10'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.page className='size-5 text-primary' />
              Sự kiện hoa hồng mạng lưới
            </CardTitle>
            <CardDescription>
              Nhấp vào bất kỳ hàng nào để kiểm tra chi tiết phân tách dòng tiền giữa F0, F1 và F2.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto w-full'>
              <table className='w-full border-collapse text-left min-w-[850px]'>
                <thead>
                  <tr className='border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider h-11'>
                    <th className='pl-6 px-4 w-12'></th>
                    <th className='px-4'>Mã Event ID</th>
                    <th className='px-4'>Sàn Broker</th>
                    <th className='px-4 text-center'>Tài sản</th>
                    <th className='px-4 text-right'>Khối lượng (Lot)</th>
                    <th className='px-4 text-right'>Tổng Rebate nhận</th>
                    <th className='pr-6 px-4 text-center'>Thời gian phát sinh</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className='py-16 text-center text-xs text-muted-foreground'>
                        <Icons.spinner className='size-6 animate-spin text-primary mx-auto mb-2' />
                        Đang đồng bộ dữ liệu giao dịch hoa hồng từ broker...
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='py-16 text-center text-xs text-muted-foreground'>
                        <Icons.circleCheck className='size-8 text-muted-foreground/30 mx-auto mb-2' />
                        Không tìm thấy sự kiện phân tách rebate nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => {
                      const isExpanded = expandedEventId === event.eventId;
                      return (
                        <React.Fragment key={event.eventId}>
                          {/* Row */}
                          <tr
                            onClick={() => toggleExpandEvent(event.eventId)}
                            className={`border-b border-border hover:bg-muted/10 h-16 transition-all duration-150 cursor-pointer ${
                              isExpanded ? 'bg-muted/30' : ''
                            }`}
                          >
                            <td className='pl-6 px-4 text-center'>
                              <Icons.chevronRight
                                className={`size-4 text-muted-foreground transition-transform duration-200 ${
                                  isExpanded ? 'rotate-90 text-primary' : ''
                                }`}
                              />
                            </td>
                            <td className='px-4 font-mono text-xs font-bold text-foreground'>
                              {event.eventId}
                            </td>
                            <td className='px-4 font-semibold text-xs text-foreground/80'>
                              {event.broker}
                            </td>
                            <td className='px-4 text-center'>
                              <Badge className='bg-primary/10 border-primary/20 text-primary py-0.5 px-2 font-bold text-[10px] rounded'>
                                {event.asset}
                              </Badge>
                            </td>
                            <td className='px-4 text-right font-semibold text-xs text-foreground font-mono'>
                              {event.tradeVolume}
                            </td>
                            <td className='px-4 text-right font-black text-xs text-primary font-mono'>
                              ${event.totalRebate}
                            </td>
                            <td className='pr-6 px-4 text-center text-xs text-muted-foreground font-medium'>
                              {new Date(event.timestamp).toLocaleString('vi-VN')}
                            </td>
                          </tr>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <tr>
                              <td
                                colSpan={7}
                                className='p-0 border-b border-border bg-muted/20 animate-in slide-in-from-top-2 duration-200'
                              >
                                <div className='p-6 space-y-6'>
                                  <div className='flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/60 pb-3 gap-2'>
                                    <h4 className='text-xs font-extrabold uppercase text-foreground flex items-center gap-1.5'>
                                      <Icons.info className='size-4 text-primary' />
                                      Chi Tiết Phân Chia Tỷ Lệ Hoa Hồng Thể Theo Cấp Bậc (
                                      {userTier === 'F0'
                                        ? 'F0 / F1'
                                        : userTier === 'F1'
                                          ? 'F1 / F2'
                                          : 'F2'}
                                      )
                                    </h4>
                                    <span className='text-[10px] text-muted-foreground font-semibold'>
                                      Tổng cộng:{' '}
                                      <strong className='text-foreground'>
                                        ${event.totalRebate}
                                      </strong>
                                    </span>
                                  </div>

                                  {/* Split Allocation Progress Bar */}
                                  <div className='space-y-2'>
                                    <div className='flex justify-between items-center text-[10px] font-bold text-muted-foreground'>
                                      <span>Tỷ Lệ Phân Chia Hiện Tại</span>
                                      <span className='flex gap-4'>
                                        {/* F2 Segment indicator */}
                                        <span className='flex items-center gap-1'>
                                          <span
                                            className={`size-2 rounded-full ${userTier === 'F0' ? 'bg-muted-foreground/30' : 'bg-emerald-500'}`}
                                          />
                                          {userTier === 'F0' ? (
                                            <span className='text-muted-foreground/75 italic'>
                                              Retail F2 (Ẩn) ({event.splits.f2.percentage}%)
                                            </span>
                                          ) : userTier === 'F1' ? (
                                            <span>F2 Trader ({event.splits.f2.percentage}%)</span>
                                          ) : (
                                            <span>
                                              F2 Trader (Bạn) ({event.splits.f2.percentage}%)
                                            </span>
                                          )}
                                        </span>
                                        {/* F1 Segment indicator */}
                                        <span className='flex items-center gap-1'>
                                          <span
                                            className={`size-2 rounded-full ${userTier === 'F2' ? 'bg-muted-foreground/30' : 'bg-violet-500'}`}
                                          />
                                          {userTier === 'F2' ? (
                                            <span className='text-muted-foreground/75 italic'>
                                              Sub-IB F1 (Ẩn) ({event.splits.f1.percentage}%)
                                            </span>
                                          ) : userTier === 'F1' ? (
                                            <span>
                                              F1 Sub-IB (Bạn) ({event.splits.f1.percentage}%)
                                            </span>
                                          ) : (
                                            <span>F1 Sub-IB ({event.splits.f1.percentage}%)</span>
                                          )}
                                        </span>
                                        {/* F0 Segment indicator */}
                                        <span className='flex items-center gap-1'>
                                          <span
                                            className={`size-2 rounded-full ${userTier === 'F0' ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                                          />
                                          {userTier === 'F0' ? (
                                            <span>
                                              F0 Master (Bạn) ({event.splits.f0.percentage}%)
                                            </span>
                                          ) : (
                                            <span className='text-muted-foreground/75 italic'>
                                              Master F0 (Ẩn) ({event.splits.f0.percentage}%)
                                            </span>
                                          )}
                                        </span>
                                      </span>
                                    </div>
                                    <div className='w-full h-3 rounded-full bg-muted/80 overflow-hidden flex shadow-inner'>
                                      <div
                                        style={{ width: `${event.splits.f2.percentage}%` }}
                                        className={`h-full transition-all duration-500 ${
                                          userTier === 'F0'
                                            ? 'bg-muted-foreground/15'
                                            : 'bg-emerald-500'
                                        }`}
                                      />
                                      <div
                                        style={{ width: `${event.splits.f1.percentage}%` }}
                                        className={`h-full transition-all duration-500 ${
                                          userTier === 'F2'
                                            ? 'bg-muted-foreground/15'
                                            : 'bg-violet-500'
                                        }`}
                                      />
                                      <div
                                        style={{ width: `${event.splits.f0.percentage}%` }}
                                        className={`h-full transition-all duration-500 ${
                                          userTier === 'F0'
                                            ? 'bg-amber-500'
                                            : 'bg-muted-foreground/15'
                                        }`}
                                      />
                                    </div>
                                  </div>

                                  {/* Multi-tier splits card listing */}
                                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2'>
                                    {/* F2 Split Card */}
                                    {userTier === 'F0' ? (
                                      /* F0 viewing F2 -> Anonymized/Greyed-out downline */
                                      <div className='p-4 rounded-xl border border-muted bg-muted/10 opacity-60 flex flex-col justify-between h-full space-y-2 relative group overflow-hidden'>
                                        <div className='flex justify-between items-center'>
                                          <Badge className='bg-muted-foreground/20 text-muted-foreground text-[9px] font-black py-0.5 px-1.5 rounded flex items-center gap-1'>
                                            <Icons.lock className='size-2.5' />
                                            F2 Trader (Ẩn danh)
                                          </Badge>
                                          <span className='font-mono text-xs font-bold text-muted-foreground'>
                                            {event.splits.f2.percentage}%
                                          </span>
                                        </div>
                                        <div className='space-y-0.5'>
                                          <p className='text-[10px] text-muted-foreground/80 font-mono tracking-wider'>
                                            ••••••••@••••.•••
                                          </p>
                                          <p className='text-sm font-black font-mono text-muted-foreground mt-1'>
                                            ${event.splits.f2.amount}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Normal active F2 */
                                      <div
                                        className={`p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 space-y-2 flex flex-col justify-between h-full ${userTier === 'F2' ? 'ring-1 ring-emerald-500/30' : ''}`}
                                      >
                                        <div className='flex justify-between items-center'>
                                          <Badge className='bg-emerald-500 text-emerald-50 text-[9px] font-black py-0.5 px-1.5 rounded'>
                                            F2 Retail Trader {userTier === 'F2' && '(Bạn)'}
                                          </Badge>
                                          <span className='font-mono text-xs font-black text-emerald-500'>
                                            {event.splits.f2.percentage}%
                                          </span>
                                        </div>
                                        <div className='space-y-0.5'>
                                          <p className='text-[10px] text-muted-foreground truncate font-medium'>
                                            {event.splits.f2.email}
                                          </p>
                                          <p className='text-sm font-black font-mono text-foreground mt-1'>
                                            ${event.splits.f2.amount}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* F1 Split Card */}
                                    {userTier === 'F2' ? (
                                      /* F2 viewing F1 -> Anonymized/Greyed-out upline */
                                      <div className='p-4 rounded-xl border border-muted bg-muted/10 opacity-60 flex flex-col justify-between h-full space-y-2 relative group overflow-hidden'>
                                        <div className='flex justify-between items-center'>
                                          <Badge className='bg-muted-foreground/20 text-muted-foreground text-[9px] font-black py-0.5 px-1.5 rounded flex items-center gap-1'>
                                            <Icons.lock className='size-2.5' />
                                            F1 Sub-IB (Ẩn danh)
                                          </Badge>
                                          <span className='font-mono text-xs font-bold text-muted-foreground'>
                                            {event.splits.f1.percentage}%
                                          </span>
                                        </div>
                                        <div className='space-y-0.5'>
                                          <p className='text-[10px] text-muted-foreground/80 font-mono tracking-wider'>
                                            ••••••••@••••.•••
                                          </p>
                                          <p className='text-sm font-black font-mono text-muted-foreground mt-1'>
                                            ${event.splits.f1.amount}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Normal active F1 */
                                      <div
                                        className={`p-4 rounded-xl border border-violet-500/10 bg-violet-500/5 space-y-2 flex flex-col justify-between h-full ${userTier === 'F1' ? 'ring-1 ring-violet-500/30' : ''}`}
                                      >
                                        <div className='flex justify-between items-center'>
                                          <Badge className='bg-violet-500 text-violet-50 text-[9px] font-black py-0.5 px-1.5 rounded'>
                                            F1 Sub-IB {userTier === 'F1' && '(Bạn)'}
                                          </Badge>
                                          <span className='font-mono text-xs font-black text-violet-400'>
                                            {event.splits.f1.percentage}%
                                          </span>
                                        </div>
                                        <div className='space-y-0.5'>
                                          <p className='text-[10px] text-muted-foreground truncate font-medium'>
                                            {event.splits.f1.email}
                                          </p>
                                          <p className='text-sm font-black font-mono text-foreground mt-1'>
                                            ${event.splits.f1.amount}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* F0 Split Card */}
                                    {userTier === 'F0' ? (
                                      /* Normal active F0 */
                                      <div className='p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 space-y-2 flex flex-col justify-between h-full ring-1 ring-amber-500/30'>
                                        <div className='flex justify-between items-center'>
                                          <Badge className='bg-amber-500 text-amber-950 text-[9px] font-black py-0.5 px-1.5 rounded'>
                                            F0 Master IB (Bạn)
                                          </Badge>
                                          <span className='font-mono text-xs font-black text-amber-500'>
                                            {event.splits.f0.percentage}%
                                          </span>
                                        </div>
                                        <div className='space-y-0.5'>
                                          <p className='text-[10px] text-muted-foreground truncate font-medium'>
                                            {event.splits.f0.email}
                                          </p>
                                          <p className='text-sm font-black font-mono text-foreground mt-1'>
                                            ${event.splits.f0.amount}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      /* F1 or F2 viewing F0 -> Anonymized/Greyed-out upline */
                                      <div className='p-4 rounded-xl border border-muted bg-muted/10 opacity-60 flex flex-col justify-between h-full space-y-2 relative group overflow-hidden'>
                                        <div className='flex justify-between items-center'>
                                          <Badge className='bg-muted-foreground/20 text-muted-foreground text-[9px] font-black py-0.5 px-1.5 rounded flex items-center gap-1'>
                                            <Icons.lock className='size-2.5' />
                                            F0 Master (Ẩn danh)
                                          </Badge>
                                          <span className='font-mono text-xs font-bold text-muted-foreground'>
                                            {event.splits.f0.percentage}%
                                          </span>
                                        </div>
                                        <div className='space-y-0.5'>
                                          <p className='text-[10px] text-muted-foreground/80 font-mono tracking-wider'>
                                            ••••••••@••••.•••
                                          </p>
                                          <p className='text-sm font-black font-mono text-muted-foreground mt-1'>
                                            ${event.splits.f0.amount}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
