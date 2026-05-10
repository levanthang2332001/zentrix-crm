'use client';

import React from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle='Cài đặt'
      pageDescription='Quản lý cấu hình hệ thống và tài khoản của bạn.'
    >
      <div className='flex flex-col gap-6 max-w-4xl mx-auto w-full'>
        <Tabs defaultValue='account' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 border border-border/50'>
            <TabsTrigger value='account' className='gap-2 py-2.5'>
              <Icons.user className='size-4' />
              Tài khoản
            </TabsTrigger>
            <TabsTrigger value='wallet' className='gap-2 py-2.5'>
              <Icons.wallet className='size-4' />
              Địa chỉ ví
            </TabsTrigger>
            <TabsTrigger value='security' className='gap-2 py-2.5'>
              <Icons.lock className='size-4' />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          <TabsContent value='account'>
            <Card className='bg-card border-border shadow-md'>
              <CardHeader>
                <CardTitle className='text-xl'>Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin tài khoản của bạn.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20'>
                  <p className='text-sm text-muted-foreground'>Chức năng đang được phát triển</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='wallet' className='space-y-6'>
            <Card className='bg-card border-border shadow-xl overflow-hidden'>
              <CardHeader>
                <CardTitle className='text-xl font-bold'>Quản lý địa chỉ ví</CardTitle>
                <CardDescription>
                  Tính năng quản lý địa chỉ ví đã được chuyển sang trang Rút tiền để thuận tiện hơn.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col items-center py-12 space-y-6'>
                <div className='size-20 rounded-full bg-primary/10 flex items-center justify-center'>
                  <Icons.wallet className='size-10 text-primary' />
                </div>
                <div className='text-center space-y-2 max-w-md'>
                  <p className='text-muted-foreground'>
                    Bạn có thể xác thực và thay đổi địa chỉ ví trực tiếp tại trang Rút tiền để thực
                    hiện các giao dịch nhanh chóng.
                  </p>
                </div>
                <Button asChild className='font-bold px-8 h-12 shadow-lg shadow-primary/20'>
                  <Link href='/dashboard/rebate/withdraw'>
                    Đi tới trang Rút tiền
                    <Icons.arrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='security'>
            <Card className='bg-card border-border shadow-md'>
              <CardHeader>
                <CardTitle className='text-xl'>Cấu hình bảo mật</CardTitle>
                <CardDescription>Quản lý mật khẩu và xác thực 2 lớp.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20'>
                  <p className='text-sm text-muted-foreground'>Chức năng đang được phát triển</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
