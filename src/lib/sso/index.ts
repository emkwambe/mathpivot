/**
 * SSO Integration for MathPivot TutorOS
 * Supports Google Workspace, Microsoft Entra, Clever, and ClassLink
 */

import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit';

export type SSOProvider = 'google_workspace' | 'microsoft_entra' | 'clever' | 'classlink' | 'saml' | 'oidc';

export interface SSOConfig {
  provider: SSOProvider;
  clientId: string;
  clientSecret: string;
  tenantId?: string; // For Microsoft
  redirectUri: string;
  scopes: string[];
  domain?: string; // Restrict to specific email domain
}

export interface SSOUser {
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string; // From SSO provider (teacher, student, etc.)
  organizationId?: string;
  groups?: string[];
  metadata?: Record<string, unknown>;
}

// =============================================================================
// GOOGLE WORKSPACE SSO
// =============================================================================

const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
];

/**
 * Generate Google Workspace SSO auth URL
 */
export function getGoogleWorkspaceAuthUrl(
  organizationId: string,
  redirectUri: string,
  hostedDomain?: string
): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_WORKSPACE_SCOPES,
    prompt: 'consent',
    state: JSON.stringify({ organizationId, provider: 'google_workspace' }),
    hd: hostedDomain, // Restrict to specific domain
  });

  return authUrl;
}

/**
 * Handle Google Workspace SSO callback
 */
export async function handleGoogleWorkspaceCallback(
  code: string,
  organizationId: string
): Promise<SSOUser | null> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_SSO_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
      throw new Error('No email returned from Google');
    }

    return {
      externalId: userInfo.data.id || userInfo.data.email,
      email: userInfo.data.email,
      firstName: userInfo.data.given_name || '',
      lastName: userInfo.data.family_name || '',
      metadata: {
        picture: userInfo.data.picture,
        locale: userInfo.data.locale,
        hd: userInfo.data.hd, // Hosted domain
      },
    };
  } catch (error) {
    console.error('Google Workspace SSO error:', error);
    return null;
  }
}

// =============================================================================
// CLEVER SSO (K-12 focused)
// =============================================================================

const CLEVER_API_BASE = 'https://api.clever.com';
const CLEVER_OAUTH_BASE = 'https://clever.com/oauth';

/**
 * Generate Clever SSO auth URL
 */
export function getCleverAuthUrl(
  organizationId: string,
  redirectUri: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CLEVER_CLIENT_ID || '',
    redirect_uri: redirectUri,
    state: JSON.stringify({ organizationId, provider: 'clever' }),
  });

  return `${CLEVER_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Handle Clever SSO callback
 */
export async function handleCleverCallback(
  code: string,
  organizationId: string
): Promise<SSOUser | null> {
  try {
    // Exchange code for token
    const tokenResponse = await fetch(`${CLEVER_OAUTH_BASE}/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.CLEVER_CLIENT_ID}:${process.env.CLEVER_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.CLEVER_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = await tokenResponse.json();

    // Get user info from Clever
    const meResponse = await fetch(`${CLEVER_API_BASE}/v3.0/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!meResponse.ok) {
      throw new Error('Failed to get user info from Clever');
    }

    const { data: meData } = await meResponse.json();

    // Get detailed user info based on type
    const userType = meData.type; // 'student', 'teacher', 'district_admin', etc.
    const userId = meData.id;

    const userResponse = await fetch(`${CLEVER_API_BASE}/v3.0/${userType}s/${userId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get detailed user info');
    }

    const { data: userData } = await userResponse.json();

    // Map Clever role to MathPivot role
    const roleMap: Record<string, string> = {
      student: 'student',
      teacher: 'tutor',
      district_admin: 'admin',
      school_admin: 'admin',
    };

    return {
      externalId: userId,
      email: userData.email || `${userId}@clever.local`,
      firstName: userData.name?.first || '',
      lastName: userData.name?.last || '',
      role: roleMap[userType] || 'student',
      metadata: {
        cleverType: userType,
        grade: userData.grade,
        school: userData.school,
        district: userData.district,
      },
    };
  } catch (error) {
    console.error('Clever SSO error:', error);
    return null;
  }
}

// =============================================================================
// CLASSLINK SSO
// =============================================================================

const CLASSLINK_API_BASE = 'https://launchpad.classlink.com';

/**
 * Generate ClassLink SSO auth URL
 */
export function getClassLinkAuthUrl(
  organizationId: string,
  redirectUri: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CLASSLINK_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: 'profile oneroster',
    state: JSON.stringify({ organizationId, provider: 'classlink' }),
  });

  return `${CLASSLINK_API_BASE}/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Handle ClassLink SSO callback
 */
export async function handleClassLinkCallback(
  code: string,
  organizationId: string
): Promise<SSOUser | null> {
  try {
    // Exchange code for token
    const tokenResponse = await fetch(`${CLASSLINK_API_BASE}/oauth2/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.CLASSLINK_CLIENT_ID || '',
        client_secret: process.env.CLASSLINK_CLIENT_SECRET || '',
        redirect_uri: process.env.CLASSLINK_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(`${CLASSLINK_API_BASE}/v2/my/info`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    return {
      externalId: userData.UserId,
      email: userData.Email,
      firstName: userData.FirstName,
      lastName: userData.LastName,
      role: userData.Role?.toLowerCase() === 'teacher' ? 'tutor' : 'student',
      metadata: {
        displayName: userData.DisplayName,
        tenant: userData.TenantId,
        building: userData.BuildingId,
      },
    };
  } catch (error) {
    console.error('ClassLink SSO error:', error);
    return null;
  }
}

