'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';

// Mock pool of downline emails, trade lot sizes, assets, and brokers
const mockEmails = [
  'hoang.le***@gmail.com',
  'minh.ngu***@yahoo.com',
  'tuan_an***@outlook.com',
  'dieu.ha***@exness.com',
  'trung.du***@hotmail.com',
  'vinh_ph***@live.com',
  'khanh.ha***@gmail.com',
  'anh.tuan***@icloud.com'
];

const mockAssets = [
  { name: 'XAUUSD', rebatePerLot: 3 }, // override rate e.g. $3 per lot
  { name: 'EURUSD', rebatePerLot: 2 },
  { name: 'GBPUSD', rebatePerLot: 2 },
  { name: 'BTCUSD', rebatePerLot: 5 },
  { name: 'ETHUSD', rebatePerLot: 4 }
];

const mockBrokers = ['Exness', 'XM Global', 'IC Markets'];

export default function RebateNotificationEngine() {
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize mute state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('zentrix_rebate_mute');
      setIsMuted(storedMute === 'true');
    }
  }, []);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zentrix_rebate_mute', String(nextMute));
    }
    toast.info(
      nextMute
        ? 'Đã tắt thông báo hoa hồng thời gian thực.'
        : 'Đã bật thông báo hoa hồng thời gian thực.'
    );
  };

  useEffect(() => {
    if (isMuted) return;

    const fireNotification = () => {
      // Pick random values
      const email = mockEmails[Math.floor(Math.random() * mockEmails.length)];
      const asset = mockAssets[Math.floor(Math.random() * mockAssets.length)];
      const broker = mockBrokers[Math.floor(Math.random() * mockBrokers.length)];
      const lots = Math.round((Math.random() * 15 + 0.5) * 10) / 10; // 0.5 to 15.5 lots
      const reward = Math.round(lots * asset.rebatePerLot * 100) / 100;
      const tier = Math.random() > 0.4 ? 'F1' : 'F2';

      toast.custom(
        (t) => (
          <div className='bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 max-w-sm w-full animate-in slide-in-from-right-5 duration-300'>
            <div className='flex items-center gap-3 min-w-0'>
              <div className='size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 relative'>
                <span className='absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 animate-pulse' />
                <Icons.gift className='size-5' />
              </div>
              <div className='min-w-0 space-y-0.5'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-[10px] font-extrabold uppercase text-primary tracking-wider'>
                    Chiết khấu Downline {tier}
                  </span>
                  <span className='text-[9px] text-muted-foreground font-medium'>• {broker}</span>
                </div>
                <p className='text-[11px] font-bold text-foreground leading-normal truncate'>
                  {email}
                </p>
                <p className='text-[10px] text-muted-foreground leading-tight'>
                  Vừa giao dịch <strong className='text-foreground font-mono'>{lots} lots</strong>{' '}
                  {asset.name}. Bạn nhận được{' '}
                  <strong className='text-emerald-500 font-mono font-black'>
                    +${reward.toFixed(2)}
                  </strong>{' '}
                  hoa hồng!
                </p>
              </div>
            </div>
            <div className='flex flex-col gap-1 shrink-0'>
              <Button
                onClick={() => toast.dismiss(t)}
                className='size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center p-0 cursor-pointer transition-colors'
              >
                <Icons.close className='size-4' />
              </Button>
            </div>
          </div>
        ),
        {
          duration: 8000
        }
      );
    };

    // Fire first notification after 15 seconds
    const initialTimeout = setTimeout(fireNotification, 15000);

    // Set recurring timer between 25 and 45 seconds
    const interval = setInterval(
      () => {
        if (!isMuted) {
          fireNotification();
        }
      },
      Math.floor(Math.random() * 20000) + 25000
    );

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isMuted]);

  return (
    <div className='fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300'>
      <button
        onClick={toggleMute}
        title={isMuted ? 'Bật thông báo hoa hồng trực tiếp' : 'Tắt thông báo hoa hồng trực tiếp'}
        className='flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted shadow-lg hover:scale-105 cursor-pointer transition-all'
      >
        {isMuted ? (
          <Icons.eyeOff className='size-4 text-muted-foreground/60' />
        ) : (
          <div className='relative'>
            <span className='absolute -top-1.5 -right-1.5 flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
            </span>
            <Icons.sparkles className='size-4 text-primary animate-pulse' />
          </div>
        )}
      </button>
    </div>
  );
}

// Inline button helper to avoid shadcn coupling issues
function Button({
  children,
  className,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
