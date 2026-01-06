/**
 * Public Verification System
 * Allows third parties to verify certifications
 */

import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';

export interface VerificationResult {
  valid: boolean;
  status: 'active' | 'expired' | 'revoked' | 'suspended' | 'not_found';
  credential?: {
    credential_number: string;
    recipient_name: string;
    program_name: string;
    program_code: string;
    level: string;
    earned_at: string;
    valid_from: string;
    valid_until: string | null;
    score: number | null;
  };
  message?: string;
}

// =============================================================================
// PUBLIC VERIFICATION
// =============================================================================

/**
 * Verify a certification by token
 */
export async function verifyByToken(
  token: string,
  verifierInfo?: {
    name?: string;
    email?: string;
    organization?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<VerificationResult> {
  if (!isAdminConfigured()) {
    return { valid: false, status: 'not_found', message: 'Verification service unavailable' };
  }

  // Find certification
  const { data: cert } = await supabaseAdmin
    .from('user_certifications')
    .select(`
      *,
      program:certification_programs(name, code, level),
      user:users_profile(full_name)
    `)
    .eq('verification_token', token)
    .single();

  if (!cert) {
    await logVerification(null, false, verifierInfo);
    return { valid: false, status: 'not_found', message: 'Certification not found' };
  }

  // Check if public
  if (!cert.is_public) {
    await logVerification(cert.id, false, verifierInfo);
    return { valid: false, status: 'not_found', message: 'This certification is private' };
  }

  // Check status
  const program = cert.program as unknown as { name: string; code: string; level: string };
  const user = cert.user as unknown as { full_name: string };

  const baseCredential = {
    credential_number: cert.credential_number,
    recipient_name: user?.full_name || 'Unknown',
    program_name: program?.name || 'Unknown',
    program_code: program?.code || 'Unknown',
    level: program?.level || 'Unknown',
    earned_at: cert.earned_at,
    valid_from: cert.valid_from,
    valid_until: cert.valid_until,
    score: cert.score,
  };

  // Check for revoked
  if (cert.status === 'revoked') {
    await logVerification(cert.id, false, verifierInfo);
    return {
      valid: false,
      status: 'revoked',
      credential: baseCredential,
      message: 'This certification has been revoked',
    };
  }

  // Check for suspended
  if (cert.status === 'suspended') {
    await logVerification(cert.id, false, verifierInfo);
    return {
      valid: false,
      status: 'suspended',
      credential: baseCredential,
      message: 'This certification is currently suspended',
    };
  }

  // Check for expired
  if (cert.valid_until && new Date(cert.valid_until) < new Date()) {
    await logVerification(cert.id, false, verifierInfo);
    return {
      valid: false,
      status: 'expired',
      credential: baseCredential,
      message: 'This certification has expired',
    };
  }

  // Valid!
  await logVerification(cert.id, true, verifierInfo);
  return {
    valid: true,
    status: 'active',
    credential: baseCredential,
  };
}

/**
 * Verify by credential number
 */
export async function verifyByCredentialNumber(
  credentialNumber: string,
  verifierInfo?: {
    name?: string;
    email?: string;
    organization?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<VerificationResult> {
  if (!isAdminConfigured()) {
    return { valid: false, status: 'not_found', message: 'Verification service unavailable' };
  }

  // Find certification
  const { data: cert } = await supabaseAdmin
    .from('user_certifications')
    .select('verification_token')
    .eq('credential_number', credentialNumber)
    .single();

  if (!cert) {
    return { valid: false, status: 'not_found', message: 'Certification not found' };
  }

  return verifyByToken(cert.verification_token, verifierInfo);
}

/**
 * Batch verify multiple credentials
 */
export async function batchVerify(
  credentialNumbers: string[]
): Promise<Record<string, VerificationResult>> {
  const results: Record<string, VerificationResult> = {};

  for (const credNum of credentialNumbers) {
    results[credNum] = await verifyByCredentialNumber(credNum);
  }

  return results;
}

// =============================================================================
// VERIFICATION LOGGING
// =============================================================================

/**
 * Log verification attempt
 */
async function logVerification(
  certificationId: string | null,
  wasValid: boolean,
  verifierInfo?: {
    name?: string;
    email?: string;
    organization?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  if (!isAdminConfigured() || !certificationId) return;

  await supabaseAdmin.from('certification_verifications').insert({
    user_certification_id: certificationId,
    verified_at: new Date().toISOString(),
    verifier_name: verifierInfo?.name,
    verifier_email: verifierInfo?.email,
    verifier_organization: verifierInfo?.organization,
    ip_address: verifierInfo?.ipAddress,
    user_agent: verifierInfo?.userAgent,
    was_valid: wasValid,
  });
}

/**
 * Get verification history for a certification
 */
export async function getVerificationHistory(
  certificationId: string,
  limit: number = 50
): Promise<{
  verified_at: string;
  verifier_organization: string | null;
  was_valid: boolean;
}[]> {
  if (!isAdminConfigured()) return [];

  const { data } = await supabaseAdmin
    .from('certification_verifications')
    .select('verified_at, verifier_organization, was_valid')
    .eq('user_certification_id', certificationId)
    .order('verified_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Get verification stats for a certification
 */
export async function getVerificationStats(certificationId: string): Promise<{
  total_verifications: number;
  last_30_days: number;
  unique_organizations: number;
}> {
  if (!isAdminConfigured()) {
    return { total_verifications: 0, last_30_days: 0, unique_organizations: 0 };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total count
  const { count: total } = await supabaseAdmin
    .from('certification_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_certification_id', certificationId);

  // Last 30 days
  const { count: recent } = await supabaseAdmin
    .from('certification_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_certification_id', certificationId)
    .gte('verified_at', thirtyDaysAgo.toISOString());

  // Unique organizations
  const { data: orgs } = await supabaseAdmin
    .from('certification_verifications')
    .select('verifier_organization')
    .eq('user_certification_id', certificationId)
    .not('verifier_organization', 'is', null);

  const uniqueOrgs = new Set(orgs?.map(o => o.verifier_organization)).size;

  return {
    total_verifications: total || 0,
    last_30_days: recent || 0,
    unique_organizations: uniqueOrgs,
  };
}

// =============================================================================
// QR CODE GENERATION
// =============================================================================

/**
 * Generate QR code data URL for verification
 */
export function getQRCodeUrl(verificationUrl: string): string {
  // Use a QR code API service
  // In production, you might use a library like 'qrcode' or a service
  const encodedUrl = encodeURIComponent(verificationUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
}

/**
 * Generate verification page URL
 */
export function getVerificationPageUrl(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/verify/${token}`;
}

// =============================================================================
// EMBEDDABLE BADGE
// =============================================================================

/**
 * Generate embeddable badge HTML
 */
export function getEmbeddableBadgeHtml(
  verificationUrl: string,
  badgeImageUrl: string,
  programName: string,
  recipientName: string
): string {
  return `
<!-- MathPivot Certification Badge -->
<a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" title="Verify ${recipientName}'s ${programName} certification">
  <img src="${badgeImageUrl}" alt="${programName} - MathPivot Certified" width="150" height="150" />
</a>
<!-- End MathPivot Badge -->
  `.trim();
}

/**
 * Generate markdown badge
 */
export function getMarkdownBadge(
  verificationUrl: string,
  badgeImageUrl: string,
  programName: string
): string {
  return `[![${programName} - MathPivot Certified](${badgeImageUrl})](${verificationUrl})`;
}
