'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth } from '@clerk/nextjs';
import { getClaimsHistory } from '@/features/history/api/service';
import type { ClaimHistoryEntry } from '@/features/history/api/types';
import { toast } from 'sonner';

export default function ClaimsHistoryPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claims, setClaims] = useState<ClaimHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Web3 States
  const [walletState, setWalletState] = useState<'disconnected' | 'connecting' | 'connected'>(
    'disconnected'
  );
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [pendingBalance, setPendingBalance] = useState<number>(350.0);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const handleConnectWallet = async (walletType: string) => {
    setWalletState('connecting');
    toast.loading(`Đang kết nối tới ví ${walletType}...`, { id: 'web3-conn' });

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mockAddr = '0x71C244248888888888888888888888888888a8E9';
    setWalletAddress(mockAddr);
    setWalletState('connected');
    toast.success(
      `Kết nối ví MetaMask (${mockAddr.slice(0, 6)}...${mockAddr.slice(-4)}) thành công!`,
      { id: 'web3-conn' }
    );
  };

  const handleDisconnectWallet = () => {
    setWalletState('disconnected');
    setWalletAddress('');
    toast.info('Đã ngắt kết nối ví Web3.');
  };

  const handleClaimRebate = async () => {
    if (pendingBalance <= 0) {
      toast.error('Không có số dư hoa hồng khả dụng để rút!');
      return;
    }
    setIsClaiming(true);

    toast.info('Vui lòng xác nhận giao dịch rút tiền trên ví của bạn...', { id: 'claim-tx' });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.loading(`Đang tương tác với Smart Contract rút $${pendingBalance.toFixed(2)} USDT...`, {
      id: 'claim-tx'
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const randomHex = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const mockTxHash = `0x${randomHex.slice(0, 60)}1d23`;

    const newClaim: ClaimHistoryEntry = {
      claimId: `CLM${Math.floor(100000 + Math.random() * 900000)}`,
      walletAddress: walletAddress,
      amount: pendingBalance.toFixed(2),
      txHash: mockTxHash,
      status: 'claimed',
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      broker: selectedBroker === 'ALL' ? 'Exness' : selectedBroker
    };

    setClaims((prev) => [newClaim, ...prev]);
    setPendingBalance(0);
    setIsClaiming(false);
    toast.success(
      `Rút hoa hồng thành công! +$${newClaim.amount} USDT đã được chuyển về ví của bạn.`,
      { id: 'claim-tx' }
    );
  };

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getClaimsHistory(token, {
        broker: selectedBroker === 'ALL' ? undefined : selectedBroker,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus
      });
      setClaims(data.claims || []);
    } catch {
      toast.error('Không thể tải lịch sử claims từ hệ thống!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClaims();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedBroker, selectedStatus]);

  const handleCopyText = (text: string, message: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      toast.success(message);
    }
  };

  // Filter local results further by search query
  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      c.claimId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.txHash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: ClaimHistoryEntry['status']) => {
    switch (status) {
      case 'claimed':
        return (
          <Badge className='bg-emerald-500/10 border-emerald-500/20 text-emerald-500 py-0.5 px-2 font-bold text-[10px] rounded gap-1'>
            <span className='size-1 rounded-full bg-emerald-500 animate-pulse' />
            Đã thanh toán
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-amber-500/10 border-amber-500/20 text-amber-500 py-0.5 px-2 font-bold text-[10px] rounded gap-1'>
            <span className='size-1 rounded-full bg-amber-500 animate-pulse' />
            Đang xử lý
          </Badge>
        );
      case 'failed':
        return (
          <Badge className='bg-destructive/10 border-destructive/20 text-destructive py-0.5 px-2 font-bold text-[10px] rounded gap-1'>
            Thất bại
          </Badge>
        );
      case 'expired':
      default:
        return (
          <Badge
            variant='outline'
            className='text-muted-foreground border-border py-0.5 px-2 font-bold text-[10px] rounded bg-muted/20'
          >
            Hết hạn
          </Badge>
        );
    }
  };

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6 pb-10 w-full max-w-7xl mx-auto'>
        {/* Header */}
        <div className='space-y-1.5'>
          <h2 className='text-3xl font-black tracking-tight text-foreground'>
            Lịch sử Claims Web3 🪙
          </h2>
          <p className='text-xs text-muted-foreground leading-normal'>
            Theo dõi tất cả lịch sử rút tiền về ví non-custodial, trạng thái giao dịch on-chain trên
            BSC và tổng hợp số lượng giao dịch rebate đã hoàn tất.
          </p>
        </div>

        {/* Web3 Wallet panel */}
        <Card className='border border-border bg-card shadow-2xl rounded-2xl overflow-hidden relative group animate-in slide-in-from-bottom-5 duration-700'>
          <div className='absolute -bottom-10 -right-10 p-6 opacity-[0.03] pointer-events-none group-hover:scale-105 transition-all duration-500'>
            <Icons.wallet className='size-80 text-primary' />
          </div>

          <CardHeader className='bg-muted/10 border-b border-border py-5 px-6'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.wallet className='size-5 text-primary' />
              Hệ Thống Rút Tiền Web3 Non-Custodial (BSC Smart Contract) 🪙
            </CardTitle>
            <CardDescription>
              Kết nối ví điện tử cá nhân để thực hiện nhận hoa hồng (USDT) tự động, an toàn và minh
              bạch tuyệt đối trên chuỗi khối BNB Smart Chain.
            </CardDescription>
          </CardHeader>

          <CardContent className='p-6'>
            {walletState === 'disconnected' && (
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
                <div className='space-y-2 max-w-xl'>
                  <h4 className='text-sm font-extrabold text-foreground flex items-center gap-1.5'>
                    <span className='size-2 rounded-full bg-red-500 animate-ping' />
                    Ví của bạn chưa được kết nối!
                  </h4>
                  <p className='text-xs text-muted-foreground leading-relaxed'>
                    Bạn cần liên kết ví cá nhân để hệ thống tự động giải ngân rebate trực tiếp.
                    Zentrix hỗ trợ mọi loại ví chuẩn EVM chạy trên mạng lưới Binance Smart Chain.
                  </p>
                </div>
                <div className='flex flex-wrap gap-3 shrink-0'>
                  <Button
                    onClick={() => handleConnectWallet('MetaMask')}
                    className='bg-neutral-850 hover:bg-neutral-800 border border-border text-foreground font-bold text-xs h-11 px-4 rounded-xl gap-2 shadow-inner hover:scale-[1.01] active:scale-[0.99] transition-all'
                  >
                    <img
                      src='https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595368449'
                      className='size-4 shrink-0 filter invert'
                      alt='meta'
                    />
                    Kết nối MetaMask
                  </Button>
                  <Button
                    onClick={() => handleConnectWallet('Trust Wallet')}
                    className='bg-neutral-850 hover:bg-neutral-800 border border-border text-foreground font-bold text-xs h-11 px-4 rounded-xl gap-2 shadow-inner hover:scale-[1.01] active:scale-[0.99] transition-all'
                  >
                    <img
                      src='https://assets.coingecko.com/coins/images/12185/small/trust_wallet.png?1597818449'
                      className='size-4 shrink-0'
                      alt='trust'
                    />
                    Kết nối Trust Wallet
                  </Button>
                </div>
              </div>
            )}

            {walletState === 'connecting' && (
              <div className='py-8 text-center text-xs text-muted-foreground space-y-3 flex flex-col items-center justify-center'>
                <Icons.spinner className='size-8 animate-spin text-primary' />
                <p className='font-bold animate-pulse'>
                  Đang xác minh chữ ký & mã hóa địa chỉ ví Web3...
                </p>
              </div>
            )}

            {walletState === 'connected' && (
              <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch'>
                {/* Left Side: Wallet details */}
                <div className='md:col-span-6 space-y-5 flex flex-col justify-between'>
                  <div className='space-y-3.5'>
                    <div className='flex items-center gap-2'>
                      <Badge className='bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px] rounded-full py-0.5 px-2.5 gap-1.5'>
                        <span className='size-1.5 rounded-full bg-emerald-500' />
                        Đã liên kết thành công
                      </Badge>
                      <Badge
                        variant='outline'
                        className='text-[10px] font-bold border-border py-0.5 px-2.5 text-muted-foreground bg-muted/20'
                      >
                        BSC Mainnet
                      </Badge>
                    </div>

                    <div className='space-y-1.5'>
                      <span className='text-[9px] uppercase font-bold text-muted-foreground tracking-wider block'>
                        Địa Chỉ Ví Nhận Tiền
                      </span>
                      <div className='flex items-center gap-2 font-mono text-sm font-black text-foreground bg-muted/30 border border-border/80 rounded-xl p-3.5 shadow-inner'>
                        <span className='truncate'>{walletAddress}</span>
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => handleCopyText(walletAddress, 'Đã sao chép địa chỉ ví!')}
                          className='size-7 text-muted-foreground hover:text-primary rounded shrink-0'
                        >
                          <Icons.copy className='size-3.5' />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between text-[11px] font-bold pt-4 border-t border-border/40'>
                    <span className='text-muted-foreground'>Giao thức bảo mật:</span>
                    <button
                      onClick={handleDisconnectWallet}
                      className='text-red-500 hover:text-red-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors'
                    >
                      <Icons.close className='size-3' />
                      Ngắt kết nối ví
                    </button>
                  </div>
                </div>

                {/* Right Side: Claim Balance and button */}
                <div className='md:col-span-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border/60 pt-6 md:pt-0 md:pl-8 space-y-6'>
                  <div className='bg-muted/20 border border-border/80 rounded-2xl p-5 space-y-2 shadow-sm'>
                    <span className='text-[10px] uppercase font-black text-muted-foreground tracking-wider block'>
                      Hoa Hồng Chờ Rút Khả Dụng (Pending Claim)
                    </span>
                    <div className='flex justify-between items-baseline'>
                      <h3 className='text-3.5xl font-black font-mono text-primary'>
                        ${pendingBalance.toFixed(2)} USDT
                      </h3>
                      <span className='text-xs font-semibold text-emerald-500 bg-emerald-500/10 py-0.5 px-2 rounded'>
                        Mạng lưới BSC
                      </span>
                    </div>
                  </div>

                  <Button
                    disabled={pendingBalance <= 0 || isClaiming}
                    onClick={handleClaimRebate}
                    className={`w-full font-black text-sm h-12 rounded-xl gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer ${
                      pendingBalance > 0
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
                        : 'bg-muted border border-border text-muted-foreground shadow-none'
                    }`}
                  >
                    {isClaiming ? (
                      <>
                        <Icons.spinner className='size-4.5 animate-spin' />
                        Đang ký giao dịch on-chain...
                      </>
                    ) : (
                      <>
                        <Icons.download className='size-4.5 animate-bounce' />
                        Yêu cầu Rút về Ví (Claim Rebate)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters Panel */}
        <Card className='border-border bg-card shadow-lg rounded-2xl p-4'>
          <div className='flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4'>
            <div className='flex flex-wrap items-center gap-3'>
              {/* Broker Filter */}
              <div className='space-y-1'>
                <span className='text-[10px] uppercase font-black text-muted-foreground tracking-wider block'>
                  Sàn Broker
                </span>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className='bg-muted/50 border border-border text-xs rounded-xl h-10 px-3 font-semibold text-foreground focus:outline-none focus:border-primary min-w-[140px]'
                >
                  <option value='ALL'>Tất cả sàn</option>
                  <option value='Exness'>Exness</option>
                  <option value='XM Global'>XM Global</option>
                  <option value='IC Markets'>IC Markets</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className='space-y-1'>
                <span className='text-[10px] uppercase font-black text-muted-foreground tracking-wider block'>
                  Trạng thái
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className='bg-muted/50 border border-border text-xs rounded-xl h-10 px-3 font-semibold text-foreground focus:outline-none focus:border-primary min-w-[140px]'
                >
                  <option value='ALL'>Tất cả trạng thái</option>
                  <option value='claimed'>Đã thanh toán</option>
                  <option value='pending'>Đang xử lý</option>
                  <option value='failed'>Thất bại</option>
                  <option value='expired'>Hết hạn</option>
                </select>
              </div>
            </div>

            {/* Search Input & Reset */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:max-w-md w-full'>
              <div className='relative flex-1 group'>
                <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                <Input
                  placeholder='Tìm Claim ID, ví hoặc Tx Hash...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9 h-10 bg-muted/30 border-border text-xs rounded-xl focus:ring-0 focus:border-primary w-full'
                />
              </div>
              <Button
                variant='outline'
                onClick={fetchClaims}
                disabled={isLoading}
                className='rounded-xl border-border h-10 px-4 font-bold text-xs gap-1.5 shrink-0'
              >
                <Icons.refresh className='size-4' />
                Tải lại
              </Button>
            </div>
          </div>
        </Card>

        {/* Claims Table Card */}
        <Card className='bg-card border border-border shadow-xl overflow-hidden rounded-2xl'>
          <CardHeader className='pb-4 border-b border-border bg-muted/10'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <Icons.history className='size-5 text-primary' />
              Bản ghi giao dịch on-chain
            </CardTitle>
            <CardDescription>
              Danh sách chi tiết các lần rút tiền mặt về ví BSC thông qua smart contract.
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto w-full'>
              <table className='w-full border-collapse text-left min-w-[900px]'>
                <thead>
                  <tr className='border-b border-border bg-muted/10 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider h-11'>
                    <th className='pl-6 px-4'>Mã Claim ID</th>
                    <th className='px-4'>Ví Whitelisted</th>
                    <th className='px-4 text-right'>Số lượng rút</th>
                    <th className='px-4'>On-chain Tx Hash</th>
                    <th className='px-4 text-center'>Trạng thái</th>
                    <th className='px-4 text-center'>Ngày yêu cầu</th>
                    <th className='pr-6 px-4 text-center'>Ngày hoàn tất</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className='py-16 text-center text-xs text-muted-foreground'>
                        <Icons.spinner className='size-6 animate-spin text-primary mx-auto mb-2' />
                        Đang đồng bộ dữ liệu giao dịch từ blockchain...
                      </td>
                    </tr>
                  ) : filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='py-16 text-center text-xs text-muted-foreground'>
                        <Icons.circleCheck className='size-8 text-muted-foreground/30 mx-auto mb-2' />
                        Không tìm thấy giao dịch claims nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <tr
                        key={claim.claimId}
                        className='border-b border-border hover:bg-muted/10 h-16 transition-colors'
                      >
                        {/* Claim ID */}
                        <td className='pl-6 px-4 font-mono text-xs font-bold text-foreground'>
                          {claim.claimId}
                        </td>
                        {/* Wallet Address */}
                        <td className='px-4 font-mono text-xs text-foreground/80'>
                          <div className='flex items-center gap-1.5'>
                            <span>{claim.walletAddress}</span>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() =>
                                handleCopyText(claim.walletAddress, 'Đã sao chép địa chỉ ví!')
                              }
                              className='size-6 text-muted-foreground hover:text-primary rounded'
                            >
                              <Icons.copy className='size-3' />
                            </Button>
                          </div>
                        </td>
                        {/* Amount */}
                        <td className='px-4 text-right font-black text-xs text-foreground font-mono'>
                          ${claim.amount}
                        </td>
                        {/* Tx Hash */}
                        <td className='px-4 font-mono text-xs text-muted-foreground'>
                          <div className='flex items-center gap-1.5 max-w-[200px]'>
                            <span className='truncate'>{claim.txHash}</span>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() => handleCopyText(claim.txHash, 'Đã sao chép Tx Hash!')}
                              className='size-6 text-muted-foreground hover:text-primary rounded shrink-0'
                            >
                              <Icons.copy className='size-3' />
                            </Button>
                            <a
                              href={`https://bscscan.com/tx/${claim.txHash}`}
                              target='_blank'
                              rel='noreferrer'
                              className='size-6 flex items-center justify-center text-muted-foreground hover:text-primary rounded shrink-0'
                            >
                              <Icons.externalLink className='size-3' />
                            </a>
                          </div>
                        </td>
                        {/* Status */}
                        <td className='px-4 text-center'>{getStatusBadge(claim.status)}</td>
                        {/* Requested At */}
                        <td className='px-4 text-center text-xs text-muted-foreground font-medium'>
                          {new Date(claim.requestedAt).toLocaleString('vi-VN')}
                        </td>
                        {/* Completed At */}
                        <td className='pr-6 px-4 text-center text-xs text-muted-foreground font-medium'>
                          {claim.completedAt
                            ? new Date(claim.completedAt).toLocaleString('vi-VN')
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
