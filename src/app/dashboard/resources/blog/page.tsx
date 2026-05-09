import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard: Blog'
};

export default function BlogPage() {
  return (
    <PageContainer pageTitle='Blog' pageDescription='Cập nhật các tin tức và bài viết mới nhất.'>
      <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm'>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h3 className='text-2xl font-bold tracking-tight'>Chưa có bài viết nào</h3>
          <p className='text-sm text-muted-foreground'>
            Chúng tôi sẽ sớm cập nhật các bài viết mới tại đây.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
