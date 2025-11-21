import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const { accessToken, startTime, endTime } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Strava access token is required' }, { status: 400 });
    }

    const challengeStartTime = startTime || Date.now() - 7 * 24 * 60 * 60 * 1000;
    const challengeEndTime = endTime || Date.now();

    const response = await fetch(`${backendUrl}/api/verify-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress,
        accessToken,
        startTime: challengeStartTime,
        endTime: challengeEndTime,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Verification failed' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Verify activity error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

