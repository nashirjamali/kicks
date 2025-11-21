import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('strava_connected', 'true');
      redirectUrl.searchParams.set('access_token', data.access_token);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(new URL('/dashboard?error=token_failed', request.url));
  } catch (error) {
    console.error('Strava OAuth error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=oauth_error', request.url));
  }
}

