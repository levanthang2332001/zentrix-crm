'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'register', label: 'Đăng Ký', icon: Icons.edit },
  { id: 'uid', label: 'Nhập UID', icon: Icons.user },
  { id: 'complete', label: 'Hoàn Thành', icon: Icons.circleCheck }
];

const EXCHANGES = [
  {
    id: 'exness',
    name: 'Exness',
    rebate: '100.0%',
    bgColor: 'bg-[#FFD700]',
    textColor: 'text-black',
    shortName: 'ex'
  },
  {
    id: 'hfm',
    name: 'HFM',
    rebate: '100.0%',
    bgColor: 'bg-black',
    textColor: 'text-white',
    shortName: 'HFM'
  },
  {
    id: 'ultima',
    name: 'Ultima',
    rebate: '100.0%',
    bgColor: 'bg-black',
    textColor: 'text-white',
    shortName: 'U'
  },
  {
    id: 'vantage',
    name: 'Vantage',
    rebate: '100.0%',
    bgColor: 'bg-[#1A2B3C]',
    textColor: 'text-white',
    shortName: 'V'
  },
  {
    id: 'xm',
    name: 'XM',
    rebate: '90.0%',
    bgColor: 'bg-black',
    textColor: 'text-white',
    shortName: 'XM'
  }
];

export default function RebateLinkUidPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('register');
  const [activeTab, setActiveTab] = useState('forex');
  const [selectedExchange, setSelectedExchange] = useState('exness');

  const handleBack = () => {
    router.back();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here if available
  };

  return (
    <PageContainer>
      <div className='flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            className='rounded-lg bg-muted/50 border-border hover:bg-accent'
            onClick={handleBack}
          >
            <Icons.chevronLeft className='size-5' />
          </Button>
          <h1 className='text-3xl font-bold tracking-tight'>Kết Nối Sàn Giao Dịch</h1>
        </div>

        {/* Stepper */}
        <div className='flex justify-center items-start gap-0 py-4'>
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = STEPS.findIndex((s) => s.id === currentStep) > index;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <div className='flex flex-col items-center gap-2 z-10'>
                  <div
                    className={cn(
                      'size-12 rounded-full flex items-center justify-center transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                        : isCompleted
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-muted text-muted-foreground border border-border'
                    )}
                  >
                    <StepIcon className='size-6' />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && <div className='h-[2px] w-20 bg-border mt-6 -mx-2' />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Exchange Selection Section */}
        <Card className='bg-card border-border shadow-xl'>
          <CardHeader className='flex-row items-center justify-between pb-6'>
            <div className='space-y-1'>
              <CardTitle className='text-xl font-bold'>Chọn Sàn Giao Dịch</CardTitle>
              <CardDescription className='text-muted-foreground'>
                Chọn sàn giao dịch bạn muốn kết nối để nhận hoàn phí
              </CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-auto'>
              <TabsList className='bg-muted/80 border-border p-1'>
                <TabsTrigger value='crypto' className='gap-2 px-4 py-1.5'>
                  Crypto{' '}
                  <Badge variant='secondary' className='bg-muted text-muted-foreground border-none'>
                    12
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value='forex'
                  className='gap-2 px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                >
                  Forex{' '}
                  <Badge variant='secondary' className='bg-black/20 text-inherit border-none'>
                    5
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4'>
              {EXCHANGES.map((exchange) => (
                <div
                  key={exchange.id}
                  onClick={() => setSelectedExchange(exchange.id)}
                  className={cn(
                    'relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all cursor-pointer group',
                    selectedExchange === exchange.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-muted/30 hover:border-accent-foreground/20'
                  )}
                >
                  {selectedExchange === exchange.id && (
                    <div className='absolute top-3 right-3 size-5 bg-primary rounded-full flex items-center justify-center shadow-lg'>
                      <Icons.check className='size-3 text-primary-foreground' />
                    </div>
                  )}
                  <div
                    className={cn(
                      'size-14 rounded-xl flex items-center justify-center mb-3 font-bold text-lg shadow-inner transition-transform group-hover:scale-105',
                      exchange.bgColor,
                      exchange.textColor
                    )}
                  >
                    {exchange.shortName}
                  </div>
                  <span className='text-sm font-semibold text-foreground mb-1'>
                    {exchange.name}
                  </span>
                  <span className='text-xs text-primary font-bold tracking-tight'>
                    {exchange.rebate}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rebate Info Section Header */}
        <div className='space-y-1 mt-2'>
          <h2 className='text-xl font-bold'>Thông Tin Hoàn Phí</h2>
          <p className='text-sm text-muted-foreground'>
            Chi tiết hoàn phí khi giao dịch trên{' '}
            {EXCHANGES.find((e) => e.id === selectedExchange)?.name}
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Left: Percentages */}
          <Card className='bg-card border-border shadow-lg'>
            <CardContent className='flex flex-col gap-4 py-6'>
              <div className='flex justify-between items-center bg-muted/40 p-5 rounded-xl border border-border/50'>
                <span className='text-sm text-muted-foreground'>
                  Hoàn phí tự động bởi {EXCHANGES.find((e) => e.id === selectedExchange)?.name}
                </span>
                <div className='flex items-baseline gap-1'>
                  <span className='text-2xl font-bold'>100</span>
                  <span className='text-sm text-muted-foreground font-medium'>%</span>
                </div>
              </div>
              <div className='flex justify-between items-center bg-muted/40 p-5 rounded-xl border border-border/50'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>Hoàn phí bởi Backcom.io</span>
                  <Badge className='bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider font-bold'>
                    Độc quyền
                  </Badge>
                </div>
                <div className='flex items-baseline gap-1'>
                  <span className='text-2xl font-bold text-primary'>0</span>
                  <span className='text-sm text-muted-foreground font-medium'>%</span>
                </div>
              </div>
              <div className='flex justify-between items-center bg-primary/5 p-5 rounded-xl border border-primary/30 mt-2'>
                <span className='text-sm font-bold text-foreground'>Tổng hoàn phí</span>
                <div className='flex items-baseline gap-1 text-primary'>
                  <span className='text-3xl font-black tabular-nums'>100.00</span>
                  <span className='text-sm font-bold'>%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Referral & Action */}
          <Card className='bg-card border-border shadow-lg'>
            <CardContent className='flex flex-col gap-6 py-6'>
              <div className='space-y-2'>
                <span className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>
                  Mã giới thiệu
                </span>
                <div className='flex items-center justify-between bg-muted/80 p-5 rounded-xl border border-border'>
                  <span className='text-primary font-black text-xl tracking-wider'>bcglobal</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 text-primary hover:text-primary hover:bg-primary/10 rounded-lg'
                    onClick={() => copyToClipboard('bcglobal')}
                  >
                    <Icons.copy className='size-5' />
                  </Button>
                </div>
              </div>

              <Button className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-14 rounded-2xl text-base gap-2 shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95'>
                Đăng ký {EXCHANGES.find((e) => e.id === selectedExchange)?.name}
                <Icons.externalLink className='size-5' />
              </Button>

              <div className='flex justify-center items-center gap-1.5 text-sm text-muted-foreground'>
                Đã có tài khoản?
                <Button
                  variant='link'
                  className='p-0 h-auto text-primary font-bold hover:no-underline flex items-center gap-1'
                >
                  Xem hướng dẫn <Icons.externalLink className='size-3.5' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Button */}
        <Button className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-16 rounded-2xl text-lg gap-3 mt-6 shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]'>
          Tiếp Theo
          <Icons.arrowRight className='size-7' />
        </Button>
      </div>
    </PageContainer>
  );
}
