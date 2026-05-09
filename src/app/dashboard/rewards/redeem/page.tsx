import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Đổi Thưởng'
};

export default function RewardRedeemPage() {
  return (
    <PageContainer
      pageTitle='Đổi Thưởng'
      pageDescription='Đổi điểm thưởng của bạn lấy những phần quà giá trị.'
    >
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Cửa hàng đang bảo trì</h3>
          <p className='text-sm text-muted-foreground'>Tính năng đổi thưởng sẽ sớm quay trở lại.</p>
        </div>
      </div>
    </PageContainer>
  );
}
