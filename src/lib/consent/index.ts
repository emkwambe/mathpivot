/**
 * Parental Consent Management for MathPivot TutorOS
 * COPPA and FERPA compliant consent handling
 */

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import { logConsentEvent } from '@/lib/audit';
import { headers } from 'next/headers';
import crypto from 'crypto';

export type ConsentType =
  | 'account_creation'
  | 'data_collection'
  | 'photo_video'
  | 'marketing'
  | 'third_party_sharing'
  | 'competition_participation'
  | 'field_trip'
  | 'medical_treatment';

export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'revoked' | 'expired';

export interface ConsentTemplate {
  id: string;
  consentType: ConsentType;
  version: string;
  title: string;
  summary: string;
  fullText: string;
  requiresSignature: boolean;
  requiresCheckbox: boolean;
  minAgeWithoutParent: number;
  expiryDays: number | null;
}

export interface ConsentRecord {
  id: string;
  studentUserId: string;
  parentUserId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  version: string;
  respondedAt: string | null;
  expiresAt: string | null;
}

// =============================================================================
// CONSENT TEMPLATES
// =============================================================================

/**
 * Get active consent template for a type
 */
export async function getConsentTemplate(
  consentType: ConsentType
): Promise<ConsentTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('consent_templates')
    .select('*')
    .eq('consent_type', consentType)
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    consentType: data.consent_type,
    version: data.version,
    title: data.title,
    summary: data.summary,
    fullText: data.full_text,
    requiresSignature: data.requires_signature,
    requiresCheckbox: data.requires_checkbox,
    minAgeWithoutParent: data.min_age_without_parent,
    expiryDays: data.expiry_days,
  };
}

/**
 * Get all required consent types for a student
 */
export async function getRequiredConsents(studentUserId: string): Promise<ConsentType[]> {
  // These are always required
  const required: ConsentType[] = ['account_creation', 'data_collection'];

  // Additional consents may be required based on context
  // (e.g., photo_video for camps, competition_participation for competitions)

  return required;
}

// =============================================================================
// CONSENT RECORDS
// =============================================================================

/**
 * Request consent from parent
 */
export async function requestConsent(
  studentUserId: string,
  parentUserId: string,
  consentType: ConsentType
): Promise<{ consentId: string } | null> {
  if (!isAdminConfigured()) return null;

  // Get current template
  const template = await getConsentTemplate(consentType);
  if (!template) {
    console.error('No active consent template found for:', consentType);
    return null;
  }

  // Get student age
  const { data: student } = await supabaseAdmin
    .from('students_profile')
    .select('date_of_birth, family_id')
    .eq('user_id', studentUserId)
    .single();

  let studentAge: number | null = null;
  let isCoppaApplicable = false;
  const isFerpaApplicable = true; // Always true for educational records

  if (student?.date_of_birth) {
    const birthDate = new Date(student.date_of_birth);
    const today = new Date();
    studentAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      studentAge--;
    }
    isCoppaApplicable = studentAge < 13;
  }

  // Check if consent already exists
  const { data: existing } = await supabaseAdmin
    .from('parental_consents')
    .select('id, status')
    .eq('student_user_id', studentUserId)
    .eq('consent_type', consentType)
    .eq('consent_version', template.version)
    .single();

  if (existing && existing.status === 'granted') {
    return { consentId: existing.id };
  }

  // Calculate expiry
  const expiresAt = template.expiryDays
    ? new Date(Date.now() + template.expiryDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Create consent record
  const { data: consent, error } = await supabaseAdmin
    .from('parental_consents')
    .insert({
      student_user_id: studentUserId,
      parent_user_id: parentUserId,
      family_id: student?.family_id,
      consent_type: consentType,
      status: 'pending',
      student_age_at_consent: studentAge,
      is_coppa_applicable: isCoppaApplicable,
      is_ferpa_applicable: isFerpaApplicable,
      consent_version: template.version,
      consent_text_hash: crypto.createHash('sha256').update(template.fullText).digest('hex'),
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create consent request:', error);
    return null;
  }

  return { consentId: consent.id };
}

/**
 * Grant consent (parent action)
 */
export async function grantConsent(
  consentId: string,
  parentUserId: string,
  signatureData?: Record<string, unknown>
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  // Verify parent owns this consent request
  const { data: consent } = await supabaseAdmin
    .from('parental_consents')
    .select('*')
    .eq('id', consentId)
    .eq('parent_user_id', parentUserId)
    .eq('status', 'pending')
    .single();

  if (!consent) {
    console.error('Consent not found or not pending');
    return false;
  }

  // Get request context
  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const headersList = await headers();
    ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                headersList.get('x-real-ip');
    userAgent = headersList.get('user-agent');
  } catch {
    // Headers not available
  }

  const { error } = await supabaseAdmin
    .from('parental_consents')
    .update({
      status: 'granted',
      responded_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      signature_data: signatureData || { checkbox_confirmed: true, timestamp: new Date().toISOString() },
    })
    .eq('id', consentId);

  if (error) {
    console.error('Failed to grant consent:', error);
    return false;
  }

  await logConsentEvent(
    parentUserId,
    consent.student_user_id,
    consent.consent_type,
    true,
    consentId
  );

  return true;
}

