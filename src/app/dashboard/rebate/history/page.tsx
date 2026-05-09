import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Lịch Sử Hoàn Phí'
};

export default function RebateHistoryPage() {
  return (
    <PageContainer
      pageTitle='Lịch Sử Hoàn Phí'
      pageDescription='Xem lại lịch sử các giao dịch hoàn phí.'
    >
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Trống</h3>
          <p className='text-sm text-muted-foreground'>Lịch sử giao dịch sẽ xuất hiện tại đây.</p>
        </div>
      </div>
    </PageContainer>
  );
}
