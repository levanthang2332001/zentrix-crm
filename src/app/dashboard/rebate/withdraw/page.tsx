'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function RebateWithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('');

  const handleBack = () => {
    router.back();
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
      <div className='flex flex-col gap-6 max-w-2xl mx-auto w-full pb-10'>
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

        {/* Withdrawal Form Card */}
        <Card className='bg-card border-border shadow-xl'>
          <CardContent className='p-8 space-y-8'>
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
                      'bg-muted/30 border-border hover:bg-accent text-muted-foreground font-bold h-10 transition-all',
                      preset.label === 'MAX' &&
                        'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    )}
                    onClick={() => preset.label !== 'MAX' && setAmount(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <p className='text-xs text-muted-foreground'>Số dư khả dụng $0.00</p>
            </div>

            {/* Network Section */}
            <div className='space-y-3'>
              <Label className='text-sm font-semibold text-foreground'>Chọn mạng</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger className='h-14 bg-muted/50 border-border focus:ring-primary/20 text-foreground'>
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
            <Button className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-xl text-lg shadow-primary/20 transition-all active:scale-[0.98]'>
              Gửi yêu cầu
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
