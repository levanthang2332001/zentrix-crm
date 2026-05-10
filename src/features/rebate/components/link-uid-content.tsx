'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function LinkUidContent() {
  const [currentStep, setCurrentStep] = useState('register');
  const [activeTab, setActiveTab] = useState('forex');
  const [selectedExchange, setSelectedExchange] = useState('exness');
  const [uidValue, setUidValue] = useState('');

  // Auto-detect exchange based on UID value
  useEffect(() => {
    const lowercaseUid = uidValue.toLowerCase();
    if (lowercaseUid.includes('exness')) {
      setSelectedExchange('exness');
    } else if (lowercaseUid.includes('hfm')) {
      setSelectedExchange('hfm');
    } else if (lowercaseUid.includes('ultima')) {
      setSelectedExchange('ultima');
    } else if (lowercaseUid.includes('vantage')) {
      setSelectedExchange('vantage');
    } else if (lowercaseUid.includes('xm')) {
      setSelectedExchange('xm');
    }
  }, [uidValue]);

  return (
    <div className='flex flex-col gap-6 w-full pb-6'>
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
              {index < STEPS.length - 1 && (
                <div className='h-[2px] w-12 sm:w-20 bg-border mt-6 -mx-2' />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* UID Input Section */}
      <Card className='bg-card border-border shadow-xl overflow-hidden'>
        <div className='absolute top-0 left-0 w-1 h-full bg-primary' />
        <CardContent className='p-6'>
          <div className='space-y-4'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='uid' className='text-sm font-bold tracking-tight'>
                Nhập UID / Số Tài Khoản
              </Label>
              <div className='relative'>
                <div className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'>
                  <Icons.user className='size-5' />
                </div>
                <Input
                  id='uid'
                  placeholder='Nhập UID để tự động nhận diện sàn...'
                  className='pl-12 h-14 bg-muted/30 border-border focus:bg-background transition-all rounded-xl text-base'
                  value={uidValue}
                  onChange={(e) => setUidValue(e.target.value)}
                />
              </div>
              <p className='text-[10px] text-muted-foreground/80 font-medium italic'>
                * Gợi ý: Nhập "exness", "hfm", "xm"... để trải nghiệm tính năng tự động nhận diện.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      <Button className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-14 rounded-2xl text-base gap-3 mt-4 shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]'>
        Tiếp Theo
        <Icons.arrowRight className='size-6' />
      </Button>
    </div>
  );
}
