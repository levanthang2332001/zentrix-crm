'use client';

import React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LedgerEntry {
  ledgerId: string;
  eventId: string;
  tier: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  claimStatus: 'pending_claim' | 'claimed' | 'expired' | 'swept';
  expiresAt: string;
  createdAt: string;
  brokerId: string;
}

interface LedgerTableProps {
  dbWalletAddress: string;
  web3Wallet: string;
  ledgerEntries: LedgerEntry[];
  selectedIds: Set<string>;
  handleSelectRow: (ledgerId: string) => void;
  handleSelectAll: () => void;
  handleInitiateClaim: (ids: string[]) => void;
  fetchDashboardData: (walletAddress: string) => Promise<void>;
}

export function LedgerTable({
  dbWalletAddress,
  web3Wallet,
  ledgerEntries,
  selectedIds,
  handleSelectRow,
  handleSelectAll,
  handleInitiateClaim,
  fetchDashboardData
}: LedgerTableProps) {
  if (!dbWalletAddress) return null;

  const isAllSelected = selectedIds.size === ledgerEntries.length && ledgerEntries.length > 0;
  const isWalletMismatched = !!(
    dbWalletAddress &&
    web3Wallet &&
    web3Wallet.toLowerCase() !== dbWalletAddress.toLowerCase()
  );
  const isClaimDisabled = !web3Wallet || isWalletMismatched;

  const selectedNetTotal = ledgerEntries
    .filter((e) => selectedIds.has(e.ledgerId))
    .reduce((acc, row) => acc + parseFloat(row.netAmount), 0)
    .toFixed(2);

  return (
    <div className='w-full space-y-6'>
      <Card className='bg-card border-border shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 w-full'>
        <CardHeader className='pb-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10'>
          <div className='space-y-1'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.tasks className='size-5 text-primary' />
              Danh Sách Đợt Hoàn Phí Đủ Điều Kiện
            </CardTitle>
            <CardDescription>
              Tích chọn các đợt hoàn phí để thực hiện rút đơn lẻ hoặc rút gộp tất cả.
            </CardDescription>
          </div>
          <div className='flex gap-2 shrink-0'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => fetchDashboardData(dbWalletAddress)}
              className='rounded-xl border-border hover:bg-accent font-semibold h-9'
            >
              <Icons.refresh className='size-4 mr-2' />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0 overflow-x-auto'>
          {ledgerEntries.length === 0 ? (
            <div className='py-20 flex flex-col items-center justify-center text-center px-4'>
              <div className='size-14 rounded-full bg-muted flex items-center justify-center mb-4'>
                <Icons.circleCheck className='size-8 text-muted-foreground' />
              </div>
              <h3 className='font-bold text-base text-foreground'>
                Tuyệt vời! Không còn khoản chờ rút
              </h3>
              <p className='text-xs text-muted-foreground max-w-sm mt-1'>
                Toàn bộ các khoản tiền hoàn phí đã được claim thành công về ví blockchain của bạn.
              </p>
            </div>
          ) : (
            <table className='w-full border-collapse text-left min-w-[700px]'>
              <thead>
                <tr className='border-b border-border bg-muted/20 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider h-11'>
                  <th className='pl-6 w-12'>
                    <input
                      type='checkbox'
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className='size-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer'
                    />
                  </th>
                  <th className='px-4'>Mã Payout ID / Sàn Giao Dịch</th>
                  <th className='px-4 text-right'>Gross (Tổng phí)</th>
                  <th className='px-4 text-center'>Phí Trích Thu</th>
                  <th className='px-4 text-right'>Thực Nhận (Net)</th>
                  <th className='px-4 text-center'>Thời Hạn Rút</th>
                  <th className='pr-6 text-center w-28'>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((row) => {
                  const isSelected = selectedIds.has(row.ledgerId);
                  const isExpiredSoon =
                    new Date(row.expiresAt).getTime() - Date.now() < 16 * 24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={row.ledgerId}
                      className={cn(
                        'border-b border-border hover:bg-muted/10 h-16 transition-colors',
                        isSelected && 'bg-primary/5 hover:bg-primary/10'
                      )}
                    >
                      <td className='pl-6'>
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={() => handleSelectRow(row.ledgerId)}
                          className='size-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer'
                        />
                      </td>
                      <td className='px-4 min-w-0'>
                        <div className='flex items-center gap-3'>
                          {row.brokerId === 'exness' && (
                            <Badge className='bg-[#FFD700] hover:bg-[#FFD700]/80 text-black font-extrabold text-[10px] rounded-lg shrink-0 px-2 py-0.5'>
                              EX
                            </Badge>
                          )}
                          {row.brokerId === 'icmarkets' && (
                            <Badge className='bg-green-600 hover:bg-green-600/80 text-white font-extrabold text-[10px] rounded-lg shrink-0 px-2 py-0.5'>
                              IC
                            </Badge>
                          )}
                          {row.brokerId === 'xm' && (
                            <Badge className='bg-red-600 hover:bg-red-600/80 text-white font-extrabold text-[10px] rounded-lg shrink-0 px-2 py-0.5'>
                              XM
                            </Badge>
                          )}
                          <div className='space-y-0.5 min-w-0'>
                            <p className='text-xs font-bold text-foreground font-mono truncate'>
                              {row.ledgerId}
                            </p>
                            <p className='text-[10px] text-muted-foreground'>
                              Ngày tạo: {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 text-right font-semibold text-xs text-muted-foreground'>
                        {row.grossAmount} USDT
                      </td>
                      <td className='px-4 text-center'>
                        <Badge
                          variant='outline'
                          className='text-[10px] font-bold py-0.5 bg-muted border-border cursor-help'
                          title='0.1 USDT gas + 0.4 USDT protocol fee'
                        >
                          {row.feeAmount} USDT
                        </Badge>
                      </td>
                      <td className='px-4 text-right font-extrabold text-xs text-primary'>
                        {row.netAmount} USDT
                      </td>
                      <td className='px-4 text-center'>
                        <Badge
                          variant={isExpiredSoon ? 'destructive' : 'secondary'}
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-wider',
                            isExpiredSoon
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-muted/80 text-muted-foreground'
                          )}
                        >
                          {new Date(row.expiresAt).toLocaleDateString('vi-VN')}
                        </Badge>
                      </td>
                      <td className='pr-6 text-center'>
                        <Button
                          size='sm'
                          onClick={() => handleInitiateClaim([row.ledgerId])}
                          disabled={isClaimDisabled}
                          className='h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] rounded-lg shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-all'
                        >
                          Claim
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className='fixed bottom-8 left-1/2 -translate-x-1/2 bg-card/85 backdrop-blur-xl border border-border px-6 py-4 rounded-2xl flex items-center justify-between gap-10 shadow-2xl shadow-black/40 max-w-2xl w-[90%] z-50 animate-in fade-in slide-in-from-bottom-10 duration-300'>
          <div className='flex items-center gap-4'>
            <div className='size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0'>
              <Icons.checks className='size-5 text-primary' />
            </div>
            <div className='space-y-0.5'>
              <h4 className='text-xs font-extrabold'>Đã chọn {selectedIds.size} mục hoàn phí</h4>
              <p className='text-[10px] text-muted-foreground'>
                Tổng thực nhận:{' '}
                <strong className='text-primary text-xs'>{selectedNetTotal} USDT</strong> (Đã trừ
                phí)
              </p>
            </div>
          </div>
          <div className='flex gap-2 shrink-0'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleSelectAll()}
              className='h-10 px-4 rounded-xl font-bold border-border text-xs hover:bg-accent'
            >
              Hủy
            </Button>
            <Button
              size='sm'
              onClick={() => handleInitiateClaim(Array.from(selectedIds))}
              className='h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20'
            >
              Rút tất cả
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
