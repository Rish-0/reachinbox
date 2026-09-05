import { env } from '../config/env';
import { userRepo } from '../repositories/userRepo';

// ============================================================================
// Google OAuth
// ============================================================================

/**
 * Build the Google OAuth consent URL with CSRF state protection.
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.API_URL}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state,
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange Google authorization code for tokens and user profile.
 */
export async function handleGoogleCallback(code: string) {
  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.API_URL}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const tokens: any = await tokenRes.json();

  // Get user profile
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  const profile: any = await profileRes.json();

  // Upsert user in database
  const user = await userRepo.upsertFromGoogle({
    googleId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture || null,
  });

  return { user, accessToken: tokens.access_token };
}

// ============================================================================
// Slack OAuth
// ============================================================================

/**
 * Build the Slack OAuth authorization URL.
 */
export function getSlackAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    scope: 'chat:write,channels:read',
    user_scope: 'identity.basic,identity.email',
    redirect_uri: `${env.API_URL}/auth/slack/callback`,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange Slack authorization code for tokens and store on user.
 */
export async function handleSlackCallback(code: string, userId: string) {
  const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
      redirect_uri: `${env.API_URL}/auth/slack/callback`,
    }),
  });

  const data: any = await tokenRes.json();

  if (!data.ok) {
    throw new Error(`Slack OAuth failed: ${data.error}`);
  }

  // Store Slack tokens on user record
  await userRepo.updateSlackTokens(userId, {
    slackAccessToken: data.access_token,
    slackTeamId: data.team?.id || '',
    slackTeamName: data.team?.name || '',
    slackUserId: data.authed_user?.id || '',
  });

  return data;
}

/**
 * Disconnect Slack from user's account.
 */
export async function disconnectSlack(userId: string) {
  await userRepo.clearSlackTokens(userId);
}
