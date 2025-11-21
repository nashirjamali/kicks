'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function Home(): JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">KICKS</h1>
        <p className="text-xl mb-8 text-gray-600 dark:text-gray-400">
          Commitment Staking dApp - Lock your USDT, complete your goals, get it back!
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <ConnectButton />
          </div>

          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        <div className="text-left space-y-4">
          <h2 className="text-2xl font-semibold mb-4">How it works:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Connect your wallet and Strava account</li>
            <li>Set a weekly goal (e.g., 50 KM)</li>
            <li>Deposit USDT as collateral</li>
            <li>Complete your activities and sync with Strava</li>
            <li>Claim your deposit back when goal is reached!</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

