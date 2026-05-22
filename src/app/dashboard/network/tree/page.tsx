'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useUser, useAuth } from '@clerk/nextjs';
import { getNetworkTree } from '@/features/network/api/service';
import type { NetworkTreeMember } from '@/features/network/api/types';
import { toast } from 'sonner';

// Helper component to render a single tree node (collapsible & recursive)
interface TreeNodeProps {
  member: NetworkTreeMember;
  level: number;
}

function TreeNode({ member, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = member.children && member.children.length > 0;

  // Tier color mapping
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'F0':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          bg: 'from-amber-500/10 to-amber-500/5',
          text: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
          badge: 'bg-amber-500 text-amber-950 hover:bg-amber-600'
        };
      case 'F1':
        return {
          border: 'border-violet-500/30 hover:border-violet-500/60',
          bg: 'from-violet-500/10 to-violet-500/5',
          text: 'text-violet-400 border-violet-500/20 bg-violet-500/10',
          badge: 'bg-violet-500 text-violet-50 hover:bg-violet-600'
        };
      case 'F2':
      default:
        return {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          bg: 'from-emerald-500/10 to-emerald-500/5',
          text: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
          badge: 'bg-emerald-500 text-emerald-50 hover:bg-emerald-600'
        };
    }
  };

  const style = getTierColor(member.tier);

  return (
    <div className='flex flex-col relative select-none'>
      {/* Node Row */}
      <div className='flex items-center gap-4 relative group'>
        {/* Node connector line to parent (horizontal) */}
        {level > 0 && (
          <div className='absolute -left-6 top-1/2 w-6 h-[2px] bg-border group-hover:bg-primary/40 transition-colors' />
        )}

        {/* Node Card */}
        <div
          className={`flex-1 min-w-[320px] max-w-[480px] p-4 rounded-xl border bg-gradient-to-tr ${style.border} ${style.bg} shadow-md transition-all duration-300 hover:scale-[1.01] hover:shadow-lg`}
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-xs font-bold text-foreground'>{member.userId}</span>
                <Badge className={`text-[9px] font-black px-1.5 py-0.5 rounded ${style.badge}`}>
                  {member.tier}
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground font-semibold truncate max-w-[200px]'>
                {member.email}
              </p>
              {member.walletAddress && (
                <div className='flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border/40 w-fit'>
                  <Icons.wallet className='size-3 text-primary shrink-0' />
                  <span>{member.walletAddress}</span>
                </div>
              )}
            </div>

            <div className='text-right space-y-1'>
              <div className='text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider'>
                Volume
              </div>
              <p className='text-sm font-black font-mono text-foreground'>${member.totalVolume}</p>
              <div className='flex items-center gap-1 justify-end text-[10px] font-extrabold text-primary'>
                <span>Earned:</span>
                <span className='font-mono'>${member.rebatesEarned}</span>
              </div>
            </div>
          </div>

          {/* Connect & Expand triggers */}
          {hasChildren && (
            <div className='mt-3 pt-3 border-t border-border/40 flex items-center justify-between'>
              <span className='text-[10px] text-muted-foreground font-bold'>
                Downline:{' '}
                <strong className='text-primary font-extrabold'>
                  {member.children?.length} thành viên
                </strong>
              </span>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setIsExpanded(!isExpanded)}
                className='h-7 px-2 font-bold text-xs gap-1 hover:bg-muted'
              >
                {isExpanded ? (
                  <>
                    <Icons.chevronUp className='size-3.5' />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <Icons.chevronDown className='size-3.5' />
                    Mở rộng
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Children Nodes (Recursive call) */}
      {hasChildren && isExpanded && (
        <div className='pl-10 relative flex flex-col gap-4 mt-4 border-l border-border/80 ml-6'>
          {/* Vertical line connection */}
          <div className='absolute left-0 top-0 bottom-8 w-[1px] bg-border' />
          {member.children?.map((child) => (
            <TreeNode key={child.userId} member={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NetworkTreePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [treeData, setTreeData] = useState<NetworkTreeMember | null>(null);

  const userTier = (user?.publicMetadata?.tier as string) || 'F2';
  const isF2 = userTier === 'F2';

  const fetchTree = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getNetworkTree(token);
      setTreeData(data);
    } catch {
      toast.error('Không thể tải sơ đồ cây downline!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isF2) {
      fetchTree();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isF2]);

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div className='space-y-1.5'>
            <h2 className='text-3xl font-black tracking-tight text-foreground flex items-center gap-2'>
              Sơ đồ cây hệ thống 🌳
            </h2>
            <p className='text-xs text-muted-foreground leading-normal'>
              Xem cấu trúc downline đa tầng và theo dõi tổng thể doanh số volume từ Master IB (F0)
              xuống các Sub-IB (F1) và Retail (F2).
            </p>
          </div>
          {!isF2 && (
            <Button
              onClick={fetchTree}
              disabled={isLoading}
              variant='outline'
              className='h-10 border-border rounded-xl font-bold text-xs gap-1.5 px-4 shadow-sm'
            >
              <Icons.refresh className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới sơ đồ
            </Button>
          )}
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
                  Quyền truy cập hạn chế (F2)
                </Badge>
                <div className='space-y-3.5'>
                  <h3 className='text-2xl font-black text-foreground leading-tight'>
                    Tính năng dành riêng cho Đại lý đối tác
                  </h3>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    Sơ đồ cây hệ thống downline chỉ khả dụng cho các thành viên từ cấp bậc **Sub-IB
                    (F1)** hoặc **Master IB (F0)** nhằm kiểm soát và cấu hình tỷ lệ hoa hồng tối ưu.
                  </p>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    Hãy liên hệ với Master IB trực tiếp của bạn hoặc nâng cấp tài khoản của mình để
                    có quyền truy cập sơ đồ downline và thiết lập hệ thống chiết khấu riêng.
                  </p>
                </div>
              </div>

              <div className='mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row gap-4'>
                <Button className='bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-6 h-12 rounded-xl shadow-lg shadow-primary/20 transition-all'>
                  Yêu cầu nâng cấp Sub-IB
                </Button>
                <Button
                  variant='outline'
                  className='h-12 border-border font-bold text-sm px-5 hover:bg-accent rounded-xl'
                >
                  Quay lại mạng lưới
                </Button>
              </div>
            </Card>

            <Card className='md:col-span-4 p-6 border-border bg-card shadow-xl rounded-2xl flex flex-col justify-between'>
              <div className='space-y-4'>
                <h4 className='font-extrabold text-sm text-foreground flex items-center gap-2'>
                  <Icons.info className='size-4 text-primary' />
                  Lợi ích hệ thống đại lý
                </h4>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Zentrix CRM tích hợp cơ chế chia tách hoa hồng BNB Smart Chain tự động giúp giảm
                  rủi ro chậm thanh toán và nâng cao tính minh bạch tuyệt đối cho đối tác liên kết.
                </p>
              </div>
              <div className='pt-6'>
                <div className='flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10'>
                  <Icons.lock className='size-5 text-primary shrink-0' />
                  <div className='space-y-0.5 min-w-0'>
                    <span className='text-[9px] uppercase font-bold text-muted-foreground tracking-wider'>
                      Trạng thái sơ đồ
                    </span>
                    <p className='text-xs font-bold text-foreground'>Không Quyền Hạn (F2)</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* High fidelity collapsible tree viewer */
          <Card className='bg-card border-border shadow-xl rounded-2xl p-6 overflow-hidden min-h-[500px] flex flex-col'>
            <CardHeader className='p-0 pb-6 border-b border-border/80 mb-6'>
              <CardTitle className='text-lg font-bold flex items-center gap-2'>
                <Icons.galleryVerticalEnd className='size-5 text-primary' />
                Cây Đại Lý & Khối Lượng Giao Dịch
              </CardTitle>
              <CardDescription>
                Nhấp vào nút để mở rộng / thu gọn các nhánh. Di chuột lên các node để xem chi tiết
                downline.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex-1 overflow-auto p-4 bg-muted/5 rounded-xl border border-border/50'>
              {isLoading ? (
                <div className='flex flex-col items-center justify-center py-24 text-muted-foreground text-xs'>
                  <Icons.spinner className='size-8 animate-spin text-primary mb-3' />
                  Đang phân tích cấu trúc cây downlines...
                </div>
              ) : treeData ? (
                <div className='p-2 select-none overflow-x-auto'>
                  <TreeNode member={treeData} level={0} />
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-24 text-muted-foreground text-xs'>
                  <Icons.info className='size-8 text-muted-foreground/40 mb-2' />
                  Không thể tìm thấy cấu trúc cây phù hợp cho tài khoản của bạn.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
