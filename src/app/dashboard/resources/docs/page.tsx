import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Tài liệu'
};

export default function DocsPage() {
  return (
    <PageContainer pageTitle='Tài liệu' pageDescription='Hướng dẫn sử dụng và tài liệu kỹ thuật.'>
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Tài liệu hướng dẫn</h3>
          <p className='text-sm text-muted-foreground'>
            Tài liệu chi tiết sẽ được cung cấp tại đây.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
