import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Simulate database latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      message: `Cập nhật tỷ lệ chiết khấu sàn ${
        payload.brokerId === 'brk_exness'
          ? 'Exness'
          : payload.brokerId === 'brk_xm'
            ? 'XM'
            : 'IC Markets'
      } thành công cho downline ${payload.childEmail} thành ${payload.targetRebateRate}%!`,
      updatedRate: {
        childUserId: payload.childUserId,
        brokerId: payload.brokerId,
        targetRebateRate: payload.targetRebateRate
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Có lỗi xảy ra khi xử lý dữ liệu!'
      },
      { status: 400 }
    );
  }
}