/**
 * Revoke consent (parent action)
 */
export async function revokeConsent(
  consentId: string,
  parentUserId: string,
  reason?: string
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const { data: consent } = await supabaseAdmin
    .from('parental_consents')
    .select('student_user_id, consent_type')
    .eq('id', consentId)
    .eq('parent_user_id', parentUserId)
    .eq('status', 'granted')
    .single();

  if (!consent) {
    return false;
  }

  const { error } = await supabaseAdmin
    .from('parental_consents')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    })
    .eq('id', consentId);

  if (error) {
    return false;
  }

  await logConsentEvent(
    parentUserId,
    consent.student_user_id,
    consent.consent_type,
    false,
    consentId
  );

  return true;
}

/**
 * Check if student has valid consent
 */
export async function hasValidConsent(
  studentUserId: string,
  consentType: ConsentType
): Promise<boolean> {
  if (!isAdminConfigured()) return true; // Allow in dev

  // Check if student is 18+ (doesn't need parental consent)
  const { data: student } = await supabaseAdmin
    .from('students_profile')
    .select('date_of_birth')
    .eq('user_id', studentUserId)
    .single();

  if (student?.date_of_birth) {
    const birthDate = new Date(student.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age >= 18) return true;
  }

  // Check for valid consent
  const { data: consent } = await supabaseAdmin
    .from('parental_consents')
    .select('id')
    .eq('student_user_id', studentUserId)
    .eq('consent_type', consentType)
    .eq('status', 'granted')
    .or('expires_at.is.null,expires_at.gt.now()')
    .limit(1)
    .single();

  return !!consent;
}

/**
 * Get all consents for a student
 */
export async function getStudentConsents(studentUserId: string): Promise<ConsentRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('parental_consents')
    .select('*')
    .eq('student_user_id', studentUserId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    studentUserId: c.student_user_id,
    parentUserId: c.parent_user_id,
    consentType: c.consent_type,
    status: c.status,
    version: c.consent_version,
    respondedAt: c.responded_at,
    expiresAt: c.expires_at,
  }));
}

/**
 * Get pending consents for a parent to approve
 */
export async function getPendingConsents(parentUserId: string): Promise<
  Array<ConsentRecord & { studentName: string; templateTitle: string }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('parental_consents')
    .select(`
      *,
      student:users_profile!student_user_id(full_name),
      template:consent_templates!inner(title)
    `)
    .eq('parent_user_id', parentUserId)
    .eq('status', 'pending');

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    studentUserId: c.student_user_id,
    parentUserId: c.parent_user_id,
    consentType: c.consent_type,
    status: c.status,
    version: c.consent_version,
    respondedAt: c.responded_at,
    expiresAt: c.expires_at,
    studentName: (c.student as { full_name: string })?.full_name || 'Student',
    templateTitle: (c.template as { title: string })?.title || c.consent_type,
  }));
}

/**
 * Check all required consents for a student
 */
export async function checkAllRequiredConsents(
  studentUserId: string
): Promise<{ allGranted: boolean; missing: ConsentType[] }> {
  const required = await getRequiredConsents(studentUserId);
  const missing: ConsentType[] = [];

  for (const consentType of required) {
    const hasConsent = await hasValidConsent(studentUserId, consentType);
    if (!hasConsent) {
      missing.push(consentType);
    }
  }

  return {
    allGranted: missing.length === 0,
    missing,
  };
}
