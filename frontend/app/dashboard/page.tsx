'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChallengeForm } from '@/components/ChallengeForm';
import { ChallengeStatus } from '@/components/ChallengeStatus';
import { StravaConnect } from '@/components/StravaConnect';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Dashboard(): JSX.Element {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    if (accessToken) {
      localStorage.setItem('strava_access_token', accessToken);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="mb-6">Please connect your wallet to continue</p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Connect Strava</h2>
            <StravaConnect />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Create Challenge</h2>
            <ChallengeForm />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Challenge</h2>
            <ChallengeStatus />
          </div>
        </div>
      </div>
    </main>
  );
}
