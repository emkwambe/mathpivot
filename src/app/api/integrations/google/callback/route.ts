import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { exchangeCodeForTokens } from '@/lib/google';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=google_oauth_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=missing_code`
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?redirect=/settings/integrations`);
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  if (!tokens) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=token_exchange_failed`
    );
  }

  const supabase = await createClient();

  // Store tokens in database (encrypted in production)
  const { error: upsertError } = await supabase.from('user_integrations').upsert(
    {
      user_id: user.id,
      provider: 'google',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expiry: new Date(tokens.expiryDate).toISOString(),
      email: tokens.email,
      scopes: state || 'full', // Store which scopes were requested
      connected_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,provider',
    }
  );

  if (upsertError) {
    console.error('Failed to save Google tokens:', upsertError);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=save_failed`
    );
  }

  return NextResponse.redirect(
    `${baseUrl}/settings/integrations?success=google_connected`
  );
}
