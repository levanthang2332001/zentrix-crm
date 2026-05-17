'use client';

import React from 'react';
import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PendingBalance {
  walletAddress: string;
  pendingCount: number;
  totalGross: string;
  totalFeeAmount: string;
  totalNet: string;
  nextExpiry: string | null;
}

interface WithdrawMetricsProps {
  dbWalletAddress: string;
  pendingBalance: PendingBalance;
}

export function WithdrawMetrics({ dbWalletAddress, pendingBalance }: WithdrawMetricsProps) {
  if (!dbWalletAddress) return null;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in duration-500 w-full'>
      {/* Net Balance Card */}
      <Card className='bg-card border-border shadow-xl overflow-hidden relative bg-gradient-to-br from-card to-muted/10'>
        <div className='absolute bottom-0 right-0 p-6 opacity-5 translate-y-3 translate-x-3'>
          <Icons.billing className='size-32 text-primary' />
        </div>
        <CardContent className='p-6 flex justify-between items-center'>
          <div className='space-y-1.5'>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>
              Số dư chờ rút (Net)
            </p>
            <h2 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent'>
              {pendingBalance.totalNet} USDT
            </h2>
          </div>
          <Badge
            variant='outline'
            className='bg-primary/5 text-primary border-primary/20 py-1 font-bold'
          >
            +{pendingBalance.pendingCount} Payouts
          </Badge>
        </CardContent>
      </Card>

      {/* Total Fee Card */}
      <Card className='bg-card border-border shadow-xl overflow-hidden relative bg-gradient-to-br from-card to-muted/10'>
        <CardContent className='p-6 flex justify-between items-center'>
          <div className='space-y-1.5'>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>
              Phí dịch vụ tích lũy
            </p>
            <h2 className='text-3xl font-extrabold tracking-tight text-foreground'>
              {pendingBalance.totalFeeAmount} USDT
            </h2>
          </div>
          <Icons.settings className='size-8 text-muted-foreground/30 animate-spin-slow' />
        </CardContent>
      </Card>

      {/* Expiry Card */}
      <Card className='bg-card border-border shadow-xl overflow-hidden relative bg-gradient-to-br from-card to-muted/10'>
        <CardContent className='p-6 flex justify-between items-center'>
          <div className='space-y-1.5'>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>
              Thời hạn claim gần nhất
            </p>
            <h2 className='text-3xl font-extrabold tracking-tight text-destructive animate-pulse'>
              {pendingBalance.nextExpiry
                ? new Date(pendingBalance.nextExpiry).toLocaleDateString('vi-VN')
                : 'Không có'}
            </h2>
          </div>
          <Icons.clock className='size-8 text-destructive/40' />
        </CardContent>
      </Card>
    </div>
  );
}
