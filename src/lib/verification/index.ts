/**
 * Tutor Verification Pipeline for MathPivot TutorOS
 * Background checks, credentials, and certification management
 */

import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit';

export type VerificationStatus =
  | 'not_started'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'suspended';

export type VerificationType =
  | 'identity'
  | 'background_check'
  | 'education'
  | 'certification'
  | 'reference'
  | 'interview'
  | 'demo_lesson'
  | 'training';

export interface VerificationRecord {
  id: string;
  tutorUserId: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  provider?: string;
  externalId?: string;
  passed?: boolean;
  score?: number;
  verifiedAt?: string;
  expiresAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

export interface TutorVerificationSummary {
  tutorUserId: string;
  overallStatus: VerificationStatus;
  canTeachMinors: boolean;
  backgroundCheckClear: boolean;
  identityVerified: boolean;
  credentialsVerified: boolean;
  verifications: VerificationRecord[];
  missingVerifications: VerificationType[];
  expiringVerifications: VerificationRecord[];
}

// Required verifications to teach
const REQUIRED_VERIFICATIONS: VerificationType[] = [
  'identity',
  'background_check',
  'training',
];

// Additional requirements to teach minors
const MINOR_TEACHING_REQUIREMENTS: VerificationType[] = [
  'identity',
  'background_check',
  'training',
];

// =============================================================================
// VERIFICATION MANAGEMENT
// =============================================================================

/**
 * Get all verifications for a tutor
 */
export async function getTutorVerifications(
  tutorUserId: string
): Promise<VerificationRecord[]> {
  if (!isAdminConfigured()) return [];

  const { data, error } = await supabaseAdmin
    .from('tutor_verifications')
    .select('*')
    .eq('tutor_user_id', tutorUserId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((v) => ({
    id: v.id,
    tutorUserId: v.tutor_user_id,
    verificationType: v.verification_type,
    status: v.status,
    provider: v.provider,
    externalId: v.external_id,
    passed: v.passed,
    score: v.score,
    verifiedAt: v.verified_at,
    expiresAt: v.expires_at,
    reviewNotes: v.review_notes,
    rejectionReason: v.rejection_reason,
  }));
}

/**
 * Get verification summary for a tutor
 */
export async function getTutorVerificationSummary(
  tutorUserId: string
): Promise<TutorVerificationSummary> {
  const verifications = await getTutorVerifications(tutorUserId);

  // Get tutor profile
  const { data: tutor } = await supabaseAdmin
    .from('tutors_profile')
    .select('verification_status, can_teach_minors, background_check_clear, identity_verified, credentials_verified')
    .eq('user_id', tutorUserId)
    .single();

  // Find missing verifications
  const completedTypes = new Set(
    verifications
      .filter((v) => v.status === 'approved' && (!v.expiresAt || new Date(v.expiresAt) > new Date()))
      .map((v) => v.verificationType)
  );

  const missingVerifications = REQUIRED_VERIFICATIONS.filter(
    (type) => !completedTypes.has(type)
  );

  // Find expiring verifications (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringVerifications = verifications.filter(
    (v) =>
      v.status === 'approved' &&
      v.expiresAt &&
      new Date(v.expiresAt) <= thirtyDaysFromNow &&
      new Date(v.expiresAt) > new Date()
  );

  // Determine overall status
  let overallStatus: VerificationStatus = 'not_started';

  if (verifications.some((v) => v.status === 'suspended')) {
    overallStatus = 'suspended';
  } else if (missingVerifications.length === 0) {
    overallStatus = 'approved';
  } else if (verifications.some((v) => v.status === 'in_review')) {
    overallStatus = 'in_review';
  } else if (verifications.some((v) => v.status === 'pending')) {
    overallStatus = 'pending';
  } else if (verifications.length > 0) {
    overallStatus = 'pending';
  }

  return {
    tutorUserId,
    overallStatus,
    canTeachMinors: tutor?.can_teach_minors || false,
    backgroundCheckClear: tutor?.background_check_clear || false,
    identityVerified: tutor?.identity_verified || false,
    credentialsVerified: tutor?.credentials_verified || false,
    verifications,
    missingVerifications,
    expiringVerifications,
  };
}

/**
 * Start a verification process
 */
export async function startVerification(
  tutorUserId: string,
  verificationType: VerificationType,
  provider?: string
): Promise<{ verificationId: string } | null> {
  if (!isAdminConfigured()) return null;

  // Check if verification already exists and is valid
  const { data: existing } = await supabaseAdmin
    .from('tutor_verifications')
    .select('id, status, expires_at')
    .eq('tutor_user_id', tutorUserId)
    .eq('verification_type', verificationType)
    .single();

  if (existing) {
    // If approved and not expired, don't start new one
    if (
      existing.status === 'approved' &&
      (!existing.expires_at || new Date(existing.expires_at) > new Date())
    ) {
      return { verificationId: existing.id };
    }

    // Update existing record
    const { error } = await supabaseAdmin
      .from('tutor_verifications')
      .update({
        status: 'pending',
        provider,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) return null;

    return { verificationId: existing.id };
  }

  // Create new verification
  const { data, error } = await supabaseAdmin
    .from('tutor_verifications')
    .insert({
      tutor_user_id: tutorUserId,
      verification_type: verificationType,
      status: 'pending',
      provider,
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) return null;

  await logAuditEvent({
    actorUserId: tutorUserId,
    action: 'create',
    resourceType: 'tutor_verification',
    resourceId: data.id,
    metadata: { verification_type: verificationType, provider },
  });

  return { verificationId: data.id };
}

/**
 * Submit verification documents
 */
export async function submitVerificationDocuments(
  verificationId: string,
  tutorUserId: string,
  documentUrls: string[],
  documentNames?: string[]
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const { error } = await supabaseAdmin
    .from('tutor_verifications')
    .update({
      document_urls: documentUrls,
      document_names: documentNames,
      status: 'in_review',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .eq('tutor_user_id', tutorUserId);

  if (error) return false;

  await logAuditEvent({
    actorUserId: tutorUserId,
    action: 'update',
    resourceType: 'tutor_verification',
    resourceId: verificationId,
    metadata: { action: 'documents_submitted' },
  });

  return true;
}

/**
 * Review and approve/reject verification (admin action)
 */
export async function reviewVerification(
  verificationId: string,
  reviewerUserId: string,
  approved: boolean,
  options: {
    score?: number;
    reviewNotes?: string;
    rejectionReason?: string;
    expiresInDays?: number;
  } = {}
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const expiresAt = options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: verification, error: updateError } = await supabaseAdmin
    .from('tutor_verifications')
    .update({
      status: approved ? 'approved' : 'rejected',
      passed: approved,
      score: options.score,
      review_notes: options.reviewNotes,
      rejection_reason: options.rejectionReason,
      reviewed_by: reviewerUserId,
      reviewed_at: new Date().toISOString(),
      verified_at: approved ? new Date().toISOString() : null,
      expires_at: expiresAt,
    })
    .eq('id', verificationId)
    .select('tutor_user_id, verification_type')
    .single();

  if (updateError || !verification) return false;

  // Update tutor profile based on verification type
  await updateTutorVerificationStatus(verification.tutor_user_id);

  await logAuditEvent({
    actorUserId: reviewerUserId,
    action: 'update',
    resourceType: 'tutor_verification',
    resourceId: verificationId,
    metadata: {
      tutor_user_id: verification.tutor_user_id,
      verification_type: verification.verification_type,
      approved,
      score: options.score,
    },
    isSensitive: true,
  });

  return true;
}

/**
 * Update tutor's overall verification status based on individual verifications
 */
async function updateTutorVerificationStatus(tutorUserId: string): Promise<void> {
  const summary = await getTutorVerificationSummary(tutorUserId);

  // Check background check
  const backgroundCheck = summary.verifications.find(
    (v) => v.verificationType === 'background_check' && v.status === 'approved' && v.passed
  );

  // Check identity
  const identity = summary.verifications.find(
    (v) => v.verificationType === 'identity' && v.status === 'approved'
  );

  // Check if can teach minors (all MINOR_TEACHING_REQUIREMENTS met)
  const canTeachMinors = MINOR_TEACHING_REQUIREMENTS.every((type) =>
    summary.verifications.some(
      (v) =>
        v.verificationType === type &&
        v.status === 'approved' &&
        v.passed !== false &&
        (!v.expiresAt || new Date(v.expiresAt) > new Date())
    )
  );

  await supabaseAdmin
    .from('tutors_profile')
    .update({
      verification_status: summary.overallStatus,
      verification_completed_at:
        summary.overallStatus === 'approved' ? new Date().toISOString() : null,
      can_teach_minors: canTeachMinors,
      background_check_clear: !!backgroundCheck,
      background_check_date: backgroundCheck?.verifiedAt
        ? new Date(backgroundCheck.verifiedAt).toISOString().split('T')[0]
        : null,
      identity_verified: !!identity,
    })
    .eq('user_id', tutorUserId);
}

/**
 * Suspend a tutor's verification (admin action)
 */
export async function suspendTutorVerification(
  tutorUserId: string,
  adminUserId: string,
  reason: string
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  // Suspend all verifications
  await supabaseAdmin
    .from('tutor_verifications')
    .update({ status: 'suspended' })
    .eq('tutor_user_id', tutorUserId)
    .eq('status', 'approved');

  // Update tutor profile
  await supabaseAdmin
    .from('tutors_profile')
    .update({
      verification_status: 'suspended',
      can_teach_minors: false,
      is_active: false,
    })
    .eq('user_id', tutorUserId);

  await logAuditEvent({
    actorUserId: adminUserId,
    action: 'user_suspended',
    resourceType: 'tutor',
    resourceId: tutorUserId,
    metadata: { reason },
    isSensitive: true,
  });

  return true;
}

// =============================================================================
// CERTIFICATIONS
// =============================================================================

/**
 * Add tutor certification
 */
export async function addTutorCertification(
  tutorUserId: string,
  certification: {
    name: string;
    issuingOrganization?: string;
    credentialId?: string;
    issueDate?: string;
    expiryDate?: string;
    documentUrl?: string;
  }
): Promise<{ certificationId: string } | null> {
  if (!isAdminConfigured()) return null;

  const { data, error } = await supabaseAdmin
    .from('tutor_certifications')
    .insert({
      tutor_user_id: tutorUserId,
      name: certification.name,
      issuing_organization: certification.issuingOrganization,
      credential_id: certification.credentialId,
      issue_date: certification.issueDate,
      expiry_date: certification.expiryDate,
      document_url: certification.documentUrl,
    })
    .select('id')
    .single();

  if (error || !data) return null;

  return { certificationId: data.id };
}

/**
 * Verify tutor certification (admin action)
 */
export async function verifyCertification(
  certificationId: string,
  verifierUserId: string,
  verified: boolean
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const { error } = await supabaseAdmin
    .from('tutor_certifications')
    .update({
      verified,
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verifierUserId,
    })
    .eq('id', certificationId);

  return !error;
}

/**
 * Get tutor certifications
 */
export async function getTutorCertifications(tutorUserId: string): Promise<
  Array<{
    id: string;
    name: string;
    issuingOrganization?: string;
    credentialId?: string;
    issueDate?: string;
    expiryDate?: string;
    documentUrl?: string;
    verified: boolean;
    verifiedAt?: string;
  }>
> {
  if (!isAdminConfigured()) return [];

  const { data, error } = await supabaseAdmin
    .from('tutor_certifications')
    .select('*')
    .eq('tutor_user_id', tutorUserId)
    .order('issue_date', { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    issuingOrganization: c.issuing_organization,
    credentialId: c.credential_id,
    issueDate: c.issue_date,
    expiryDate: c.expiry_date,
    documentUrl: c.document_url,
    verified: c.verified || false,
    verifiedAt: c.verified_at,
  }));
}

// =============================================================================
// BACKGROUND CHECK INTEGRATION (Checkr example)
// =============================================================================

/**
 * Initiate background check via Checkr
 * In production, this would call the actual Checkr API
 */
export async function initiateBackgroundCheck(
  tutorUserId: string,
  candidateInfo: {
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    ssn?: string; // Should be encrypted/tokenized
  }
): Promise<{ checkId: string; inviteUrl: string } | null> {
  // In production: Call Checkr API to create candidate and initiate check
  // const checkr = new CheckrClient(process.env.CHECKR_API_KEY);
  // const candidate = await checkr.createCandidate(candidateInfo);
  // const invitation = await checkr.createInvitation(candidate.id, 'basic_criminal');

  // For now, create a pending verification
  const result = await startVerification(tutorUserId, 'background_check', 'checkr');

  if (!result) return null;

  // Return mock data (in production, return actual Checkr invite URL)
  return {
    checkId: result.verificationId,
    inviteUrl: `https://checkr.com/apply?verification=${result.verificationId}`,
  };
}

/**
 * Handle background check webhook (from Checkr)
 */
export async function handleBackgroundCheckWebhook(
  externalId: string,
  status: 'clear' | 'consider' | 'suspended',
  reportData: Record<string, unknown>
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  // Find verification by external ID
  const { data: verification } = await supabaseAdmin
    .from('tutor_verifications')
    .select('id, tutor_user_id')
    .eq('external_id', externalId)
    .single();

  if (!verification) {
    console.error('Verification not found for external ID:', externalId);
    return false;
  }

  const passed = status === 'clear';

  await supabaseAdmin
    .from('tutor_verifications')
    .update({
      status: passed ? 'approved' : 'rejected',
      passed,
      result_data: reportData,
      verified_at: new Date().toISOString(),
      // Background checks typically valid for 1 year
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', verification.id);

  await updateTutorVerificationStatus(verification.tutor_user_id);

  return true;
}
