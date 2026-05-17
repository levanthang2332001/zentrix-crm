'use client';

import React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface WalletConfigCardProps {
  dbWalletAddress: string;
  verificationWallet: string;
  setVerificationWallet: (val: string) => void;
  otpCode: string;
  setOtpCode: (val: string) => void;
  showOtpInput: boolean;
  isPending: boolean;
  isVerifyingOtp: boolean;
  handleRequestOtp: () => Promise<void>;
  handleConfirmOtp: () => Promise<void>;
  web3Wallet: string;
  isWeb3Connecting: boolean;
  handleConnectWeb3: () => Promise<void>;
}

export function WalletConfigCard({
  dbWalletAddress,
  verificationWallet,
  setVerificationWallet,
  otpCode,
  setOtpCode,
  showOtpInput,
  isPending,
  isVerifyingOtp,
  handleRequestOtp,
  handleConfirmOtp,
  web3Wallet,
  isWeb3Connecting,
  handleConnectWeb3
}: WalletConfigCardProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-12 gap-6 w-full'>
      {/* Web2 Registered Wallet status */}
      <Card className='md:col-span-6 bg-card border-border shadow-xl overflow-hidden relative group'>
        <div className='absolute top-0 right-0 p-6 opacity-5 group-hover:scale-105 transition-all duration-500'>
          <Icons.wallet className='size-28 rotate-12 text-primary' />
        </div>
        <CardHeader className='pb-3'>
          <div className='flex justify-between items-center'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.lock className='size-5 text-primary' />
              Ví Xác Thực (Web2 DB)
            </CardTitle>
            <Badge
              variant={dbWalletAddress ? 'default' : 'secondary'}
              className={cn(
                'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                dbWalletAddress
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {dbWalletAddress ? 'Đã liên kết' : 'Chưa liên kết'}
            </Badge>
          </div>
          <CardDescription>
            Địa chỉ ví BEP-20 duy nhất được phê duyệt để nhận tiền claim từ Smart Contract.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {dbWalletAddress ? (
            <div className='flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 transition-all'>
              <Icons.badgeCheck className='size-6 text-primary shrink-0 animate-pulse' />
              <div className='space-y-1 min-w-0'>
                <p className='text-[10px] uppercase font-bold text-primary tracking-wider'>
                  Địa chỉ ví whitelisted
                </p>
                <p className='text-sm font-mono truncate font-medium text-foreground'>
                  {dbWalletAddress}
                </p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              {!showOtpInput ? (
                <div className='flex gap-3'>
                  <div className='relative flex-1'>
                    <Icons.wallet className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                    <Input
                      placeholder='Nhập địa chỉ ví 0x...'
                      value={verificationWallet}
                      onChange={(e) => setVerificationWallet(e.target.value)}
                      className='pl-10 h-11 bg-muted/20 border-border focus:ring-primary/20 text-sm font-mono'
                    />
                  </div>
                  <Button
                    onClick={handleRequestOtp}
                    disabled={isPending || !verificationWallet}
                    className='h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:scale-[0.98]'
                  >
                    {isPending ? <Icons.spinner className='size-4 animate-spin' /> : 'Xác thực'}
                  </Button>
                </div>
              ) : (
                <div className='space-y-3 p-4 rounded-xl bg-muted/20 border border-border animate-in fade-in slide-in-from-bottom-2 duration-300'>
                  <Label className='text-xs font-bold text-foreground flex items-center gap-2'>
                    <Icons.toastInfo className='size-4 text-primary' />
                    Nhập mã OTP 6 số đã nhận từ email:
                  </Label>
                  <div className='flex gap-3'>
                    <Input
                      placeholder='Mã OTP 6 số'
                      value={otpCode}
                      maxLength={6}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className='h-11 flex-1 text-center font-bold tracking-[0.5em] text-lg bg-background border-border'
                    />
                    <Button
                      onClick={handleConfirmOtp}
                      disabled={isVerifyingOtp}
                      className='h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all'
                    >
                      {isVerifyingOtp ? (
                        <Icons.spinner className='size-4 animate-spin' />
                      ) : (
                        'Xận nhận'
                      )}
                    </Button>
                  </div>
                  <p className='text-[10px] text-muted-foreground/80 font-medium italic mt-1'>
                    * Demo mode: Nhập bất kỳ mã OTP 6 chữ số nào để liên kết ví.
                  </p>
                </div>
              )}
            </div>
          )}
          <Alert className='bg-primary/5 border-primary/10 rounded-xl py-3'>
            <Icons.info className='size-4 text-primary' />
            <AlertTitle className='font-bold text-xs text-primary ml-1'>
              Bảo mật phi lưu ký
            </AlertTitle>
            <AlertDescription className='text-[10px] text-foreground/80 mt-1 ml-1 leading-relaxed'>
              Chỉ ví whitelisted đã được xác minh qua Email mới có quyền thực hiện claim từ
              contract. Thay đổi ví yêu cầu hỗ trợ kỹ thuật.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Web3 active browser wallet connector */}
      <Card className='md:col-span-6 bg-card border-border shadow-xl overflow-hidden relative group'>
        <div className='absolute top-0 right-0 p-6 opacity-5 group-hover:scale-105 transition-all duration-500'>
          <Icons.link className='size-28 -rotate-12 text-primary' />
        </div>
        <CardHeader className='pb-3'>
          <div className='flex justify-between items-center'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.link className='size-5 text-primary' />
              Kết Nối Ví Web3 (MetaMask)
            </CardTitle>
            <Badge
              variant={web3Wallet ? 'default' : 'secondary'}
              className={cn(
                'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                web3Wallet ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {web3Wallet ? 'Đang kết nối' : 'Ngắt kết nối'}
            </Badge>
          </div>
          <CardDescription>
            Kết nối ví Web3 hiện tại trong trình duyệt để trực tiếp phê duyệt và ký giao dịch trên
            chain.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 flex flex-col justify-between h-[180px]'>
          {web3Wallet ? (
            <div className='flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 transition-all'>
              <div className='size-2 rounded-full bg-primary animate-ping shrink-0' />
              <div className='space-y-1 min-w-0 flex-1'>
                <p className='text-[10px] uppercase font-bold text-primary tracking-wider'>
                  Ví Web3 Active
                </p>
                <p className='text-sm font-mono truncate font-medium text-foreground'>
                  {web3Wallet}
                </p>
              </div>
              {dbWalletAddress && web3Wallet.toLowerCase() !== dbWalletAddress.toLowerCase() && (
                <Badge variant='destructive' className='text-[8px] animate-bounce shrink-0'>
                  Lệch ví
                </Badge>
              )}
            </div>
          ) : (
            <Button
              onClick={handleConnectWeb3}
              disabled={isWeb3Connecting}
              className='w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-base rounded-2xl gap-3 shadow-lg shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all'
            >
              {isWeb3Connecting ? (
                <Icons.spinner className='size-6 animate-spin' />
              ) : (
                <>
                  <Icons.wallet className='size-6' />
                  Kết Nối Ví Web3
                </>
              )}
            </Button>
          )}

          {dbWalletAddress &&
            web3Wallet &&
            web3Wallet.toLowerCase() !== dbWalletAddress.toLowerCase() && (
              <Alert
                variant='destructive'
                className='py-2 rounded-xl border-destructive/20 bg-destructive/5'
              >
                <Icons.warning className='size-4 text-destructive' />
                <AlertDescription className='text-[9px] font-bold text-destructive leading-tight'>
                  Cảnh báo: Địa chỉ ví Web3 kết nối không trùng khớp với địa chỉ whitelisted! Bạn
                  không thể claim.
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
