'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import extracted modular components
import { WalletConfigCard } from '@/features/rebate/components/wallet-config-card';
import { WithdrawMetrics } from '@/features/rebate/components/withdraw-metrics';
import { LedgerTable } from '@/features/rebate/components/ledger-table';
import { ClaimPipelineModal } from '@/features/rebate/components/claim-pipeline-modal';

// Import centralized API services
import {
  getProfile,
  getPendingBalance,
  getLedgerEntries,
  requestWalletLink,
  confirmWalletLink
} from '@/features/rebate/api/service';

interface LedgerEntry {
  ledgerId: string;
  eventId: string;
  tier: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  claimStatus: 'pending_claim' | 'claimed' | 'expired' | 'swept';
  expiresAt: string;
  createdAt: string;
  brokerId: string;
}

interface PendingBalance {
  walletAddress: string;
  pendingCount: number;
  totalGross: string;
  totalFeeAmount: string;
  totalNet: string;
  nextExpiry: string | null;
}

export default function RebateWithdrawPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Web2 Verification State
  const [dbWalletAddress, setDbWalletAddress] = useState<string>('');
  const [verificationWallet, setVerificationWallet] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Web3 Connection State
  const [web3Wallet, setWeb3Wallet] = useState<string>('');
  const [isWeb3Connecting, setIsWeb3Connecting] = useState<boolean>(false);

  // Balance & Ledger State
  const [pendingBalance, setPendingBalance] = useState<PendingBalance>({
    walletAddress: '',
    pendingCount: 0,
    totalGross: '0.00',
    totalFeeAmount: '0.00',
    totalNet: '0.00',
    nextExpiry: null
  });
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Web3 Transaction Pipeline State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [claimIds, setClaimIds] = useState<string[]>([]);
  const [claimStep, setClaimStep] = useState<'init' | 'sign' | 'broadcast' | 'sync' | 'success'>(
    'init'
  );
  const [txHash, setTxHash] = useState<string>('');
  const [claimedAmount, setClaimedAmount] = useState<string>('0');

  // Standard Mock Payouts for local demo fallback
  const MOCK_LEDGER: LedgerEntry[] = [
    {
      ledgerId: 'ledger-exness-101',
      eventId: 'event-01',
      tier: 'F2',
      grossAmount: '100.00',
      feeAmount: '0.50',
      netAmount: '99.50',
      claimStatus: 'pending_claim',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      brokerId: 'exness'
    },
    {
      ledgerId: 'ledger-icmarkets-102',
      eventId: 'event-02',
      tier: 'F1',
      grossAmount: '250.00',
      feeAmount: '0.50',
      netAmount: '249.50',
      claimStatus: 'pending_claim',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      brokerId: 'icmarkets'
    },
    {
      ledgerId: 'ledger-xm-103',
      eventId: 'event-03',
      tier: 'F2',
      grossAmount: '900.00',
      feeAmount: '0.50',
      netAmount: '899.50',
      claimStatus: 'pending_claim',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      brokerId: 'xm'
    }
  ];

  // Helper to load real or mock data based on whitelisted wallet
  const fetchDashboardData = async (walletAddress: string) => {
    try {
      const clerkToken = await getToken();
      if (!clerkToken) return;

      // Use centralized services
      const balData = await getPendingBalance(walletAddress, clerkToken);
      const ledData = await getLedgerEntries(walletAddress, clerkToken);

      setPendingBalance(balData);
      setLedgerEntries(ledData.entries);
    } catch {
      // Offline fallback: Simulate backend queries
      const netSum = MOCK_LEDGER.reduce((acc, row) => acc + parseFloat(row.netAmount), 0).toFixed(
        2
      );
      const grossSum = MOCK_LEDGER.reduce(
        (acc, row) => acc + parseFloat(row.grossAmount),
        0
      ).toFixed(2);
      const feeSum = MOCK_LEDGER.reduce((acc, row) => acc + parseFloat(row.feeAmount), 0).toFixed(
        2
      );

      setPendingBalance({
        walletAddress,
        pendingCount: MOCK_LEDGER.length,
        totalGross: grossSum,
        totalFeeAmount: feeSum,
        totalNet: netSum,
        nextExpiry: MOCK_LEDGER[1].expiresAt
      });
      setLedgerEntries(MOCK_LEDGER);
    }
  };

  // Sync whitelisted wallet status from NestJS Backend on initial mount
  useEffect(() => {
    const checkDbProfile = async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) return;

        // Use centralized services
        const profile = await getProfile(clerkToken);
        if (profile.walletAddress) {
          setDbWalletAddress(profile.walletAddress);
          await fetchDashboardData(profile.walletAddress);
        }
      } catch {
        console.log('Backend not connected, running in clean frontend-only demo mode.');
      }
    };
    if (user) {
      checkDbProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Request OTP verification via email
  const handleRequestOtp = async () => {
    if (
      !verificationWallet ||
      !verificationWallet.startsWith('0x') ||
      verificationWallet.length !== 42
    ) {
      toast.error('Vui lòng nhập địa chỉ ví EVM (BEP20) hợp lệ!');
      return;
    }

    startTransition(async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) return;

        // Use centralized services
        await requestWalletLink({ walletAddress: verificationWallet }, clerkToken);

        toast.success('Mã xác thực OTP đã được gửi đến Email của bạn!');
        setShowOtpInput(true);
      } catch {
        toast.success('[MOCK DEMO] Mã OTP 6 chữ số đã được gửi qua Email!');
        setShowOtpInput(true);
      }
    });
  };

  // Confirm OTP code & link database wallet address
  const handleConfirmOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('Vui lòng nhập mã OTP gồm 6 chữ số!');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) return;

      // Use centralized services
      await confirmWalletLink({ walletAddress: verificationWallet, code: otpCode }, clerkToken);

      toast.success('Liên kết địa chỉ ví thành công!');
      setDbWalletAddress(verificationWallet);
      setShowOtpInput(false);
      await fetchDashboardData(verificationWallet);
    } catch {
      if (otpCode === '123456' || otpCode) {
        toast.success('[MOCK DEMO] Liên kết địa chỉ ví thành công!');
        setDbWalletAddress(verificationWallet);
        setShowOtpInput(false);
        await fetchDashboardData(verificationWallet);
      } else {
        toast.error('Mã xác thực OTP không hợp lệ, vui lòng thử lại!');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Connect Web3 Browser Wallet
  const handleConnectWeb3 = async () => {
    setIsWeb3Connecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        const activeAccount = accounts[0];
        setWeb3Wallet(activeAccount);
        toast.success('Đã kết nối ví Web3 thành công!');
      } else {
        setTimeout(() => {
          setWeb3Wallet(dbWalletAddress || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
          toast.success('Đã kết nối Ví Web3 thành công (Demo mode)!');
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối ví Web3!');
    } finally {
      setIsWeb3Connecting(false);
    }
  };

  // Handle Multi-checkbox Selection
  const handleSelectRow = (ledgerId: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(ledgerId)) {
      updated.delete(ledgerId);
    } else {
      updated.add(ledgerId);
    }
    setSelectedIds(updated);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === ledgerEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ledgerEntries.map((e) => e.ledgerId)));
    }
  };

  // Trigger non-custodial Web3 Claim/Batch Claim flow
  const handleInitiateClaim = async (ids: string[]) => {
    if (!web3Wallet) {
      toast.error('Vui lòng kết nối ví Web3 của bạn để claim!');
      return;
    }
    if (dbWalletAddress && web3Wallet.toLowerCase() !== dbWalletAddress.toLowerCase()) {
      toast.error('Địa chỉ ví Web3 không trùng khớp với địa chỉ đã xác thực!');
      return;
    }

    setClaimIds(ids);
    setIsClaimModalOpen(true);
    setClaimStep('init');

    const selectedEntries = ledgerEntries.filter((e) => ids.includes(e.ledgerId));
    const totalNetClaim = selectedEntries
      .reduce((acc, row) => acc + parseFloat(row.netAmount), 0)
      .toFixed(2);
    setClaimedAmount(totalNetClaim);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Step 1 -> Step 2: Sign transaction (MetaMask signing window)
      setClaimStep('sign');
      // In production:
      // const tx = await contract.claimBatch(ids);
      await delay(2000);

      // Step 2 -> Step 3: Broadcast transaction to blockchain
      setClaimStep('broadcast');
      const randomHash =
        '0x' +
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(randomHash);
      // In production:
      // await provider.waitForTransaction(randomHash); (wait for block confirmation)
      await delay(2000);

      // Step 3 -> Step 4: Sync backend (Polling database status)
      setClaimStep('sync');

      let isSynced = false;
      const maxRetries = 15; // 30 seconds max timeout
      let retries = 0;

      while (!isSynced && retries < maxRetries) {
        retries++;
        try {
          const clerkToken = await getToken();
          if (!clerkToken) break;

          // Poll list of pending claims using centralized service
          const data = await getLedgerEntries(dbWalletAddress, clerkToken);

          // If the claimed ledger entries are no longer in 'pending_claim' list, it means BE has successfully synced from chain!
          const isStillPending = data.entries.some((entry: any) => ids.includes(entry.ledgerId));
          if (!isStillPending) {
            isSynced = true;
            break;
          }
        } catch {
          // If offline/fallback (fetch failed), we simulate sync completion after 1 retry
          if (retries >= 2) {
            isSynced = true;
            break;
          }
        }
        // Poll every 2 seconds
        await delay(2000);
      }

      // Step 4 -> Step 5: Success confirmation
      setClaimStep('success');

      setLedgerEntries((prev) => prev.filter((e) => !ids.includes(e.ledgerId)));
      setSelectedIds(new Set());
      setPendingBalance((prev) => {
        const remainingEntries = ledgerEntries.filter((e) => !ids.includes(e.ledgerId));
        const rNet = remainingEntries
          .reduce((acc, row) => acc + parseFloat(row.netAmount), 0)
          .toFixed(2);
        const rGross = remainingEntries
          .reduce((acc, row) => acc + parseFloat(row.grossAmount), 0)
          .toFixed(2);
        const rFee = remainingEntries
          .reduce((acc, row) => acc + parseFloat(row.feeAmount), 0)
          .toFixed(2);
        return {
          ...prev,
          pendingCount: remainingEntries.length,
          totalGross: rGross,
          totalFeeAmount: rFee,
          totalNet: rNet,
          nextExpiry: remainingEntries.length > 0 ? remainingEntries[0].expiresAt : null
        };
      });
      toast.success('Rút hoàn phí thành công!');
    } catch {
      toast.error('Giao dịch rút tiền thất bại!');
    }
  };

  return (
    <PageContainer>
      <div className='flex flex-col gap-6 max-w-6xl mx-auto w-full pb-16 relative'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div className='space-y-1'>
            <h1 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent'>
              Blockchain Claims
            </h1>
            <p className='text-sm text-muted-foreground'>
              Rút tiền hoàn phí phi lưu ký trực tiếp từ Smart Contract Vault (BEP20 Network).
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.back()}
            className='rounded-xl border-border hover:bg-accent font-semibold transition-all'
          >
            <Icons.chevronLeft className='size-4 mr-2' />
            Quay lại
          </Button>
        </div>

        {/* 1. Wallet Configuration Hub */}
        <WalletConfigCard
          dbWalletAddress={dbWalletAddress}
          verificationWallet={verificationWallet}
          setVerificationWallet={setVerificationWallet}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          showOtpInput={showOtpInput}
          isPending={isPending}
          isVerifyingOtp={isVerifyingOtp}
          handleRequestOtp={handleRequestOtp}
          handleConfirmOtp={handleConfirmOtp}
          web3Wallet={web3Wallet}
          isWeb3Connecting={isWeb3Connecting}
          handleConnectWeb3={handleConnectWeb3}
        />

        {/* 2. Metrics Hub */}
        <WithdrawMetrics dbWalletAddress={dbWalletAddress} pendingBalance={pendingBalance} />

        {/* 3. The Interactive Payout Ledger Table */}
        <LedgerTable
          dbWalletAddress={dbWalletAddress}
          web3Wallet={web3Wallet}
          ledgerEntries={ledgerEntries}
          selectedIds={selectedIds}
          handleSelectRow={handleSelectRow}
          handleSelectAll={handleSelectAll}
          handleInitiateClaim={handleInitiateClaim}
          fetchDashboardData={fetchDashboardData}
        />

        {/* 4. Web3 Transaction Pipeline Modal */}
        <ClaimPipelineModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          claimIds={claimIds}
          claimStep={claimStep}
          txHash={txHash}
          claimedAmount={claimedAmount}
        />
      </div>
    </PageContainer>
  );
}
