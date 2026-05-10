'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { LinkUidContent } from '@/features/rebate/components/link-uid-content';
import { cn } from '@/lib/utils';

export default function RebateListPage() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState('all');
  const [selectedExchange, setSelectedExchange] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <PageContainer
      pageTitle='Quản Lý Tài Khoản'
      pageDescription='Kết nối và quản lý tài khoản sàn giao dịch của bạn'
      pageHeaderAction={
        <Button
          onClick={handleOpenModal}
          className='bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 rounded-xl px-5'
        >
          <Icons.add className='size-5' />
          Kết Nối Sàn Mới
        </Button>
      }
    >
      <div className='flex flex-col gap-6'>
        {/* Filters and Tabs Row */}
        <div className='flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 border-b border-border/50 pb-0'>
          <Tabs value={activeStatus} onValueChange={setActiveStatus} className='w-full lg:w-auto'>
            <TabsList className='bg-transparent p-0 h-auto gap-8 w-full lg:w-auto justify-start rounded-none border-none'>
              <TabsTrigger
                value='all'
                className='rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm font-medium transition-all shadow-none bg-transparent data-[state=active]:bg-transparent'
              >
                Tất Cả
              </TabsTrigger>
              <TabsTrigger
                value='active'
                className='rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm font-medium transition-all shadow-none bg-transparent data-[state=active]:bg-transparent'
              >
                Đang Hoạt Động
              </TabsTrigger>
              <TabsTrigger
                value='pending'
                className='rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm font-medium transition-all shadow-none bg-transparent data-[state=active]:bg-transparent'
              >
                Đang Chờ
              </TabsTrigger>
              <TabsTrigger
                value='rejected'
                className='rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground text-sm font-medium transition-all shadow-none bg-transparent data-[state=active]:bg-transparent'
              >
                Từ Chối
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='flex items-center gap-3 pb-2'>
            <span className='text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest'>
              Lọc theo sàn:
            </span>
            <Select value={selectedExchange} onValueChange={setSelectedExchange}>
              <SelectTrigger className='w-[140px] bg-muted/40 border-none hover:bg-muted/60 transition-colors rounded-lg h-8 text-[11px] font-bold shadow-none focus:ring-0'>
                <SelectValue placeholder='Tất Cả Sàn' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất Cả Sàn</SelectItem>
                <SelectItem value='exness'>Exness</SelectItem>
                <SelectItem value='hfm'>HFM</SelectItem>
                <SelectItem value='vantage'>Vantage</SelectItem>
                <SelectItem value='xm'>XM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Area - Empty State */}
        <Card className='bg-card/50 border-border shadow-2xl min-h-[450px] flex items-center justify-center rounded-3xl overflow-hidden'>
          <CardContent className='flex flex-col items-center text-center p-12 max-w-md'>
            <div className='relative group'>
              <div className='absolute -inset-1 bg-primary/20 rounded-2xl blur-lg group-hover:bg-primary/30 transition-all opacity-0 group-hover:opacity-100' />
              <div className='relative size-20 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-8 text-muted-foreground transition-transform group-hover:scale-110'>
                <Icons.wallet className='size-10 opacity-80' />
              </div>
            </div>
            <h3 className='text-2xl font-black mb-3 tracking-tight'>Chưa Có Sàn Nào</h3>
            <p className='text-muted-foreground mb-10 text-sm leading-relaxed'>
              Kết nối sàn đầu tiên của bạn để bắt đầu nhận hoàn phí tự động và minh bạch từ hệ
              thống.
            </p>
            <Button
              onClick={handleOpenModal}
              className='bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-3 px-10 py-7 rounded-2xl text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]'
            >
              <Icons.add className='size-6' />
              Kết Nối Sàn Mới
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Connection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none'>
          <DialogHeader className='sr-only'>
            <DialogTitle>Kết Nối Sàn Giao Dịch</DialogTitle>
            <DialogDescription>
              Thực hiện các bước để kết nối sàn giao dịch của bạn
            </DialogDescription>
          </DialogHeader>
          <div className='bg-background rounded-3xl p-6 sm:p-10 shadow-2xl border border-border'>
            <div className='flex items-center gap-4 mb-8'>
              <div className='size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary'>
                <Icons.link className='size-6' />
              </div>
              <h2 className='text-3xl font-black tracking-tight'>Kết Nối Sàn</h2>
            </div>
            <LinkUidContent />
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
