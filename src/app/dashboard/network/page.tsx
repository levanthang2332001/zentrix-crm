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
import { getNetworkData } from '@/features/network/api/service';
import type { NetworkMember } from '@/features/network/api/types';
import { toast } from 'sonner';

export default function NetworkPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [networkStats, setNetworkStats] = useState({
    f1Count: 0,
    f2Count: 0,
    totalVolume: '0.00',
    totalEarned: '0.00'
  });
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [referralLink, setReferralLink] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const userTier = (user?.publicMetadata?.tier as string) || 'F2';
  const isF2 = userTier === 'F2';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getNetworkData(token);
      setNetworkStats(data.stats);
      setMembers(data.members || []);
      // Customize referral link with user's specific reference tag
      const code = user?.id ? user.id.slice(-6).toUpperCase() : 'ZENTRIX';
      setReferralLink(`https://zentrix-crm.io/register?ref=${code}`);
    } catch {
      toast.error('Không thể kết nối dữ liệu mạng lưới downline!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(referralLink);
      toast.success('Đã sao chép link giới thiệu vào clipboard!');
    }
  };

  // Filter members based on Search and active tab tier
  const getFilteredMembers = (tier: 'F1' | 'F2') => {
    return members.filter((m) => {
      const matchesTier = m.tier === tier;
      const matchesSearch =
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.userId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTier && matchesSearch;
    });
  };

  const f1Members = getFilteredMembers('F1');
  const f2Members = getFilteredMembers('F2');

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto'>
        {/* Header */}
        <div className='space-y-1.5'>
          <h2 className='text-3xl font-black tracking-tight text-foreground'>
            Mạng lưới của tôi 👥
          </h2>
          <p className='text-xs text-muted-foreground leading-normal'>
            Quản lý downline giới thiệu trực tiếp (F1) và gián tiếp (F2), theo dõi KLGD và hiệu suất
            hoa hồng.
          </p>
        </div>

        {isF2 ? (
          /* Restricted access layout for F2 Retail traders */
          <div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch pt-4'>
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
                    Bạn hiện đang ở cấp độ **Retail Trader (F2)**. Ở cấp độ này, bạn chỉ có thể xem
                    khối lượng giao dịch cá nhân và claim các khoản hoàn phí cá nhân.
                  </p>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    Để kích hoạt **Referral Link**, tuyển downline **F1 & F2** và mở khóa nguồn thu
                    nhập thụ động hấp dẫn, hãy nâng cấp tài khoản của bạn lên thành **Sub-IB (F1)**
                    hoặc **Master IB (F0)**.
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
                    <h4 className='text-xs font-extrabold text-foreground'>Mạng Lưới F1 & F2</h4>
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
                  Chính sách môi giới (IB) của Zentrix CRM yêu cầu người dùng whitelisting danh tính
                  và cam kết sản lượng giao dịch tối thiểu để được cấp link tiếp thị.
                </p>
                <div className='p-4 rounded-xl bg-muted/30 border border-border text-[11px] leading-relaxed text-muted-foreground italic font-medium'>
                  "Hệ thống IB tại Zentrix giúp các đại lý tối ưu hóa dòng tiền hoàn phí nhờ cơ chế
                  chiết khấu thông minh thông qua BNB Smart Chain."
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
          /* Active downline features for F0 / F1 partners */
          <div className='space-y-6 animate-in fade-in duration-500'>
            {/* Top widgets: Stats and Referral Card */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch'>
              {/* Referral Link share card */}
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
                    {isLoading ? 'Đang tạo link...' : referralLink}
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    disabled={isLoading}
                    className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-11 rounded-xl gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-primary/10'
                  >
                    <Icons.copy className='size-4' />
                    Sao chép liên kết
                  </Button>
                </div>
              </Card>

              {/* Stats overview cards */}
              <div className='lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6'>
                <Card className='p-6 border border-border bg-card shadow-xl rounded-2xl flex flex-col justify-between group transition-all hover:scale-[1.01]'>
                  <div className='flex items-start justify-between'>
                    <div className='space-y-1'>
                      <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                        Thành Viên Downline
                      </p>
                      <h3 className='text-3xl font-black font-mono text-foreground mt-1'>
                        {networkStats.f1Count + networkStats.f2Count}
                      </h3>
                    </div>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0'>
                      <Icons.teams className='size-5.5' />
                    </div>
                  </div>
                  <div className='mt-4 flex items-center gap-3 text-[10px] font-bold text-muted-foreground border-t border-border/60 pt-3'>
                    <span className='flex items-center gap-1.5'>
                      F1 trực tiếp: <strong className='text-primary'>{networkStats.f1Count}</strong>
                    </span>
                    <span className='size-1 rounded-full bg-muted-foreground/30' />
                    <span className='flex items-center gap-1.5'>
                      F2 gián tiếp: <strong className='text-primary'>{networkStats.f2Count}</strong>
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
                        ${networkStats.totalVolume}
                      </h3>
                    </div>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0'>
                      <Icons.trendingUp className='size-5.5' />
                    </div>
                  </div>
                  <div className='mt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground border-t border-border/60 pt-3'>
                    <span>Tổng Hoa Hồng Đã Nhận:</span>
                    <strong className='text-foreground text-xs font-mono'>
                      ${networkStats.totalEarned}
                    </strong>
                  </div>
                </Card>
              </div>
            </div>

            {/* Downlines Directory Table */}
            <Card className='bg-card border-border shadow-xl overflow-hidden rounded-2xl w-full'>
              <CardHeader className='pb-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10'>
                <div className='space-y-1'>
                  <CardTitle className='text-lg font-bold flex items-center gap-2'>
                    <Icons.listCheck className='size-5 text-primary' />
                    Danh Sách Downline Tầng (F1 / F2)
                  </CardTitle>
                  <CardDescription>
                    Bộ lọc tìm kiếm thành viên và theo dõi volume giao dịch tích lũy.
                  </CardDescription>
                </div>
                <div className='flex items-center gap-3 w-full sm:w-auto shrink-0 max-w-xs'>
                  <div className='relative flex-1 group'>
                    <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                    <Input
                      placeholder='Tìm email hoặc ID...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-9 h-10 bg-muted/30 border-border text-xs rounded-xl focus:ring-0 focus:border-primary w-full'
                    />
                  </div>
                  <Button
                    size='icon'
                    variant='outline'
                    onClick={fetchData}
                    className='rounded-xl border-border h-10 w-10 flex items-center justify-center'
                  >
                    <Icons.refresh className='size-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-0'>
                <Tabs defaultValue='f1-list' className='w-full'>
                  <div className='px-6 border-b border-border bg-muted/5'>
                    <TabsList className='bg-transparent h-12 p-0 gap-6 border-none self-start flex justify-start'>
                      <TabsTrigger
                        value='f1-list'
                        className='rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-xs px-1 text-muted-foreground data-[state=active]:text-foreground bg-none shadow-none gap-2'
                      >
                        <Icons.user className='size-3.5' />
                        Downline F1 Trực Tiếp ({f1Members.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value='f2-list'
                        className='rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-xs px-1 text-muted-foreground data-[state=active]:text-foreground bg-none shadow-none gap-2'
                      >
                        <Icons.teams className='size-3.5' />
                        Downline F2 Gián Tiếp ({f2Members.length})
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
                            <th className='px-4 text-right'>KLGD Tích Lũy</th>
                            <th className='px-4 text-right'>Rebate Đã Nhận</th>
                            <th className='pr-6 px-4 text-center'>Ngày Đăng Ký</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
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
                            <th className='px-4 text-right'>KLGD Tích Lũy</th>
                            <th className='px-4 text-right'>Rebate Đã Nhận</th>
                            <th className='pr-6 px-4 text-center'>Ngày Đăng Ký</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
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
      </div>
    </PageContainer>
  );
}
