'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useAuth } from '@clerk/nextjs';
import { getRebateEvents } from '@/features/history/api/service';
import type { RebateEvent } from '@/features/history/api/types';
import { getNetworkData } from '@/features/network/api/service';
import type { NetworkMember } from '@/features/network/api/types';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const growthData = [
  { month: 'Th. 12', F1: 15, F2: 24, total: 39 },
  { month: 'Th. 1', F1: 22, F2: 40, total: 62 },
  { month: 'Th. 2', F1: 28, F2: 55, total: 83 },
  { month: 'Th. 3', F1: 35, F2: 78, total: 113 },
  { month: 'Th. 4', F1: 42, F2: 104, total: 146 },
  { month: 'Th. 5', F1: 52, F2: 138, total: 190 }
];

const volumeData = [
  { month: 'Th. 12', F1_Vol: 1250, F2_Vol: 1800 },
  { month: 'Th. 1', F1_Vol: 2100, F2_Vol: 3200 },
  { month: 'Th. 2', F1_Vol: 1900, F2_Vol: 2800 },
  { month: 'Th. 3', F1_Vol: 3400, F2_Vol: 4500 },
  { month: 'Th. 4', F1_Vol: 4100, F2_Vol: 5800 },
  { month: 'Th. 5', F1_Vol: 5200, F2_Vol: 7900 }
];

