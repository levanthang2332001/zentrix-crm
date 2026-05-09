import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Rút Tiền'
};

export default function RebateWithdrawPage() {
  return (
    <PageContainer
      pageTitle='Rút Tiền'
      pageDescription='Thực hiện yêu cầu rút tiền từ số dư hoàn phí.'
    >
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Số dư: 0đ</h3>
          <p className='text-sm text-muted-foreground'>
            Bạn cần có số dư tối thiểu để thực hiện rút tiền.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
