'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth } from '@clerk/nextjs';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useStore } from '@tanstack/react-form';
import { getMyRates, updateChildRebateRate } from '@/features/rate/api/service';
import type { BrokerRate } from '@/features/rate/api/types';
import { toast } from 'sonner';
import * as z from 'zod';

export default function SetChildRatePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, startTransition] = useTransition();

  const [myRates, setMyRates] = useState<BrokerRate[]>([]);
  const [selectedBrokerRate, setSelectedBrokerRate] = useState<number>(50); // Default to Exness max limit

  const userTier = (user?.publicMetadata?.tier as 'F0' | 'F1' | 'F2') || 'F2';
  const isF2 = userTier === 'F2';

  const fetchMyRates = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getMyRates(token, userTier);
      setMyRates(data.rates || []);

      // Update max rate indicator based on initial default broker selection (brk_exness)
      const exness = data.rates.find((r) => r.brokerId === 'brk_exness');
      if (exness) {
        setSelectedBrokerRate(exness.selfRebateRate);
      }
    } catch {
      toast.error('Không thể đồng bộ hạn mức tỷ lệ chiết khấu của bạn!');
    }
  };

  useEffect(() => {
    if (user && !isF2) {
      fetchMyRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isF2]);

  // Form Zod Schema with dynamic max rate validation
  const setRateSchema = z.object({
    childEmail: z.string().email({ message: 'Vui lòng nhập địa chỉ email hợp lệ' }),
    childUserId: z.string().min(5, { message: 'ID downline tối thiểu 5 ký tự' }),
    brokerId: z.enum(['brk_exness', 'brk_xm', 'brk_icm']),
    targetRebateRate: z
      .number({ message: 'Vui lòng nhập tỷ lệ hợp lệ' })
      .min(0, { message: 'Tỷ lệ không được âm' })
  });

  type FormValues = z.infer<typeof setRateSchema>;

  const form = useAppForm({
    defaultValues: {
      childEmail: '',
      childUserId: '',
      brokerId: 'brk_exness',
      targetRebateRate: 10
    } as FormValues,
    validators: {
      onSubmit: setRateSchema
    },
    onSubmit: async ({ value }) => {
      // Dynamic cross-field business logic check: target child rate cannot exceed parent's rate
      const selectedBroker = myRates.find((r) => r.brokerId === value.brokerId);
      const parentMaxRate = selectedBroker ? selectedBroker.selfRebateRate : 0;

      if (value.targetRebateRate > parentMaxRate) {
        toast.error(
          `Lỗi hạn mức: Tỷ lệ gán cho downline (${value.targetRebateRate}%) không được vượt quá tỷ lệ tự doanh của bạn trên sàn này (${parentMaxRate}%)!`
        );
        return;
      }

      startTransition(async () => {
        try {
          const token = await getToken();
          if (!token) return;

          const response = await updateChildRebateRate(token, {
            childEmail: value.childEmail,
            childUserId: value.childUserId,
            brokerId: value.brokerId,
            targetRebateRate: Number(value.targetRebateRate)
          });

          if (response.success) {
            toast.success(response.message);
            form.reset();
          } else {
            toast.error(response.message);
          }
        } catch {
          toast.error('Gặp sự cố khi gửi dữ liệu cấu hình tỷ lệ!');
        }
      });
    }
  });

  // Flat components with type-safe field names
  const { FormTextField, FormSelectField } = useFormFields<FormValues>();

  // Reactive store observer for selected broker
  const currentBrokerId = useStore(form.store, (s) => s.values.brokerId);

  useEffect(() => {
    const selected = myRates.find((r) => r.brokerId === currentBrokerId);
    if (selected) {
      setSelectedBrokerRate(selected.selfRebateRate);
    }
  }, [currentBrokerId, myRates]);

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto animate-in fade-in duration-500'>
        {/* Header */}
        <div className='space-y-1.5'>
          <h2 className='text-3xl font-black tracking-tight text-foreground'>
            Thiết lập tỷ lệ downline ⚙️
          </h2>
          <p className='text-xs text-muted-foreground leading-normal'>
            Phân bổ tỷ lệ rebate cho các đối tác cấp dưới trong hệ thống. Hệ thống tự động xác thực
            và khóa hạn mức tối đa của downline dựa trên cấp bậc của bạn.
          </p>
        </div>

        {isF2 ? (
          /* Restricted access layout for F2 Retail traders */
          <div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch pt-4'>
            <Card className='md:col-span-8 p-8 border-border bg-gradient-to-tr from-card to-muted/20 shadow-2xl flex flex-col justify-between rounded-2xl relative overflow-hidden group'>
              <div className='absolute -bottom-10 -right-10 p-6 opacity-5 pointer-events-none group-hover:scale-105 transition-all duration-500'>
                <Icons.pro className='size-96 text-primary' />
              </div>
              <div className='space-y-6 max-w-2xl'>
                <Badge className='bg-primary/10 border-primary/20 text-primary py-1 px-3 text-xs font-bold gap-2 self-start rounded-full'>
                  <Icons.exclusive className='size-3.5' />
                  Hạn chế truy cập (F2)
                </Badge>
                <div className='space-y-3.5'>
                  <h3 className='text-2xl font-black text-foreground leading-tight'>
                    Tính năng dành riêng cho Đại lý đối tác (F0/F1)
                  </h3>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    Bạn hiện đang ở cấp độ **Retail Trader (F2)**. Ở cấp độ này, bạn chỉ có cấu hình
                    nhận hoàn tiền cá nhân và không thể có bất kỳ thành viên downline nào để cài đặt
                    tỷ lệ.
                  </p>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    Vui lòng nâng cấp lên **Sub-IB (F1)** để kích hoạt đầy đủ quyền quản trị đối
                    tác, tuyển dụng mạng lưới và cấu hình dòng tiền rebate đa cấp.
                  </p>
                </div>
              </div>

              <div className='mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row gap-4'>
                <Button className='bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-6 h-12 rounded-xl shadow-lg shadow-primary/20 transition-all'>
                  Yêu cầu nâng cấp Sub-IB ngay
                </Button>
                <Link href='/dashboard/rate'>
                  <Button
                    variant='outline'
                    className='h-12 border-border font-bold text-sm px-5 hover:bg-accent rounded-xl'
                  >
                    Xem tỷ lệ của tôi
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className='md:col-span-4 p-6 border-border bg-card shadow-xl rounded-2xl flex flex-col justify-between'>
              <div className='space-y-4'>
                <h4 className='font-extrabold text-sm text-foreground flex items-center gap-2'>
                  <Icons.info className='size-4 text-primary' />
                  Quy tắc chặn hoa hồng âm
                </h4>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Zentrix CRM tự động chặn bất kỳ giao dịch gán hoa hồng nào mà tỷ lệ của downline
                  cao hơn tỷ lệ của đại lý quản lý. Điều này đảm bảo hệ thống tài chính luôn cân
                  bằng và minh bạch.
                </p>
              </div>
              <div className='pt-6'>
                <div className='flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10'>
                  <Icons.lock className='size-5 text-primary shrink-0' />
                  <div className='space-y-0.5 min-w-0'>
                    <span className='text-[9px] uppercase font-bold text-muted-foreground tracking-wider'>
                      Trạng thái bảng tính
                    </span>
                    <p className='text-xs font-bold text-foreground'>Không Quyền Hạn (F2)</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* High fidelity configuration Form using useAppForm */
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch'>
            {/* Setting form */}
            <Card className='lg:col-span-7 bg-card border-border shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between'>
              <CardHeader className='bg-muted/10 border-b border-border py-5 px-6'>
                <CardTitle className='text-lg font-bold flex items-center gap-2'>
                  <Icons.settings className='size-5 text-primary' />
                  Cấu hình tỷ lệ downline
                </CardTitle>
                <CardDescription>
                  Nhập mã downline, email downline và chọn mức chiết khấu mong muốn.
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                <form.AppForm>
                  <form.Form className='space-y-5 p-6'>
                    {/* Downline User ID */}
                    <FormTextField
                      name='childUserId'
                      label='Mã Downline ID'
                      placeholder='Ví dụ: usr_f1_01'
                      required
                      disabled={loading}
                      className='h-11 bg-muted/30 border-border text-xs rounded-xl focus:border-primary'
                      validators={{
                        onBlur: z.string().min(5, { message: 'ID downline tối thiểu 5 ký tự' })
                      }}
                    />

                    {/* Downline Email */}
                    <FormTextField
                      name='childEmail'
                      label='Email liên hệ'
                      placeholder='Ví dụ: alex.sub-ib@zentrix.com'
                      required
                      disabled={loading}
                      className='h-11 bg-muted/30 border-border text-xs rounded-xl focus:border-primary'
                      validators={{
                        onBlur: z.string().email({ message: 'Vui lòng nhập địa chỉ email hợp lệ' })
                      }}
                    />

                    {/* Selected Broker */}
                    <FormSelectField
                      name='brokerId'
                      label='Sàn Broker giao dịch'
                      required
                      placeholder='Chọn sàn Broker'
                      options={[
                        { value: 'brk_exness', label: 'Exness Group' },
                        { value: 'brk_xm', label: 'XM Global Ltd' },
                        { value: 'brk_icm', label: 'IC Markets' }
                      ]}
                    />

                    {/* Target Rate */}
                    <FormTextField
                      name='targetRebateRate'
                      label='Tỷ lệ gán cho Downline (%)'
                      type='number'
                      placeholder='Ví dụ: 15'
                      required
                      disabled={loading}
                      className='h-11 bg-muted/30 border-border text-xs rounded-xl focus:border-primary font-mono font-bold'
                      description={`Hạn mức tối đa của bạn trên sàn này: ${selectedBrokerRate}%`}
                      validators={{
                        onBlur: z
                          .number({ message: 'Vui lòng nhập tỷ lệ hợp lệ' })
                          .min(0, { message: 'Tỷ lệ không được âm' })
                          .max(selectedBrokerRate, {
                            message: `Tỷ lệ vượt quá hạn mức tối đa của bạn trên sàn này (${selectedBrokerRate}%)!`
                          })
                      }}
                    />

                    <div className='pt-2'>
                      <Button
                        disabled={loading}
                        className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm h-12 rounded-xl shadow-lg shadow-primary/10 gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all'
                        type='submit'
                      >
                        {loading && <Icons.spinner className='size-4 animate-spin' />}
                        Áp dụng thay đổi tỷ lệ
                      </Button>
                    </div>
                  </form.Form>
                </form.AppForm>
              </CardContent>
            </Card>

            {/* Sidebar info */}
            <div className='lg:col-span-5 flex flex-col gap-6'>
              <Card className='border border-border bg-card shadow-lg rounded-2xl p-6 flex flex-col justify-between flex-1'>
                <div className='space-y-4'>
                  <h4 className='font-extrabold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-3'>
                    <Icons.info className='size-4 text-primary' />
                    Hạn Mức Theo Broker Của Bạn
                  </h4>
                  <p className='text-xs text-muted-foreground leading-relaxed'>
                    Bạn chỉ có thể gán tỷ lệ rebate cho thành viên downline của mình trong phạm vi
                    tỷ lệ hoàn phí tối đa mà tài khoản của bạn đang được hưởng.
                  </p>

                  <div className='space-y-3 pt-2'>
                    {myRates.map((r) => (
                      <div
                        key={r.brokerId}
                        className='flex justify-between items-center p-3 rounded-xl border border-border/80 bg-muted/20'
                      >
                        <div className='space-y-0.5'>
                          <p className='text-xs font-bold text-foreground'>{r.brokerName}</p>
                          <span className='text-[9px] text-muted-foreground uppercase font-semibold'>
                            Tỷ lệ tự doanh
                          </span>
                        </div>
                        <span className='font-mono text-sm font-black text-primary'>
                          {r.selfRebateRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] leading-relaxed text-amber-500 font-medium mt-6'>
                  <strong className='block mb-1'>⚠️ LƯU Ý HỆ THỐNG:</strong>
                  Khi tỷ lệ rebate của downline được tăng, số dư rebate của bạn từ giao dịch của họ
                  sẽ bị thu hẹp tương ứng. Việc cấu hình này có hiệu lực ngay lập tức đối với tất cả
                  các lệnh giao dịch mới phát sinh.
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