// =============================================================================
// UNIFIED SSO HANDLER
// =============================================================================

/**
 * Get SSO auth URL for organization
 */
export async function getSSOAuthUrl(organizationId: string): Promise<string | null> {
  if (!isAdminConfigured()) return null;

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('sso_provider, sso_config, sso_domain')
    .eq('id', organizationId)
    .eq('sso_enabled', true)
    .single();

  if (!org || !org.sso_provider) return null;

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/callback`;

  switch (org.sso_provider) {
    case 'google_workspace':
      return getGoogleWorkspaceAuthUrl(organizationId, redirectUri, org.sso_domain);
    case 'clever':
      return getCleverAuthUrl(organizationId, redirectUri);
    case 'classlink':
      return getClassLinkAuthUrl(organizationId, redirectUri);
    default:
      return null;
  }
}

/**
 * Handle SSO callback and create/update user
 */
export async function handleSSOCallback(
  provider: SSOProvider,
  code: string,
  organizationId: string
): Promise<{ userId: string; isNewUser: boolean } | null> {
  if (!isAdminConfigured()) return null;

  // Get user info from SSO provider
  let ssoUser: SSOUser | null = null;

  switch (provider) {
    case 'google_workspace':
      ssoUser = await handleGoogleWorkspaceCallback(code, organizationId);
      break;
    case 'clever':
      ssoUser = await handleCleverCallback(code, organizationId);
      break;
    case 'classlink':
      ssoUser = await handleClassLinkCallback(code, organizationId);
      break;
    default:
      console.error('Unsupported SSO provider:', provider);
      return null;
  }

  if (!ssoUser) return null;

  // Check if user already exists in organization
  const { data: existingMember } = await supabaseAdmin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('external_id', ssoUser.externalId)
    .single();

  if (existingMember) {
    // Update last login
    await supabaseAdmin
      .from('sso_sessions')
      .insert({
        user_id: existingMember.user_id,
        organization_id: organizationId,
        provider,
        external_session_id: ssoUser.externalId,
      });

    await logAuditEvent({
      actorUserId: existingMember.user_id,
      action: 'login',
      resourceType: 'sso',
      metadata: { provider, organization_id: organizationId },
    });

    return { userId: existingMember.user_id, isNewUser: false };
  }

  // Check if organization allows auto-provisioning
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('sso_auto_provision, sso_domain')
    .eq('id', organizationId)
    .single();

  if (!org?.sso_auto_provision) {
    console.log('Auto-provisioning disabled for organization');
    return null;
  }

  // Verify email domain if required
  if (org.sso_domain) {
    const emailDomain = ssoUser.email.split('@')[1];
    if (emailDomain !== org.sso_domain) {
      console.log('Email domain mismatch:', emailDomain, '!=', org.sso_domain);
      return null;
    }
  }

  // Create new user
  const { data: newUser, error: userError } = await supabaseAdmin
    .from('users_profile')
    .insert({
      email: ssoUser.email,
      full_name: `${ssoUser.firstName} ${ssoUser.lastName}`.trim(),
      role: ssoUser.role || 'student',
    })
    .select('id')
    .single();

  if (userError || !newUser) {
    console.error('Failed to create user:', userError);
    return null;
  }

  // Add to organization
  await supabaseAdmin.from('organization_members').insert({
    organization_id: organizationId,
    user_id: newUser.id,
    external_id: ssoUser.externalId,
    external_email: ssoUser.email,
    org_role: ssoUser.role === 'tutor' ? 'teacher' : ssoUser.role || 'student',
  });

  // Create SSO session
  await supabaseAdmin.from('sso_sessions').insert({
    user_id: newUser.id,
    organization_id: organizationId,
    provider,
    external_session_id: ssoUser.externalId,
  });

  await logAuditEvent({
    actorUserId: newUser.id,
    action: 'create',
    resourceType: 'user',
    resourceId: newUser.id,
    description: 'User created via SSO',
    metadata: { provider, organization_id: organizationId, sso_user: ssoUser },
  });

  return { userId: newUser.id, isNewUser: true };
}

/**
 * Get organization by SSO domain
 */
export async function getOrganizationByDomain(email: string): Promise<{
  id: string;
  name: string;
  ssoProvider: SSOProvider;
} | null> {
  if (!isAdminConfigured()) return null;

  const domain = email.split('@')[1];

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id, name, sso_provider')
    .eq('sso_domain', domain)
    .eq('sso_enabled', true)
    .single();

  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    ssoProvider: org.sso_provider as SSOProvider,
  };
}

/**
 * Disconnect SSO for a user
 */
export async function disconnectSSO(userId: string, organizationId: string): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  // End all SSO sessions
  await supabaseAdmin
    .from('sso_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .is('ended_at', null);

  // Remove external ID from membership (keep user in org)
  await supabaseAdmin
    .from('organization_members')
    .update({ external_id: null, external_email: null })
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  await logAuditEvent({
    actorUserId: userId,
    action: 'update',
    resourceType: 'sso',
    description: 'SSO disconnected',
    metadata: { organization_id: organizationId },
  });

  return true;
}
