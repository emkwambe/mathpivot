/**
 * Credential Issuance System
 * Generates certificates, badges, and verification tokens
 */

import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import { checkRequirements } from './requirements';
import { logAuditEvent } from '@/lib/audit';
import crypto from 'crypto';

export interface CertificationProgram {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: string;
  badge_image_url: string | null;
  badge_color: string;
  validity_months: number | null;
}

export interface UserCertification {
  id: string;
  user_id: string;
  program_id: string;
  credential_number: string;
  earned_at: string;
  score: number | null;
  valid_from: string;
  valid_until: string | null;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  verification_token: string;
  verification_url: string;
  badge_image_url: string | null;
  certificate_pdf_url: string | null;
  is_public: boolean;
  program?: CertificationProgram;
}

export interface IssueCertificationResult {
  certification_id: string;
  credential_number: string;
  verification_url: string;
  badge_image_url: string | null;
  certificate_pdf_url: string | null;
}

// =============================================================================
// CREDENTIAL ISSUANCE
// =============================================================================

/**
 * Issue a certification to a user
 */
export async function issueCertification(
  userId: string,
  programId: string,
  options: {
    score?: number;
    assessmentAttemptId?: string;
    skipRequirementsCheck?: boolean;
    issuedBy?: string;
  } = {}
): Promise<IssueCertificationResult> {
  if (!isAdminConfigured()) {
    throw new Error('Admin client not configured');
  }

  // Get program details
  const { data: program, error: programError } = await supabaseAdmin
    .from('certification_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (programError || !program) {
    throw new Error('Certification program not found');
  }

  // Check if user already has active certification
  const { data: existing } = await supabaseAdmin
    .from('user_certifications')
    .select('id, status')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .eq('status', 'active')
    .single();

  if (existing) {
    throw new Error('User already has active certification for this program');
  }

  // Verify requirements are met (unless skipped)
  if (!options.skipRequirementsCheck) {
    const reqCheck = await checkRequirements(userId, programId);
    if (!reqCheck.ready_for_certification) {
      throw new Error(`Requirements not met. ${reqCheck.completion_percentage}% complete.`);
    }
  }

  // Generate credential number and verification token
  const credentialNumber = await generateCredentialNumber(program.code);
  const verificationToken = generateVerificationToken();

  // Calculate validity period
  const validFrom = new Date();
  let validUntil: Date | null = null;
  if (program.validity_months) {
    validUntil = new Date(validFrom);
    validUntil.setMonth(validUntil.getMonth() + program.validity_months);
  }

  // Create certification record
  const { data: certification, error: certError } = await supabaseAdmin
    .from('user_certifications')
    .insert({
      user_id: userId,
      program_id: programId,
      credential_number: credentialNumber,
      earned_at: validFrom.toISOString(),
      score: options.score,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil?.toISOString(),
      status: 'active',
      verification_token: verificationToken,
      final_assessment_attempt_id: options.assessmentAttemptId,
      is_public: true,
      achievement_details: {
        issued_by: options.issuedBy || 'system',
        issued_at: validFrom.toISOString(),
        program_code: program.code,
        program_name: program.name,
        level: program.level,
      },
    })
    .select()
    .single();

  if (certError) throw certError;

  // Update progress status
  await supabaseAdmin
    .from('user_certification_progress')
    .update({ status: 'completed' })
    .eq('user_id', userId)
    .eq('program_id', programId);

  // Generate badge image (placeholder - would use actual image generation)
  const badgeUrl = await generateBadgeImage(certification.id, program);

  // Generate PDF certificate (placeholder)
  const pdfUrl = await generateCertificatePDF(certification.id, userId, program);

  // Update with generated assets
  await supabaseAdmin
    .from('user_certifications')
    .update({
      badge_image_url: badgeUrl,
      certificate_pdf_url: pdfUrl,
      certificate_generated_at: new Date().toISOString(),
    })
    .eq('id', certification.id);

  // Log audit event
  await logAuditEvent({
    actorUserId: options.issuedBy || userId,
    action: 'create',
    resourceType: 'certification',
    resourceId: certification.id,
    description: `Certification issued: ${program.name}`,
    metadata: {
      credential_number: credentialNumber,
      program_id: programId,
      program_code: program.code,
      score: options.score,
    },
  });

  return {
    certification_id: certification.id,
    credential_number: credentialNumber,
    verification_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${verificationToken}`,
    badge_image_url: badgeUrl,
    certificate_pdf_url: pdfUrl,
  };
}

/**
 * Revoke a certification
 */
export async function revokeCertification(
  certificationId: string,
  revokedBy: string,
  reason: string
): Promise<void> {
  if (!isAdminConfigured()) return;

  const { data: cert } = await supabaseAdmin
    .from('user_certifications')
    .select('*, program:certification_programs(name, code)')
    .eq('id', certificationId)
    .single();

  if (!cert) throw new Error('Certification not found');

  await supabaseAdmin
    .from('user_certifications')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
      revoked_by: revokedBy,
    })
    .eq('id', certificationId);

  await logAuditEvent({
    actorUserId: revokedBy,
    action: 'update',
    resourceType: 'certification',
    resourceId: certificationId,
    description: `Certification revoked: ${(cert.program as unknown as { name: string }).name}`,
    metadata: {
      credential_number: cert.credential_number,
      reason,
    },
  });
}

/**
 * Renew an expired certification
 */
export async function renewCertification(
  certificationId: string,
  renewedBy: string
): Promise<{ new_valid_until: string }> {
  if (!isAdminConfigured()) throw new Error('Admin not configured');

  const { data: cert } = await supabaseAdmin
    .from('user_certifications')
    .select('*, program:certification_programs(*)')
    .eq('id', certificationId)
    .single();

  if (!cert) throw new Error('Certification not found');

  const program = cert.program as unknown as CertificationProgram;

  if (!program.validity_months) {
    throw new Error('This certification does not expire');
  }

  const newValidUntil = new Date();
  newValidUntil.setMonth(newValidUntil.getMonth() + program.validity_months);

  await supabaseAdmin
    .from('user_certifications')
    .update({
      status: 'active',
      valid_until: newValidUntil.toISOString(),
    })
    .eq('id', certificationId);

  await logAuditEvent({
    actorUserId: renewedBy,
    action: 'update',
    resourceType: 'certification',
    resourceId: certificationId,
    description: `Certification renewed`,
    metadata: {
      credential_number: cert.credential_number,
      new_valid_until: newValidUntil.toISOString(),
    },
  });

  return { new_valid_until: newValidUntil.toISOString() };
}

// =============================================================================
// RETRIEVAL
// =============================================================================

/**
 * Get user's certifications
 */
export async function getUserCertifications(
  userId: string,
  includeExpired: boolean = false
): Promise<UserCertification[]> {
  if (!isAdminConfigured()) return [];

  let query = supabaseAdmin
    .from('user_certifications')
    .select(`
      *,
      program:certification_programs(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (!includeExpired) {
    query = query.in('status', ['active']);
  }

  const { data } = await query;

  return (data || []).map(cert => ({
    ...cert,
    program: cert.program as unknown as CertificationProgram,
  })) as UserCertification[];
}

/**
 * Get certification by credential number
 */
export async function getCertificationByCredential(
  credentialNumber: string
): Promise<UserCertification | null> {
  if (!isAdminConfigured()) return null;

  const { data } = await supabaseAdmin
    .from('user_certifications')
    .select(`
      *,
      program:certification_programs(*)
    `)
    .eq('credential_number', credentialNumber)
    .single();

  if (!data) return null;

  return {
    ...data,
    program: data.program as unknown as CertificationProgram,
  } as UserCertification;
}

/**
 * Get certification by verification token
 */
export async function getCertificationByToken(
  verificationToken: string
): Promise<UserCertification | null> {
  if (!isAdminConfigured()) return null;

  const { data } = await supabaseAdmin
    .from('user_certifications')
    .select(`
      *,
      program:certification_programs(*)
    `)
    .eq('verification_token', verificationToken)
    .single();

  if (!data) return null;

  return {
    ...data,
    program: data.program as unknown as CertificationProgram,
  } as UserCertification;
}

// =============================================================================
// BADGE GENERATION
// =============================================================================

/**
 * Generate badge image for certification
 * In production, this would use a service like Credly or generate SVG/PNG
 */
async function generateBadgeImage(
  certificationId: string,
  program: CertificationProgram
): Promise<string | null> {
  // Placeholder - in production, generate actual badge
  // Options:
  // 1. Use Credly API for Open Badges
  // 2. Generate SVG with @resvg/resvg-js
  // 3. Use Cloudinary for dynamic image generation
  // 4. Use Canvas API on server

  const badgeSvg = generateBadgeSVG(program);

  // For now, return a data URL or placeholder
  // In production, upload to storage and return URL
  return `data:image/svg+xml,${encodeURIComponent(badgeSvg)}`;
}

/**
 * Generate SVG badge
 */
function generateBadgeSVG(program: CertificationProgram): string {
  const color = program.badge_color || '#3B82F6';
  const levelColors: Record<string, string> = {
    foundation: '#6B7280',
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    expert: '#9333EA',
  };

  const levelColor = levelColors[program.level] || color;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${levelColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#grad)" stroke="#1F2937" stroke-width="3"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>
      <text x="100" y="90" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
        ${program.code}
      </text>
      <text x="100" y="115" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="11">
        ${program.level.toUpperCase()}
      </text>
      <text x="100" y="170" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10">
        MathPivot Certified
      </text>
    </svg>
  `.trim();
}

// =============================================================================
// PDF CERTIFICATE GENERATION
// =============================================================================

/**
 * Generate PDF certificate
 * In production, use a proper PDF library like @react-pdf/renderer or PDFKit
 */
async function generateCertificatePDF(
  certificationId: string,
  userId: string,
  program: CertificationProgram
): Promise<string | null> {
  if (!isAdminConfigured()) return null;

  // Get user info
  const { data: user } = await supabaseAdmin
    .from('users_profile')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  if (!user) return null;

  // Get certification details
  const { data: cert } = await supabaseAdmin
    .from('user_certifications')
    .select('*')
    .eq('id', certificationId)
    .single();

  if (!cert) return null;

  // In production, generate actual PDF and upload to storage
  // For now, return a placeholder URL that would point to a PDF generation endpoint
  const pdfData = {
    recipient_name: user.full_name,
    program_name: program.name,
    program_code: program.code,
    level: program.level,
    credential_number: cert.credential_number,
    earned_at: cert.earned_at,
    valid_until: cert.valid_until,
    verification_url: cert.verification_url,
  };

  // Store PDF data for generation endpoint
  // In production: upload to Supabase Storage and return public URL
  return `/api/certifications/${certificationId}/pdf`;
}

/**
 * Generate certificate HTML (for PDF rendering)
 */
export function generateCertificateHTML(
  recipientName: string,
  program: CertificationProgram,
  credentialNumber: string,
  earnedAt: string,
  validUntil: string | null,
  verificationUrl: string
): string {
  const formattedDate = new Date(earnedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validityText = validUntil
    ? `Valid until ${new Date(validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
    : 'No expiration';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Georgia', serif;
          text-align: center;
          padding: 60px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        .certificate {
          background: white;
          border: 8px double #1F2937;
          padding: 60px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .header {
          color: #3B82F6;
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6B7280;
          font-size: 18px;
          margin-bottom: 40px;
        }
        .certifies {
          font-size: 16px;
          color: #374151;
          margin-bottom: 10px;
        }
        .recipient {
          font-size: 36px;
          color: #1F2937;
          font-weight: bold;
          margin-bottom: 30px;
          border-bottom: 2px solid #3B82F6;
          padding-bottom: 10px;
          display: inline-block;
        }
        .achievement {
          font-size: 18px;
          color: #374151;
          margin-bottom: 10px;
        }
        .program-name {
          font-size: 28px;
          color: #1F2937;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .level {
          display: inline-block;
          background: #3B82F6;
          color: white;
          padding: 8px 24px;
          border-radius: 20px;
          font-size: 14px;
          text-transform: uppercase;
          margin-bottom: 40px;
        }
        .details {
          font-size: 14px;
          color: #6B7280;
          margin-top: 40px;
        }
        .credential {
          font-family: monospace;
          background: #F3F4F6;
          padding: 8px 16px;
          border-radius: 4px;
          display: inline-block;
          margin: 10px 0;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #9CA3AF;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">MathPivot</div>
        <div class="subtitle">Certificate of Achievement</div>

        <div class="certifies">This is to certify that</div>
        <div class="recipient">${recipientName}</div>

        <div class="achievement">has successfully completed the requirements for</div>
        <div class="program-name">${program.name}</div>
        <div class="level">${program.level}</div>

        <div class="details">
          <div>Issued on ${formattedDate}</div>
          <div class="credential">Credential: ${credentialNumber}</div>
          <div>${validityText}</div>
        </div>

        <div class="footer">
          Verify this certificate at: ${verificationUrl}
        </div>
      </div>
    </body>
    </html>
  `;
}

// =============================================================================
// OPEN BADGES 2.0 SUPPORT
// =============================================================================

/**
 * Generate Open Badges 2.0 assertion
 * https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html
 */
export function generateBadgeAssertion(
  certification: UserCertification,
  recipientEmail: string
): Record<string, unknown> {
  const issuerId = `${process.env.NEXT_PUBLIC_APP_URL}/badges/issuer`;
  const badgeClassId = `${process.env.NEXT_PUBLIC_APP_URL}/badges/class/${certification.program_id}`;
  const assertionId = `${process.env.NEXT_PUBLIC_APP_URL}/badges/assertion/${certification.id}`;

  return {
    '@context': 'https://w3id.org/openbadges/v2',
    type: 'Assertion',
    id: assertionId,
    recipient: {
      type: 'email',
      hashed: true,
      salt: certification.verification_token.slice(0, 16),
      identity: `sha256$${hashEmail(recipientEmail, certification.verification_token.slice(0, 16))}`,
    },
    badge: badgeClassId,
    issuedOn: certification.earned_at,
    expires: certification.valid_until,
    verification: {
      type: 'HostedBadge',
    },
    evidence: [
      {
        id: certification.verification_url,
        name: 'Verification Page',
        description: 'Public verification page for this credential',
      },
    ],
  };
}

/**
 * Generate Open Badges 2.0 badge class
 */
export function generateBadgeClass(program: CertificationProgram): Record<string, unknown> {
  return {
    '@context': 'https://w3id.org/openbadges/v2',
    type: 'BadgeClass',
    id: `${process.env.NEXT_PUBLIC_APP_URL}/badges/class/${program.id}`,
    name: program.name,
    description: program.description,
    image: program.badge_image_url || `${process.env.NEXT_PUBLIC_APP_URL}/badges/image/${program.id}`,
    criteria: {
      narrative: `Complete all requirements for ${program.name} certification at the ${program.level} level.`,
    },
    issuer: `${process.env.NEXT_PUBLIC_APP_URL}/badges/issuer`,
    tags: ['math', 'education', program.level],
  };
}

/**
 * Generate issuer profile
 */
export function generateIssuerProfile(): Record<string, unknown> {
  return {
    '@context': 'https://w3id.org/openbadges/v2',
    type: 'Issuer',
    id: `${process.env.NEXT_PUBLIC_APP_URL}/badges/issuer`,
    name: 'MathPivot',
    url: process.env.NEXT_PUBLIC_APP_URL,
    email: 'certifications@mathpivot.com',
    description: 'MathPivot provides personalized math tutoring and certification programs.',
  };
}

// =============================================================================
// HELPERS
// =============================================================================

async function generateCredentialNumber(programCode: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MP-${programCode}-${year}`;

  // Get latest credential number for this program/year
  const { data } = await supabaseAdmin
    .from('user_certifications')
    .select('credential_number')
    .like('credential_number', `${prefix}-%`)
    .order('credential_number', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].credential_number;
    const match = lastNumber.match(/-(\d+)$/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${sequence.toString().padStart(5, '0')}`;
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashEmail(email: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(salt + email.toLowerCase())
    .digest('hex');
}

// =============================================================================
// SHARING
// =============================================================================

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(
  credentialName: string,
  organizationName: string,
  issueDate: string,
  expirationDate: string | null,
  credentialId: string,
  credentialUrl: string
): string {
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: credentialName,
    organizationName,
    issueYear: new Date(issueDate).getFullYear().toString(),
    issueMonth: (new Date(issueDate).getMonth() + 1).toString(),
    certId: credentialId,
    certUrl: credentialUrl,
  });

  if (expirationDate) {
    params.append('expirationYear', new Date(expirationDate).getFullYear().toString());
    params.append('expirationMonth', (new Date(expirationDate).getMonth() + 1).toString());
  }

  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

/**
 * Update sharing preferences
 */
export async function updateSharingPreferences(
  certificationId: string,
  userId: string,
  isPublic: boolean
): Promise<void> {
  if (!isAdminConfigured()) return;

  await supabaseAdmin
    .from('user_certifications')
    .update({ is_public: isPublic })
    .eq('id', certificationId)
    .eq('user_id', userId);
}
