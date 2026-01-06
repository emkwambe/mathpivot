/**
 * Google Workspace Integrations for MathPivot TutorOS
 * Combines Calendar, Drive, and Classroom functionality
 */

export * from './calendar';
export * from './drive';
export * from './classroom';

import { google } from 'googleapis';

// Combined OAuth scopes for full Google Workspace access
export const GOOGLE_WORKSPACE_SCOPES = [
  // Calendar
  'https://www.googleapis.com/auth/calendar.events',
  // Drive
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  // Classroom
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  // User info
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Check if Google integration is configured
 */
export function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Create base OAuth2 client
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth URL for all Google Workspace permissions
 */
export function getGoogleAuthUrl(state?: string, scopes?: string[]): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes || GOOGLE_WORKSPACE_SCOPES,
    prompt: 'consent',
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  email?: string;
} | null> {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) return null;

    // Get user email
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiryDate: tokens.expiry_date || Date.now() + 3600000,
      email: userInfo.data.email || undefined,
    };
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error);
    return null;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiryDate: number;
} | null> {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) return null;

    return {
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date || Date.now() + 3600000,
    };
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    return null;
  }
}

/**
 * Revoke all tokens (disconnect Google account)
 */
export async function revokeTokens(accessToken: string): Promise<boolean> {
  try {
    const oauth2Client = createOAuth2Client();
    await oauth2Client.revokeToken(accessToken);
    return true;
  } catch (error) {
    console.error('Failed to revoke tokens:', error);
    return false;
  }
}
