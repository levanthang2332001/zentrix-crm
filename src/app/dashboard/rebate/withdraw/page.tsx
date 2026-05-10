'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function RebateWithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleVerify = () => {
    // Logic for verification would go here
    console.log('Verifying wallet:', walletAddress);
    setIsVerified(true); // Mock verification for UI demonstration
  };

  const presets = [
    { label: '$10', value: '10' },
    { label: '$50', value: '50' },
    { label: '$100', value: '100' },
    { label: '$500', value: '500' },
    { label: 'MAX', value: '0' } // Should handle actual max balance
  ];

  return (
    <PageContainer>
      <div className='flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            className='rounded-lg bg-muted border-border hover:bg-accent'
            onClick={handleBack}
          >
            <Icons.chevronLeft className='size-5' />
          </Button>
          <h1 className='text-3xl font-bold tracking-tight'>Rút tiền</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Left Column: Balance & Wallet */}
          <div className='lg:col-span-7 space-y-6'>
            {/* Balance Card */}
            <Card className='bg-card border-border shadow-xl overflow-hidden relative'>
              <CardContent className='p-6 flex justify-between items-center'>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground font-medium'>Số dư khả dụng</p>
                  <h2 className='text-4xl font-bold tracking-tight'>$0.00</h2>
                </div>
                <div className='relative'>
                  <div className='size-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3'>
                    <Icons.creditCard className='size-8 text-white' />
                    <div className='absolute -top-1 -right-1 bg-blue-400 rounded-full p-1 border-2 border-card'>
                      <Icons.arrowRight className='size-3 text-white -rotate-45' />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Verification Card */}
            <Card className='bg-card border-border shadow-xl overflow-hidden relative'>
              <div className='absolute top-0 right-0 p-8 opacity-5'>
                <Icons.wallet className='size-32 rotate-12' />
              </div>
              <CardHeader className='pb-4'>
                <div className='flex justify-between items-start'>
                  <div className='space-y-1'>
                    <CardTitle className='text-xl font-bold flex items-center gap-2'>
                      Địa chỉ ví nhận tiền
                      {isVerified && (
                        <Icons.badgeCheck className='size-5 text-primary fill-primary/10' />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Liên kết địa chỉ ví để nhận hoàn phí và thực hiện rút tiền.
                    </CardDescription>
                  </div>
                  <Badge
                    variant={isVerified ? 'default' : 'secondary'}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      isVerified
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-3'>
                  <Label className='text-sm font-semibold text-foreground flex items-center gap-2'>
                    <Icons.link className='size-4 text-primary' />
                    Địa chỉ ví (BEP20 / ERC20)
                  </Label>
                  <div className='flex gap-3'>
                    <div className='relative flex-1 group'>
                      <div className='absolute inset-y-0 left-3 flex items-center pointer-events-none'>
                        <Icons.wallet className='size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                      </div>
                      <Input
                        placeholder='0x...'
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className='pl-10 h-11 bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 transition-all'
                      />
                    </div>
                    <Button
                      onClick={handleVerify}
                      disabled={!walletAddress || isVerified}
                      className='h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all active:scale-95'
                    >
                      {isVerified ? 'Đã liên kết' : 'Xác thực'}
                    </Button>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/50'>
                    <div className='size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                      <Icons.sparkles className='size-4 text-primary' />
                    </div>
                    <div className='space-y-0.5'>
                      <h4 className='text-xs font-bold'>Tự động</h4>
                      <p className='text-[10px] text-muted-foreground leading-tight'>
                        Hoàn phí về ví đã xác thực.
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/50'>
                    <div className='size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                      <Icons.lock className='size-4 text-primary' />
                    </div>
                    <div className='space-y-0.5'>
                      <h4 className='text-xs font-bold'>An toàn</h4>
                      <p className='text-[10px] text-muted-foreground leading-tight'>
                        Chỉ rút tiền về ví chính chủ.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className='bg-primary/5 border-primary/20 rounded-xl py-3'>
                  <Icons.info className='size-4 text-primary' />
                  <AlertTitle className='font-bold text-xs text-primary ml-1'>Lưu ý</AlertTitle>
                  <AlertDescription className='text-[10px] text-foreground/80 mt-1 ml-1 leading-relaxed'>
                    Sau khi đã xác thực, bạn cần liên hệ hỗ trợ kỹ thuật nếu muốn thay đổi địa chỉ
                    ví.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Withdrawal Form */}
          <div className='lg:col-span-5'>
            <Card className='bg-card border-border shadow-xl h-full'>
              <CardHeader>
                <CardTitle className='text-xl font-bold'>Yêu cầu rút tiền</CardTitle>
                <CardDescription>Nhập số tiền và chọn mạng lưới để thực hiện.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Amount Section */}
                <div className='space-y-4'>
                  <Label className='text-sm font-semibold text-foreground'>Số tiền</Label>
                  <div className='relative'>
                    <Input
                      type='number'
                      placeholder='0.00'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className='h-14 bg-muted/50 border-border focus:ring-primary/20 text-xl font-medium px-4'
                    />
                  </div>
                  <div className='grid grid-cols-5 gap-2'>
                    {presets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant='outline'
                        className={cn(
                          'bg-muted/30 border-border hover:bg-accent text-xs text-muted-foreground font-bold h-9 transition-all',
                          preset.label === 'MAX' &&
                            'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                        )}
                        onClick={() => preset.label !== 'MAX' && setAmount(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Network Section */}
                <div className='space-y-3'>
                  <Label className='text-sm font-semibold text-foreground'>Chọn mạng</Label>
                  <Select value={network} onValueChange={setNetwork}>
                    <SelectTrigger className='h-12 bg-muted/50 border-border focus:ring-primary/20 text-foreground'>
                      <SelectValue placeholder='Select network' />
                    </SelectTrigger>
                    <SelectContent className='bg-card border-border text-foreground'>
                      <SelectItem value='trc20'>TRC20</SelectItem>
                      <SelectItem value='erc20'>ERC20</SelectItem>
                      <SelectItem value='bep20'>BEP20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <Button
                  className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-xl text-lg shadow-primary/20 transition-all active:scale-[0.98]'
                  disabled={!isVerified || !amount || !network}
                >
                  Gửi yêu cầu
                </Button>

                {!isVerified && (
                  <p className='text-center text-xs text-destructive font-medium animate-pulse'>
                    Vui lòng xác thực địa chỉ ví trước khi rút tiền
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
