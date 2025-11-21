'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { KICKS_CONTRACT_ADDRESS } from '@/config/contracts';
import { KICKS_ABI } from '@/config/abi';

export function ClaimButton(): JSX.Element {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleClaim = async (): Promise<void> => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const stravaToken = localStorage.getItem('strava_access_token');
      if (!stravaToken) {
        throw new Error('Please connect your Strava account first');
      }

      const response = await fetch('/api/verify-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          accessToken: stravaToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify activity');
      }

      const { actualKm, signature } = await response.json();
      const actualKmBigInt = BigInt(Math.floor(actualKm * 1000));

      const hash = await writeContract({
        address: KICKS_CONTRACT_ADDRESS,
        abi: KICKS_ABI,
        functionName: 'completeChallenge',
        args: [actualKmBigInt, signature as `0x${string}`],
      });
      if (hash) {
        setTxHash(hash);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClaim}
        disabled={isLoading || isPending || isConfirming}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading
          ? 'Verifying...'
          : isPending
            ? 'Confirming...'
            : isConfirming
              ? 'Waiting for confirmation...'
              : isSuccess
                ? 'Claimed!'
                : 'Sync & Claim'}
      </button>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {isSuccess && (
        <div className="text-green-600 text-sm">Challenge completed! Your deposit has been returned.</div>
      )}
    </div>
  );
}

