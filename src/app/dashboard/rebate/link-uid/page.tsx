import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Liên Kết UID'
};

export default function RebateLinkUidPage() {
  return (
    <PageContainer pageTitle='Liên Kết UID' pageDescription='Kết nối tài khoản của bạn bằng UID.'>
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Tính năng đang phát triển</h3>
          <p className='text-sm text-muted-foreground'>Bạn sẽ có thể liên kết UID tại đây.</p>
        </div>
      </div>
    </PageContainer>
  );
}
