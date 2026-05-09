import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Cài đặt'
};

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle='Cài đặt'
      pageDescription='Quản lý cấu hình hệ thống và tài khoản của bạn.'
    >
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Cài đặt</h3>
          <p className='text-sm text-muted-foreground'>Các tùy chỉnh sẽ được cập nhật tại đây.</p>
        </div>
      </div>
    </PageContainer>
  );
}
