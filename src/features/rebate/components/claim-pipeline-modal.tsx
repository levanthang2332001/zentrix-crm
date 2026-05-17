'use client';

import React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ClaimPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimIds: string[];
  claimStep: 'init' | 'sign' | 'broadcast' | 'sync' | 'success';
  txHash: string;
  claimedAmount: string;
}

export function ClaimPipelineModal({
  isOpen,
  onClose,
  claimIds,
  claimStep,
  txHash,
  claimedAmount
}: ClaimPipelineModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300'>
      <Card className='w-full max-w-lg bg-card border-border shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300'>
        <div className='absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-primary to-purple-600 animate-pulse' />
        <CardHeader className='pb-4 border-b border-border'>
          <div className='flex justify-between items-center'>
            <CardTitle className='text-lg font-bold'>Chi tiết rút tiền (Non-Custodial)</CardTitle>
            {claimStep === 'success' && (
              <Button
                variant='ghost'
                size='icon'
                onClick={onClose}
                className='size-8 rounded-full hover:bg-accent'
              >
                <Icons.close className='size-4' />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='p-6 space-y-6'>
          {/* Transaction details card */}
          <div className='p-4 rounded-xl bg-muted/40 border border-border/50 grid grid-cols-2 gap-4 text-xs font-semibold'>
            <div className='space-y-1'>
              <span className='text-[10px] text-muted-foreground uppercase'>Tổng số đợt claim</span>
              <p className='text-base font-extrabold text-foreground'>{claimIds.length} đợt</p>
            </div>
            <div className='space-y-1 text-right'>
              <span className='text-[10px] text-muted-foreground uppercase'>
                Tổng Net thực nhận
              </span>
              <p className='text-base font-extrabold text-primary'>{claimedAmount} USDT</p>
            </div>
          </div>

          {/* Pipeline visualizer */}
          <div className='space-y-4'>
            {/* Step 1: Init */}
            <div className='flex items-start gap-4'>
              <div className='size-8 rounded-full flex items-center justify-center shrink-0 border border-border bg-background'>
                {claimStep !== 'init' ? (
                  <Icons.check className='size-4 text-primary font-bold' />
                ) : (
                  <Icons.spinner className='size-4 animate-spin text-primary' />
                )}
              </div>
              <div className='space-y-0.5 pt-1.5'>
                <h4
                  className={cn(
                    'text-xs font-bold',
                    claimStep === 'init' ? 'text-primary' : 'text-foreground/75'
                  )}
                >
                  1. Khởi tạo lệnh rút tiền
                </h4>
                <p className='text-[9px] text-muted-foreground'>
                  Đang tải dữ liệu allocation off-chain.
                </p>
              </div>
            </div>

            {/* Step 2: Sign */}
            <div className='flex items-start gap-4'>
              <div className='size-8 rounded-full flex items-center justify-center shrink-0 border border-border bg-background'>
                {claimStep === 'init' ? (
                  <div className='size-2 rounded-full bg-muted-foreground/30' />
                ) : claimStep !== 'sign' ? (
                  <Icons.check className='size-4 text-primary font-bold' />
                ) : (
                  <Icons.spinner className='size-4 animate-spin text-primary' />
                )}
              </div>
              <div className='space-y-0.5 pt-1.5'>
                <h4
                  className={cn(
                    'text-xs font-bold',
                    claimStep === 'sign'
                      ? 'text-primary'
                      : claimStep === 'init'
                        ? 'text-muted-foreground/50'
                        : 'text-foreground/75'
                  )}
                >
                  2. Phê duyệt và ký trên ví Web3 (Metamask)
                </h4>
                <p className='text-[9px] text-muted-foreground'>
                  Vui lòng xác nhận giao dịch claim trong ví của bạn.
                </p>
              </div>
            </div>

            {/* Step 3: Broadcast */}
            <div className='flex items-start gap-4'>
              <div className='size-8 rounded-full flex items-center justify-center shrink-0 border border-border bg-background'>
                {['init', 'sign'].includes(claimStep) ? (
                  <div className='size-2 rounded-full bg-muted-foreground/30' />
                ) : claimStep !== 'broadcast' ? (
                  <Icons.check className='size-4 text-primary font-bold' />
                ) : (
                  <Icons.spinner className='size-4 animate-spin text-primary' />
                )}
              </div>
              <div className='space-y-0.5 pt-1.5'>
                <h4
                  className={cn(
                    'text-xs font-bold',
                    claimStep === 'broadcast'
                      ? 'text-primary'
                      : ['init', 'sign'].includes(claimStep)
                        ? 'text-muted-foreground/50'
                        : 'text-foreground/75'
                  )}
                >
                  3. Gửi giao dịch lên Blockchain
                </h4>
                <p className='text-[9px] text-muted-foreground'>
                  Đang truyền phát và chờ xác nhận khối trên BNB Chain.
                </p>
              </div>
            </div>

            {/* Step 4: Sync */}
            <div className='flex items-start gap-4'>
              <div className='size-8 rounded-full flex items-center justify-center shrink-0 border border-border bg-background'>
                {['init', 'sign', 'broadcast'].includes(claimStep) ? (
                  <div className='size-2 rounded-full bg-muted-foreground/30' />
                ) : claimStep !== 'sync' ? (
                  <Icons.check className='size-4 text-primary font-bold' />
                ) : (
                  <Icons.spinner className='size-4 animate-spin text-primary' />
                )}
              </div>
              <div className='space-y-0.5 pt-1.5'>
                <h4
                  className={cn(
                    'text-xs font-bold',
                    claimStep === 'sync'
                      ? 'text-primary'
                      : ['init', 'sign', 'broadcast'].includes(claimStep)
                        ? 'text-muted-foreground/50'
                        : 'text-foreground/75'
                  )}
                >
                  4. Đồng bộ dữ liệu hệ thống Zentrix
                </h4>
                <p className='text-[9px] text-muted-foreground'>
                  Đang đối soát on-chain hash để hoàn tất ledger off-chain.
                </p>
              </div>
            </div>
          </div>

          {/* Success layout block */}
          {claimStep === 'success' && (
            <div className='p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500'>
              <div className='flex items-center gap-3'>
                <div className='size-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0 animate-bounce'>
                  <Icons.circleCheck className='size-6 text-primary' />
                </div>
                <div className='space-y-0.5'>
                  <h4 className='text-xs font-extrabold text-primary uppercase'>
                    Rút hoàn phí thành công!
                  </h4>
                  <p className='text-[10px] text-muted-foreground'>
                    Lệnh rút tiền của bạn đã được ghi nhận trên blockchain.
                  </p>
                </div>
              </div>
              {txHash && (
                <div className='space-y-2 border-t border-primary/10 pt-3 text-[10px]'>
                  <p className='font-bold text-foreground/80'>Mã giao dịch (Tx Hash):</p>
                  <div className='flex items-center justify-between p-2 rounded bg-background border border-border font-mono break-all'>
                    <span className='truncate mr-4'>{txHash}</span>
                    <a
                      href={`https://bscscan.com/tx/${txHash}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary hover:underline font-bold flex items-center shrink-0'
                    >
                      BscScan
                      <Icons.externalLink className='size-3 ml-1' />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
