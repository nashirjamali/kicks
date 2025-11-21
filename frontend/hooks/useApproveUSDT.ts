import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { USDT_ADDRESS } from '@/config/contracts';

const USDT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function useApproveUSDT() {
  const { writeContract: approve, isPending: isApproving, data: approveHash } = useWriteContract();
  const { isLoading: isConfirmingApproval, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const approveUSDT = async (spenderAddress: `0x${string}`, amount?: string): Promise<void> => {
    const amountToApprove = amount ? parseUnits(amount, 6) : maxUint256;

    await approve({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'approve',
      args: [spenderAddress, amountToApprove],
    });
  };

  return {
    approveUSDT,
    isApproving,
    isConfirmingApproval,
    isApprovalSuccess,
    approveHash,
  };
}

