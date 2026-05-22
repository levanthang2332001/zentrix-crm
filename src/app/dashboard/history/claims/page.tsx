'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth } from '@clerk/nextjs';
import { getClaimsHistory } from '@/features/history/api/service';
import type { ClaimHistoryEntry } from '@/features/history/api/types';
import { toast } from 'sonner';

export default function ClaimsHistoryPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claims, setClaims] = useState<ClaimHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getClaimsHistory(token, {
        broker: selectedBroker === 'ALL' ? undefined : selectedBroker,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus
      });
      setClaims(data.claims || []);
    } catch {
      toast.error('Không thể tải lịch sử claims từ hệ thống!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClaims();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedBroker, selectedStatus]);

  const handleCopyText = (text: string, message: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      toast.success(message);
    }
  };

  // Filter local results further by search query
  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      c.claimId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.txHash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: ClaimHistoryEntry['status']) => {
    switch (status) {
      case 'claimed':
        return (
          <Badge className='bg-emerald-500/10 border-emerald-500/20 text-emerald-500 py-0.5 px-2 font-bold text-[10px] rounded gap-1'>
            <span className='size-1 rounded-full bg-emerald-500 animate-pulse' />
            Đã thanh toán
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-amber-500/10 border-amber-500/20 text-amber-500 py-0.5 px-2 font-bold text-[10px] rounded gap-1'>
            <span className='size-1 rounded-full bg-amber-500 animate-pulse' />
            Đang xử lý
          </Badge>
        );
      case 'failed':
        return (
          <Badge className='bg-destructive/10 border-destructive/20 text-destructive py-0.5 px-2 font-bold text-[10px] rounded gap-1'>
            Thất bại
          </Badge>
        );
      case 'expired':
      default:
        return (
          <Badge
            variant='outline'
            className='text-muted-foreground border-border py-0.5 px-2 font-bold text-[10px] rounded bg-muted/20'
          >
            Hết hạn
          </Badge>
        );
    }
  };

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto'>
        {/* Header */}
        <div className='space-y-1.5'>
          <h2 className='text-3xl font-black tracking-tight text-foreground'>
            Lịch sử Claims Web3 🪙
          </h2>
          <p className='text-xs text-muted-foreground leading-normal'>
            Theo dõi tất cả lịch sử rút tiền về ví non-custodial, trạng thái giao dịch on-chain trên
            BSC và tổng hợp số lượng giao dịch rebate đã hoàn tất.
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

              {/* Status Filter */}
              <div className='space-y-1'>
                <span className='text-[10px] uppercase font-black text-muted-foreground tracking-wider block'>
                  Trạng thái
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className='bg-muted/50 border border-border text-xs rounded-xl h-10 px-3 font-semibold text-foreground focus:outline-none focus:border-primary min-w-[140px]'
                >
                  <option value='ALL'>Tất cả trạng thái</option>
                  <option value='claimed'>Đã thanh toán</option>
                  <option value='pending'>Đang xử lý</option>
                  <option value='failed'>Thất bại</option>
                  <option value='expired'>Hết hạn</option>
                </select>
              </div>
            </div>

            {/* Search Input & Reset */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:max-w-md w-full'>
              <div className='relative flex-1 group'>
                <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                <Input
                  placeholder='Tìm Claim ID, ví hoặc Tx Hash...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9 h-10 bg-muted/30 border-border text-xs rounded-xl focus:ring-0 focus:border-primary w-full'
                />
              </div>
              <Button
                variant='outline'
                onClick={fetchClaims}
                disabled={isLoading}
                className='rounded-xl border-border h-10 px-4 font-bold text-xs gap-1.5 shrink-0'
              >
                <Icons.refresh className='size-4' />
                Tải lại
              </Button>
            </div>
          </div>
        </Card>

        {/* Claims Table Card */}
        <Card className='bg-card border border-border shadow-xl overflow-hidden rounded-2xl'>
          <CardHeader className='pb-4 border-b border-border bg-muted/10'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.history className='size-5 text-primary' />
              Bản ghi giao dịch on-chain
            </CardTitle>
            <CardDescription>
              Danh sách chi tiết các lần rút tiền mặt về ví BSC thông qua smart contract.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto w-full'>
              <table className='w-full border-collapse text-left min-w-[900px]'>
                <thead>
                  <tr className='border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider h-11'>
                    <th className='pl-6 px-4'>Mã Claim ID</th>
                    <th className='px-4'>Ví Whitelisted</th>
                    <th className='px-4 text-right'>Số lượng rút</th>
                    <th className='px-4'>On-chain Tx Hash</th>
                    <th className='px-4 text-center'>Trạng thái</th>
                    <th className='px-4 text-center'>Ngày yêu cầu</th>
                    <th className='pr-6 px-4 text-center'>Ngày hoàn tất</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className='py-16 text-center text-xs text-muted-foreground'>
                        <Icons.spinner className='size-6 animate-spin text-primary mx-auto mb-2' />
                        Đang đồng bộ dữ liệu giao dịch từ blockchain...
                      </td>
                    </tr>
                  ) : filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='py-16 text-center text-xs text-muted-foreground'>
                        <Icons.circleCheck className='size-8 text-muted-foreground/30 mx-auto mb-2' />
                        Không tìm thấy giao dịch claims nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <tr
                        key={claim.claimId}
                        className='border-b border-border hover:bg-muted/10 h-16 transition-colors'
                      >
                        {/* Claim ID */}
                        <td className='pl-6 px-4 font-mono text-xs font-bold text-foreground'>
                          {claim.claimId}
                        </td>
                        {/* Wallet Address */}
                        <td className='px-4 font-mono text-xs text-foreground/80'>
                          <div className='flex items-center gap-1.5'>
                            <span>{claim.walletAddress}</span>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() =>
                                handleCopyText(claim.walletAddress, 'Đã sao chép địa chỉ ví!')
                              }
                              className='size-6 text-muted-foreground hover:text-primary rounded'
                            >
                              <Icons.copy className='size-3' />
                            </Button>
                          </div>
                        </td>
                        {/* Amount */}
                        <td className='px-4 text-right font-black text-xs text-foreground font-mono'>
                          ${claim.amount}
                        </td>
                        {/* Tx Hash */}
                        <td className='px-4 font-mono text-xs text-muted-foreground'>
                          <div className='flex items-center gap-1.5 max-w-[200px]'>
                            <span className='truncate'>{claim.txHash}</span>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() => handleCopyText(claim.txHash, 'Đã sao chép Tx Hash!')}
                              className='size-6 text-muted-foreground hover:text-primary rounded shrink-0'
                            >
                              <Icons.copy className='size-3' />
                            </Button>
                            <a
                              href={`https://bscscan.com/tx/${claim.txHash}`}
                              target='_blank'
                              rel='noreferrer'
                              className='size-6 flex items-center justify-center text-muted-foreground hover:text-primary rounded shrink-0'
                            >
                              <Icons.externalLink className='size-3' />
                            </a>
                          </div>
                        </td>
                        {/* Status */}
                        <td className='px-4 text-center'>{getStatusBadge(claim.status)}</td>
                        {/* Requested At */}
                        <td className='px-4 text-center text-xs text-muted-foreground font-medium'>
                          {new Date(claim.requestedAt).toLocaleString('vi-VN')}
                        </td>
                        {/* Completed At */}
                        <td className='pr-6 px-4 text-center text-xs text-muted-foreground font-medium'>
                          {claim.completedAt
                            ? new Date(claim.completedAt).toLocaleString('vi-VN')
                            : '—'}
                        </td>
                      </tr>
                    ))
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
