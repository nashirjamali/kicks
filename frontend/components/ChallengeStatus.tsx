'use client';

import { useAccount, useReadContract } from 'wagmi';
import { KICKS_CONTRACT_ADDRESS } from '@/config/contracts';
import { KICKS_ABI } from '@/config/abi';
import { ClaimButton } from './ClaimButton';

interface Challenge {
  user: string;
  targetKm: bigint;
  depositAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  completed: boolean;
  exists: boolean;
}

export function ChallengeStatus(): JSX.Element {
  const { address } = useAccount();

  const { data: challenge, isLoading } = useReadContract({
    address: KICKS_CONTRACT_ADDRESS,
    abi: KICKS_ABI,
    functionName: 'getUserChallenge',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  }) as { data: Challenge | undefined; isLoading: boolean };

  if (isLoading) {
    return <div>Loading challenge status...</div>;
  }

  if (!challenge || !challenge.exists) {
    return <div className="text-gray-500">No active challenge. Create one to get started!</div>;
  }

  const targetKm = Number(challenge.targetKm) / 1000;
  const depositAmount = Number(challenge.depositAmount) / 1000000;
  const endTime = Number(challenge.endTime) * 1000;
  const isExpired = Date.now() > endTime;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Target Distance</div>
          <div className="text-lg font-semibold">{targetKm} KM</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Deposit Amount</div>
          <div className="text-lg font-semibold">{depositAmount} USDT</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-semibold">
            {challenge.completed ? (
              <span className="text-green-600">Completed</span>
            ) : isExpired ? (
              <span className="text-red-600">Expired</span>
            ) : (
              <span className="text-yellow-600">Active</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Ends At</div>
          <div className="text-lg font-semibold">{new Date(endTime).toLocaleDateString()}</div>
        </div>
      </div>

      {!challenge.completed && !isExpired && <ClaimButton />}
    </div>
  );
}

