import PageContainer from '@/components/layout/page-container';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import React from 'react';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Thống Kê</h2>
          </div>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span>Cập nhật lúc: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-7'>
          <div className='col-span-1 flex flex-col gap-6 lg:col-span-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <Card className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icons.trendingUp className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>Tổng KLGD</p>
                    <p className='text-lg font-bold'>$0</p>
                  </div>
                </div>
              </Card>
              <Card className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icons.billing className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>Tổng Hoàn Tiền</p>
                    <p className='text-lg font-bold'>$0</p>
                  </div>
                </div>
              </Card>
              <Card className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icons.clock className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Hoàn Tiền Chờ Thanh Toán
                    </p>
                    <p className='text-lg font-bold'>$0</p>
                  </div>
                </div>
              </Card>
            </div>

            {area_stats}
          </div>

          <div className='col-span-1 lg:col-span-3'>{sales}</div>
        </div>
      </div>
    </PageContainer>
  );
}