export default function PartnerPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  // General Loading & State
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState<boolean>(true);

  // Network (Downlines) State
  const [networkStats, setNetworkStats] = useState({
    f1Count: 0,
    f2Count: 0,
    totalVolume: '0.00',
    totalEarned: '0.00'
  });
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [referralLink, setReferralLink] = useState<string>('');
  const [networkSearchQuery, setNetworkSearchQuery] = useState<string>('');

  // Events (History) State
  const [events, setEvents] = useState<RebateEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const userTier = (user?.publicMetadata?.tier as 'F0' | 'F1' | 'F2') || 'F2';
  const isF2 = userTier === 'F2';

  // Fetch Network/Downline Data
  const fetchNetworkData = async () => {
    setIsLoadingNetwork(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getNetworkData(token);
      setNetworkStats(data.stats);
      setMembers(data.members || []);
      const code = user?.id ? user.id.slice(-6).toUpperCase() : 'ZENTRIX';
      setReferralLink(`https://zentrix-crm.io/register?ref=${code}`);
    } catch (error) {
      toast.error('Không thể kết nối dữ liệu mạng lưới downline!');
    } finally {
      setIsLoadingNetwork(false);
    }
  };

  // Fetch Rebate Events / Fluctuation Data
  const fetchEventsData = async () => {
    setIsLoadingEvents(true);
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
      setIsLoadingEvents(false);
    }
  };

  // On mount and user load, fetch both
  useEffect(() => {
    if (user) {
      fetchNetworkData();
      fetchEventsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Re-fetch events when filters change
  useEffect(() => {
    if (user) {
      fetchEventsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBroker, selectedAsset]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(referralLink);
      toast.success('Đã sao chép link giới thiệu vào clipboard!');
    }
  };

  const toggleExpandEvent = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  // Filter members based on search and active tab
  const getFilteredMembers = (tier: 'F1' | 'F2') => {
    return members.filter((m) => {
      const matchesTier = m.tier === tier;
      const matchesSearch =
        m.email.toLowerCase().includes(networkSearchQuery.toLowerCase()) ||
        m.userId.toLowerCase().includes(networkSearchQuery.toLowerCase());
      return matchesTier && matchesSearch;
    });
  };

  const f1Members = getFilteredMembers('F1');
  const f2Members = getFilteredMembers('F2');

  // Filter Rebate Events
  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    if (event.eventId.toLowerCase().includes(query)) return true;
    if (event.broker.toLowerCase().includes(query)) return true;
    if (event.asset.toLowerCase().includes(query)) return true;

    if (userTier === 'F0') {
      return (
        event.splits.f0.email.toLowerCase().includes(query) ||
        event.splits.f1.email.toLowerCase().includes(query)
      );
    } else if (userTier === 'F1') {
      return (
        event.splits.f1.email.toLowerCase().includes(query) ||
        event.splits.f2.email.toLowerCase().includes(query)
      );
    } else {
      return event.splits.f2.email.toLowerCase().includes(query);
    }
  });

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto animate-in fade-in duration-500'>
        {/* Header */}
        <div className='space-y-1.5'>
          <h2 className='text-3xl font-black tracking-tight text-foreground flex items-center gap-2'>
            Hệ Thống Đối Tác (Partner) 👥
          </h2>
          <p className='text-xs text-muted-foreground leading-normal'>
            Quản lý mạng lưới tiếp thị liên kết (downline F1, F2), theo dõi sản lượng volume giao
            dịch và lịch sử nhận/chia tách hoa hồng rebate.
          </p>
        </div>

        {/* Tab Controls */}
        <Tabs defaultValue='downlines' className='w-full space-y-6'>
          <div className='border-b border-border pb-1'>
            <TabsList className='bg-muted/40 p-1 rounded-xl h-11 inline-flex border border-border/80'>
              <TabsTrigger
                value='downlines'
                className='rounded-lg font-extrabold text-xs px-4 h-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'
              >
                <Icons.teams className='size-4 text-primary' />
                Thành Viên Downline
              </TabsTrigger>
              <TabsTrigger
                value='events'
                className='rounded-lg font-extrabold text-xs px-4 h-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'
              >
                <Icons.history className='size-4 text-primary' />
                Biến Động Số Dư (Lịch sử Rebate)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* DOWNLINES TAB */}
          <TabsContent value='downlines' className='space-y-6 focus-visible:outline-none'>
            {isF2 ? (
              /* F2 Whitelisting upgrade prompt */
              <div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch pt-2'>
                <Card className='md:col-span-8 p-8 border-border bg-gradient-to-tr from-card to-muted/20 shadow-2xl flex flex-col justify-between rounded-2xl relative overflow-hidden group'>
                  <div className='absolute -bottom-10 -right-10 p-6 opacity-5 pointer-events-none group-hover:scale-105 transition-all duration-500'>
                    <Icons.pro className='size-96 text-primary' />
                  </div>
                  <div className='space-y-6 max-w-2xl'>
                    <Badge className='bg-primary/10 border-primary/20 text-primary py-1 px-3 text-xs font-bold gap-2 self-start rounded-full'>
                      <Icons.exclusive className='size-3.5' />
                      Hội viên Retail Trader (F2)
                    </Badge>
                    <div className='space-y-3.5'>
                      <h3 className='text-2xl font-black text-foreground leading-tight'>
                        Mở rộng mạng lưới kiếm hoa hồng giới thiệu
                      </h3>
                      <p className='text-sm text-muted-foreground leading-relaxed'>
                        Bạn hiện đang ở cấp độ **Retail Trader (F2)**. Ở cấp độ này, bạn chỉ có thể
                        xem khối lượng giao dịch cá nhân và claim các khoản hoàn phí cá nhân.
                      </p>
                      <p className='text-sm text-muted-foreground leading-relaxed'>
                        Để kích hoạt **Referral Link**, tuyển downline **F1 & F2** và mở khóa nguồn
                        thu nhập thụ động hấp dẫn, hãy nâng cấp tài khoản của bạn lên thành **Sub-IB
                        (F1)** hoặc **Master IB (F0)**.
                      </p>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4'>
                      <div className='p-4 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm'>
                        <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary'>
                          <Icons.trendingUp className='size-4.5' />
                        </div>
                        <h4 className='text-xs font-extrabold text-foreground'>Thêm Hoa Hồng</h4>
                        <p className='text-[10px] text-muted-foreground leading-tight'>
                          Hưởng tới 35% phí giao dịch từ downline.
                        </p>
                      </div>
                      <div className='p-4 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm'>
                        <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary'>
                          <Icons.teams className='size-4.5' />
                        </div>
                        <h4 className='text-xs font-extrabold text-foreground'>
                          Mạng Lưới F1 & F2
                        </h4>
                        <p className='text-[10px] text-muted-foreground leading-tight'>
                          Xây dựng hệ thống đại lý đa tầng dễ dàng.
                        </p>
                      </div>
                      <div className='p-4 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-sm'>
                        <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary'>
                          <Icons.adjustments className='size-4.5' />
                        </div>
                        <h4 className='text-xs font-extrabold text-foreground'>Tự Quyết Tỷ Lệ</h4>
                        <p className='text-[10px] text-muted-foreground leading-tight'>
                          Cấu hình rebate linh hoạt cho downline của mình.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row gap-4'>
                    <Button className='bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-6 h-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all'>
                      Đăng ký nâng cấp Sub-IB ngay
                    </Button>
                    <Button
                      variant='outline'
                      className='h-12 border-border font-bold text-sm px-5 hover:bg-accent rounded-xl'
                    >
                      Liên hệ Master IB hỗ trợ
                    </Button>
                  </div>
                </Card>

                <Card className='md:col-span-4 p-6 border-border bg-card shadow-xl rounded-2xl flex flex-col justify-between'>
                  <div className='space-y-4'>
                    <h4 className='font-extrabold text-sm text-foreground flex items-center gap-2'>
                      <Icons.info className='size-4 text-primary' />
                      Tại sao tôi không có link?
                    </h4>
                    <p className='text-xs text-muted-foreground leading-relaxed'>
                      Chính sách môi giới (IB) của Zentrix CRM yêu cầu người dùng whitelisting danh
                      tính và cam kết sản lượng giao dịch tối thiểu để được cấp link tiếp thị.
                    </p>
                    <div className='p-4 rounded-xl bg-muted/30 border border-border text-[11px] leading-relaxed text-muted-foreground italic font-medium'>
                      "Hệ thống IB tại Zentrix giúp các đại lý tối ưu hóa dòng tiền hoàn phí nhờ cơ
                      chế chiết khấu thông minh thông qua BNB Smart Chain."
                    </div>
                  </div>
                  <div className='pt-6'>
                    <div className='flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10'>
                      <Icons.lock className='size-5 text-primary shrink-0' />
                      <div className='space-y-0.5 min-w-0'>
                        <span className='text-[9px] uppercase font-bold text-muted-foreground tracking-wider'>
                          Trạng thái link
                        </span>
                        <p className='text-xs font-bold text-foreground'>Bị Khóa (Cấp F2)</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              /* F0/F1 Active Partner Content */
              <div className='space-y-6 animate-in fade-in duration-500'>
                {/* Widgets */}
                <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch'>
                  {/* Share Referral Link */}
                  <Card className='lg:col-span-5 border-border bg-gradient-to-tr from-card to-muted/20 shadow-xl overflow-hidden relative rounded-2xl group flex flex-col justify-between p-6'>
                    <div className='absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-105 transition-all duration-300'>
                      <Icons.share className='size-32 rotate-6 text-primary' />
                    </div>
                    <div className='space-y-2'>
                      <CardTitle className='text-lg font-bold flex items-center gap-2'>
                        <Icons.link className='size-5 text-primary' />
                        Link Giới Thiệu Của Bạn
                      </CardTitle>
                      <CardDescription className='text-xs text-muted-foreground leading-relaxed'>
                        Chia sẻ liên kết này để tuyển trực tiếp downline F1 và bắt đầu tự động nhận
                        chiết khấu hoa hồng.
                      </CardDescription>
                    </div>

                    <div className='mt-6 space-y-3'>
                      <div className='flex items-center gap-2 p-3 bg-muted/40 border border-border rounded-xl font-mono text-[11px] font-bold text-foreground overflow-x-auto whitespace-nowrap scrollbar-none'>
                        {isLoadingNetwork ? 'Đang tạo link...' : referralLink}
                      </div>
                      <Button
                        onClick={handleCopyLink}
                        disabled={isLoadingNetwork}
                        className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-11 rounded-xl gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-primary/10'
                      >
                        <Icons.copy className='size-4' />
                        Sao chép liên kết
                      </Button>
                    </div>
                  </Card>

                  {/* Overview Stats */}
                  <div className='lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    <Card className='p-6 border border-border bg-card shadow-xl rounded-2xl flex flex-col justify-between group transition-all hover:scale-[1.01]'>
                      <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                          <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                            Thành Viên Downline
                          </p>
                          <h3 className='text-3xl font-black font-mono text-foreground mt-1'>
                            {isLoadingNetwork ? '...' : networkStats.f1Count + networkStats.f2Count}
                          </h3>
                        </div>
                        <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0'>
                          <Icons.teams className='size-5.5' />
                        </div>
                      </div>
                      <div className='mt-4 flex items-center gap-3 text-[10px] font-bold text-muted-foreground border-t border-border/60 pt-3'>
                        <span className='flex items-center gap-1.5'>
                          F1 trực tiếp:{' '}
                          <strong className='text-primary'>
                            {isLoadingNetwork ? '...' : networkStats.f1Count}
                          </strong>
                        </span>
                        <span className='size-1 rounded-full bg-muted-foreground/30' />
                        <span className='flex items-center gap-1.5'>
                          F2 gián tiếp:{' '}
                          <strong className='text-primary'>
                            {isLoadingNetwork ? '...' : networkStats.f2Count}
                          </strong>
                        </span>
                      </div>
                    </Card>

                    <Card className='p-6 border border-border bg-card shadow-xl rounded-2xl flex flex-col justify-between group transition-all hover:scale-[1.01]'>
                      <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                          <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                            Tổng KLGD Downlines
                          </p>
                          <h3 className='text-3xl font-black font-mono text-primary mt-1'>
                            {isLoadingNetwork ? '...' : `$${networkStats.totalVolume}`}
                          </h3>
                        </div>
                        <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0'>
                          <Icons.trendingUp className='size-5.5' />
                        </div>
                      </div>
                      <div className='mt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground border-t border-border/60 pt-3'>
                        <span>Tổng Hoa Hồng Đã Nhận:</span>
                        <strong className='text-foreground text-xs font-mono'>
                          {isLoadingNetwork ? '...' : `$${networkStats.totalEarned}`}
                        </strong>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Charts */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <Card className='border border-border bg-card shadow-xl rounded-2xl p-6 space-y-4'>
                    <div className='space-y-1.5'>
                      <CardTitle className='text-base font-bold flex items-center gap-2'>
                        <Icons.teams className='size-5 text-primary' />
                        Tăng Trưởng Hệ Thống Tuyến Dưới (Downline Growth)
                      </CardTitle>
                      <CardDescription className='text-xs text-muted-foreground'>
                        Số lượng thành viên tích lũy F1 và F2 gia nhập hệ thống trong 6 tháng qua.
                      </CardDescription>
                    </div>
                    <div className='h-72 w-full pt-4'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <LineChart
                          data={growthData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='var(--border)'
                            opacity={0.2}
                            vertical={false}
                          />
                          <XAxis
                            dataKey='month'
                            stroke='var(--muted-foreground)'
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke='var(--muted-foreground)'
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--card)',
                              borderColor: 'var(--border)',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }}
                          />
                          <Legend
                            verticalAlign='top'
                            height={36}
                            iconType='circle'
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                          />
                          <Line
                            type='monotone'
                            dataKey='F1'
                            name='Downline F1 Trực tiếp'
                            stroke='var(--primary)'
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 1 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type='monotone'
                            dataKey='F2'
                            name='Downline F2 Gián tiếp'
                            stroke='var(--violet-500)'
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 1 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className='border border-border bg-card shadow-xl rounded-2xl p-6 space-y-4'>
                    <div className='space-y-1.5'>
                      <CardTitle className='text-base font-bold flex items-center gap-2'>
                        <Icons.trendingUp className='size-5 text-primary' />
                        Khối Lượng Giao Dịch Hàng Tháng (Volume Traded)
                      </CardTitle>
                      <CardDescription className='text-xs text-muted-foreground'>
                        Tổng lot sản lượng giao dịch đóng góp hàng tháng bởi downline F1 và F2.
                      </CardDescription>
                    </div>
                    <div className='h-72 w-full pt-4'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={volumeData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='var(--border)'
                            opacity={0.2}
                            vertical={false}
                          />
                          <XAxis
                            dataKey='month'
                            stroke='var(--muted-foreground)'
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke='var(--muted-foreground)'
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v}`}
                          />
                          <Tooltip
                            formatter={(value) => [`$${value}`, undefined]}
                            contentStyle={{
                              background: 'var(--card)',
                              borderColor: 'var(--border)',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }}
                          />
                          <Legend
                            verticalAlign='top'
                            height={36}
                            iconType='circle'
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                          />
                          <Bar
                            dataKey='F1_Vol'
                            name='Sản lượng F1 (USD)'
                            fill='var(--primary)'
                            radius={[4, 4, 0, 0]}
                            maxBarSize={35}
                          />
                          <Bar
                            dataKey='F2_Vol'
                            name='Sản lượng F2 (USD)'
                            fill='var(--violet-500)'
                            radius={[4, 4, 0, 0]}
                            maxBarSize={35}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                {/* Downlines Directory Table */}
                <Card className='bg-card border border-border shadow-xl overflow-hidden rounded-2xl w-full'>
                  <CardHeader className='pb-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10'>
                    <div className='space-y-1'>
                      <CardTitle className='text-lg font-bold flex items-center gap-2'>
                        <Icons.listCheck className='size-5 text-primary' />
                        Danh Sách Downline Tầng (F1 / F2)
                      </CardTitle>
                      <CardDescription>
                        Bộ lọc tìm kiếm thành viên và theo dõi volume giao dịch cùng số tiền hoàn
                        phí (rebate) tích lũy.
                      </CardDescription>
                    </div>
                    <div className='flex items-center gap-3 w-full sm:w-auto shrink-0 max-w-xs'>
                      <div className='relative flex-1 group'>
                        <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                        <Input
                          placeholder='Tìm email hoặc ID...'
                          value={networkSearchQuery}
                          onChange={(e) => setNetworkSearchQuery(e.target.value)}
                          className='pl-9 h-10 bg-muted/30 border-border text-xs rounded-xl focus:ring-0 focus:border-primary w-full'
                        />
                      </div>
                      <Button
                        size='icon'
                        variant='outline'
                        onClick={fetchNetworkData}
                        disabled={isLoadingNetwork}
                        className='rounded-xl border-border h-10 w-10 flex items-center justify-center shrink-0'
                      >
                        <Icons.refresh className='size-4' />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className='p-0'>
                    <Tabs defaultValue='f1-list' className='w-full'>
                      <div className='px-6 border-b border-border bg-muted/5'>
                        <TabsList className='bg-transparent h-12 p-0 gap-6 border-none flex justify-start'>
                          <TabsTrigger
                            value='f1-list'
                            className='rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-xs px-1 text-muted-foreground data-[state=active]:text-foreground bg-none shadow-none gap-2'
                          >
                            <Icons.user className='size-3.5' />
                            Downline F1 Trực Tiếp ({isLoadingNetwork ? '...' : f1Members.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value='f2-list'
                            className='rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-xs px-1 text-muted-foreground data-[state=active]:text-foreground bg-none shadow-none gap-2'
                          >
                            <Icons.teams className='size-3.5' />
                            Downline F2 Gián Tiếp ({isLoadingNetwork ? '...' : f2Members.length})
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      {/* F1 Downlines Panel */}
                      <TabsContent value='f1-list' className='p-0 focus-visible:outline-none'>
                        <div className='overflow-x-auto w-full'>
                          <table className='w-full border-collapse text-left min-w-[700px]'>
                            <thead>
                              <tr className='border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider h-11'>
                                <th className='pl-6 px-4'>Mã Downline ID</th>
                                <th className='px-4'>Email Liên Hệ</th>
                                <th className='px-4 text-center'>Cấp Bậc</th>
                                <th className='px-4 text-right'>KLGD Tích Lũy (Vol)</th>
                                <th className='px-4 text-right'>Rebate Nhận (Hoàn phí)</th>
                                <th className='pr-6 px-4 text-center'>Ngày Đăng Ký</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoadingNetwork ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className='py-12 text-center text-xs text-muted-foreground'
                                  >
                                    <Icons.spinner className='size-6 animate-spin text-primary mx-auto mb-2' />
                                    Đang tải danh sách downline F1...
                                  </td>
                                </tr>
                              ) : f1Members.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className='py-12 text-center text-xs text-muted-foreground'
                                  >
                                    <Icons.circleCheck className='size-8 text-muted-foreground/40 mx-auto mb-2' />
                                    Không tìm thấy downline F1 phù hợp
                                  </td>
                                </tr>
                              ) : (
                                f1Members.map((m) => (
                                  <tr
                                    key={m.userId}
                                    className='border-b border-border hover:bg-muted/10 h-16 transition-colors'
                                  >
                                    <td className='pl-6 px-4 font-mono text-xs font-bold text-foreground'>
                                      {m.userId}
                                    </td>
                                    <td className='px-4 text-xs font-semibold text-foreground/80'>
                                      {m.email}
                                    </td>
                                    <td className='px-4 text-center'>
                                      <Badge className='bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-[10px] font-bold py-0.5 px-2 rounded'>
                                        {m.tier}
                                      </Badge>
                                    </td>
                                    <td className='px-4 text-right font-bold text-xs text-foreground font-mono'>
                                      ${m.totalVolume}
                                    </td>
                                    <td className='px-4 text-right font-extrabold text-xs text-primary font-mono'>
                                      ${m.rebatesEarned}
                                    </td>
                                    <td className='pr-6 px-4 text-center text-xs text-muted-foreground'>
                                      {new Date(m.registeredAt).toLocaleDateString('vi-VN')}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* F2 Downlines Panel */}
                      <TabsContent value='f2-list' className='p-0 focus-visible:outline-none'>
                        <div className='overflow-x-auto w-full'>
                          <table className='w-full border-collapse text-left min-w-[700px]'>
                            <thead>
                              <tr className='border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider h-11'>
                                <th className='pl-6 px-4'>Mã Downline ID</th>
                                <th className='px-4'>Email Liên Hệ</th>
                                <th className='px-4 text-center'>Cấp Bậc</th>
                                <th className='px-4 text-right'>KLGD Tích Lũy (Vol)</th>
                                <th className='px-4 text-right'>Rebate Nhận (Hoàn phí)</th>
                                <th className='pr-6 px-4 text-center'>Ngày Đăng Ký</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoadingNetwork ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className='py-12 text-center text-xs text-muted-foreground'
                                  >
                                    <Icons.spinner className='size-6 animate-spin text-primary mx-auto mb-2' />
                                    Đang tải danh sách downline F2...
                                  </td>
                                </tr>
                              ) : f2Members.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className='py-12 text-center text-xs text-muted-foreground'
                                  >
                                    <Icons.circleCheck className='size-8 text-muted-foreground/40 mx-auto mb-2' />
                                    Không tìm thấy downline F2 phù hợp
                                  </td>
                                </tr>
                              ) : (
                                f2Members.map((m) => (
                                  <tr
                                    key={m.userId}
                                    className='border-b border-border hover:bg-muted/10 h-16 transition-colors'
                                  >
                                    <td className='pl-6 px-4 font-mono text-xs font-bold text-foreground'>
                                      {m.userId}
                                    </td>
                                    <td className='px-4 text-xs font-semibold text-foreground/80'>
                                      {m.email}
                                    </td>
                                    <td className='px-4 text-center'>
                                      <Badge
                                        variant='outline'
                                        className='text-muted-foreground border-border text-[10px] font-bold py-0.5 px-2 rounded bg-muted/20'
                                      >
                                        {m.tier}
                                      </Badge>
                                    </td>
                                    <td className='px-4 text-right font-bold text-xs text-foreground font-mono'>
                                      ${m.totalVolume}
                                    </td>
                                    <td className='px-4 text-right font-extrabold text-xs text-primary font-mono'>
                                      ${m.rebatesEarned}
                                    </td>
                                    <td className='pr-6 px-4 text-center text-xs text-muted-foreground'>
                                      {new Date(m.registeredAt).toLocaleDateString('vi-VN')}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value='events' className='space-y-6 focus-visible:outline-none'>
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
                    onClick={fetchEventsData}
                    disabled={isLoadingEvents}
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
                  Nhấp vào bất kỳ hàng nào để kiểm tra chi tiết phân tách dòng tiền giữa F0, F1 và
                  F2.
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
                      {isLoadingEvents ? (
                        <tr>
                          <td
                            colSpan={7}
                            className='py-16 text-center text-xs text-muted-foreground'
                          >
                            <Icons.spinner className='size-6 animate-spin text-primary mx-auto mb-2' />
                            Đang đồng bộ dữ liệu giao dịch hoa hồng từ broker...
                          </td>
                        </tr>
                      ) : filteredEvents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className='py-16 text-center text-xs text-muted-foreground'
                          >
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
                                            <span className='flex items-center gap-1'>
                                              <span
                                                className={`size-2 rounded-full ${userTier === 'F0' ? 'bg-muted-foreground/30' : 'bg-emerald-500'}`}
                                              />
                                              {userTier === 'F0' ? (
                                                <span className='text-muted-foreground/75 italic'>
                                                  Retail F2 (Ẩn) ({event.splits.f2.percentage}%)
                                                </span>
                                              ) : userTier === 'F1' ? (
                                                <span>
                                                  F2 Trader ({event.splits.f2.percentage}%)
                                                </span>
                                              ) : (
                                                <span>
                                                  F2 Trader (Bạn) ({event.splits.f2.percentage}%)
                                                </span>
                                              )}
                                            </span>
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
                                                <span>
                                                  F1 Sub-IB ({event.splits.f1.percentage}%)
                                                </span>
                                              )}
                                            </span>
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
                                            className={`h-full transition-all duration-500 ${userTier === 'F0' ? 'bg-muted-foreground/15' : 'bg-emerald-500'}`}
                                          />
                                          <div
                                            style={{ width: `${event.splits.f1.percentage}%` }}
                                            className={`h-full transition-all duration-500 ${userTier === 'F2' ? 'bg-muted-foreground/15' : 'bg-violet-500'}`}
                                          />
                                          <div
                                            style={{ width: `${event.splits.f0.percentage}%` }}
                                            className={`h-full transition-all duration-500 ${userTier === 'F0' ? 'bg-amber-500' : 'bg-muted-foreground/15'}`}
                                          />
                                        </div>
                                      </div>

                                      {/* Multi-tier splits card listing */}
                                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2'>
                                        {/* F2 Split Card */}
                                        {userTier === 'F0' ? (
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
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
