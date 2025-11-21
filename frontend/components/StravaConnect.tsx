'use client';

import { useState, useEffect } from 'react';

export function StravaConnect(): JSX.Element {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('strava_access_token');
    setIsConnected(!!token);
  }, []);

  const handleConnect = async (): Promise<void> => {
    setIsLoading(true);
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    if (!clientId) {
      alert('Strava Client ID not configured');
      setIsLoading(false);
      return;
    }
    const redirectUri = `${window.location.origin}/api/strava/callback`;
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=activity:read_all`;

    window.location.href = stravaAuthUrl;
  };

  return (
    <div>
      {isConnected ? (
        <div className="text-green-600">Strava Connected</div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Connecting...' : 'Connect Strava'}
        </button>
      )}
    </div>
  );
}

