import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Nhiệm Vụ'
};

export default function RewardTasksPage() {
  return (
    <PageContainer
      pageTitle='Nhiệm Vụ'
      pageDescription='Hoàn thành các nhiệm vụ để nhận phần thưởng.'
    >
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Chưa có nhiệm vụ mới</h3>
          <p className='text-sm text-muted-foreground'>
            Hãy quay lại sau để nhận thêm các nhiệm vụ hấp dẫn.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
