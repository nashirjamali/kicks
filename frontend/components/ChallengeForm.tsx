'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { KICKS_CONTRACT_ADDRESS } from '@/config/contracts';
import { KICKS_ABI } from '@/config/abi';
import { useApproveUSDT } from '@/hooks/useApproveUSDT';

export function ChallengeForm(): JSX.Element {
  const { address } = useAccount();
  const [targetKm, setTargetKm] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('10');
  const [needsApproval, setNeedsApproval] = useState<boolean>(true);

  const { approveUSDT, isApproving, isConfirmingApproval, isApprovalSuccess } = useApproveUSDT();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleApprove = async (): Promise<void> => {
    try {
      await approveUSDT(KICKS_CONTRACT_ADDRESS, depositAmount);
    } catch (error) {
      console.error('Error approving USDT:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!address || !targetKm || !depositAmount) return;

    if (needsApproval) {
      await handleApprove();
      setNeedsApproval(false);
      return;
    }

    try {
      const depositAmountWei = parseUnits(depositAmount, 6);
      const targetKmBigInt = BigInt(Math.floor(parseFloat(targetKm) * 1000));

      await writeContract({
        address: KICKS_CONTRACT_ADDRESS,
        abi: KICKS_ABI,
        functionName: 'joinChallenge',
        args: [targetKmBigInt, depositAmountWei],
      });
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="targetKm" className="block text-sm font-medium mb-2">
          Target Distance (KM)
        </label>
        <input
          id="targetKm"
          type="number"
          step="0.1"
          min="0"
          value={targetKm}
          onChange={(e) => setTargetKm(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="depositAmount" className="block text-sm font-medium mb-2">
          Deposit Amount (USDT)
        </label>
        <input
          id="depositAmount"
          type="number"
          step="0.1"
          min="0"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || isConfirming || isApproving || isConfirmingApproval}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {isApproving || isConfirmingApproval
          ? 'Approving USDT...'
          : needsApproval && !isApprovalSuccess
            ? 'Approve USDT First'
            : isPending
              ? 'Confirming...'
              : isConfirming
                ? 'Waiting for confirmation...'
                : isSuccess
                  ? 'Challenge Created!'
                  : 'Join Challenge'}
      </button>

      {isApprovalSuccess && needsApproval && (
        <div className="text-green-600 text-sm">USDT approved! Click again to join challenge.</div>
      )}
      {isSuccess && (
        <div className="text-green-600 text-sm">Transaction successful! Check your challenge status.</div>
      )}
    </form>
  );
}

