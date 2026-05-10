'use client';

import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText
} from '@/components/ui/input-group';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

export default function RebateHistoryPage() {
  return (
    <PageContainer
      pageTitle='Lịch sử giao dịch'
      pageDescription='Theo dõi lịch sử hoàn phí, đã rút và số dư đang chờ duyệt'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <Button variant='outline' className='bg-muted border-border text-muted-foreground gap-2'>
            <Icons.billing className='size-4' />
            Yêu cầu rút tiền ($0.00)
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='bg-muted border-border text-muted-foreground'
          >
            <Icons.refresh className='size-4' />
          </Button>
        </div>
      }
    >
      <div className='flex flex-col gap-6'>
        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[
            { label: 'Tổng hoàn phí', value: '$0.00', icon: Icons.trendingUp },
            { label: 'Tổng đã rút', value: '$0.00', icon: Icons.billing },
            { label: 'Số dư khả dụng', value: '$0.00', icon: Icons.billing },
            { label: 'Số dư đang chờ duyệt', value: '$0.00', icon: Icons.clock }
          ].map((stat, i) => (
            <Card key={i} className='bg-muted/50 border-border'>
              <CardContent className='p-6 flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground mb-1'>{stat.label}</p>
                  <p className='text-2xl font-bold'>{stat.value}</p>
                </div>
                <div className='bg-muted/50 p-2 rounded-lg text-muted-foreground/60'>
                  <stat.icon className='size-6' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className='flex gap-2'>
          <InputGroup className='flex-1 bg-muted/50 border-border'>
            <InputGroupAddon>
              <Icons.search className='size-4 text-muted-foreground' />
            </InputGroupAddon>
            <InputGroupInput
              placeholder='Tìm theo mã giao dịch, loại, sàn hoặc số tiền'
              className='text-muted-foreground placeholder:text-muted-foreground/60'
            />
          </InputGroup>
          <Button
            variant='outline'
            size='icon'
            className='bg-muted border-border text-muted-foreground'
          >
            <Icons.adjustments className='size-4' />
          </Button>
        </div>

        {/* Transaction Table / Content */}
        <div className='min-h-[400px] flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <div className='bg-muted/30 p-6 rounded-2xl'>
              <Icons.workspace className='size-12 text-muted-foreground/40' />
            </div>
            <div>
              <h3 className='text-lg font-semibold'>Không tìm thấy giao dịch</h3>
              <p className='text-sm text-muted-foreground'>Hãy điều chỉnh tìm kiếm hoặc bộ lọc</p>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className='flex flex-col items-center gap-4 mt-2'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  className='bg-muted border-border text-muted-foreground hover:bg-accent'
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href='#'
                  isActive
                  className='bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href='#'
                  className='bg-muted border-border text-muted-foreground hover:bg-accent'
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className='text-xs text-muted-foreground uppercase tracking-wider'>
            Hiển thị 1 đến 0 trong 0 kết quả
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
