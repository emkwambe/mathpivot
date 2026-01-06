/**
 * MathPivot Certification Engine
 *
 * Comprehensive certification system for students and tutors including:
 * - Skill-based certifications
 * - Career pathway certifications (Actuarial, Data Science, etc.)
 * - Competition readiness certifications
 * - Tutor qualifications
 *
 * Features:
 * - Flexible requirements engine
 * - Adaptive assessments with multiple question types
 * - Digital badges (Open Badges 2.0 compatible)
 * - PDF certificate generation
 * - Public verification system
 * - LinkedIn sharing integration
 */

// Requirements Engine
export {
  checkRequirements,
  updateProgress,
  getUserProgress,
  type RequirementType,
  type Requirement,
  type RequirementResult,
  type RequirementsCheckResult,
} from './requirements';

// Assessment System
export {
  getAssessment,
  getAssessmentsForProgram,
  canStartAttempt,
  startAttempt,
  saveResponse,
  submitAttempt,
  getAttemptHistory,
  manualGrade,
  type QuestionType,
  type AssessmentType,
  type Assessment,
  type Question,
  type AttemptResponse,
  type AttemptResult,
} from './assessments';

// Credential Issuance
export {
  issueCertification,
  revokeCertification,
  renewCertification,
  getUserCertifications,
  getCertificationByCredential,
  getCertificationByToken,
  generateCertificateHTML,
  generateBadgeAssertion,
  generateBadgeClass,
  generateIssuerProfile,
  getLinkedInShareUrl,
  updateSharingPreferences,
  type CertificationProgram,
  type UserCertification,
  type IssueCertificationResult,
} from './credentials';

// Verification System
export {
  verifyByToken,
  verifyByCredentialNumber,
  batchVerify,
  getVerificationHistory,
  getVerificationStats,
  getQRCodeUrl,
  getVerificationPageUrl,
  getEmbeddableBadgeHtml,
  getMarkdownBadge,
  type VerificationResult,
} from './verification';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';

/**
 * Get all active certification programs
 */
export async function getCertificationPrograms(options?: {
  type?: string;
  category?: string;
  level?: string;
  targetAudience?: 'student' | 'tutor' | 'both';
}): Promise<{
  id: string;
  code: string;
  name: string;
  description: string | null;
  short_description: string | null;
  cert_type: string;
  level: string;
  category: string | null;
  badge_image_url: string | null;
  estimated_hours: number | null;
  difficulty_rating: number | null;
  is_free: boolean;
  price_cents: number;
}[]> {
  if (!isAdminConfigured()) return [];

  let query = supabaseAdmin
    .from('certification_programs')
    .select(`
      id,
      code,
      name,
      description,
      short_description,
      cert_type,
      level,
      category,
      badge_image_url,
      estimated_hours,
      difficulty_rating,
      is_free,
      price_cents
    `)
    .eq('is_active', true)
    .order('display_order');

  if (options?.type) {
    query = query.eq('cert_type', options.type);
  }
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.level) {
    query = query.eq('level', options.level);
  }
  if (options?.targetAudience) {
    query = query.or(`target_audience.eq.${options.targetAudience},target_audience.eq.both`);
  }

  const { data } = await query;
  return data || [];
}

/**
 * Get certification program by ID or code
 */
export async function getCertificationProgram(idOrCode: string): Promise<{
  id: string;
  code: string;
  name: string;
  description: string | null;
  cert_type: string;
  level: string;
  category: string | null;
  badge_image_url: string | null;
  badge_color: string;
  estimated_hours: number | null;
  difficulty_rating: number | null;
  validity_months: number | null;
  is_free: boolean;
  price_cents: number;
  prerequisite_program_ids: string[];
} | null> {
  if (!isAdminConfigured()) return null;

  // Try by ID first, then by code
  let { data } = await supabaseAdmin
    .from('certification_programs')
    .select('*')
    .eq('id', idOrCode)
    .eq('is_active', true)
    .single();

  if (!data) {
    const result = await supabaseAdmin
      .from('certification_programs')
      .select('*')
      .eq('code', idOrCode)
      .eq('is_active', true)
      .single();
    data = result.data;
  }

  return data;
}

/**
 * Get featured certifications
 */
export async function getFeaturedCertifications(): Promise<{
  id: string;
  code: string;
  name: string;
  short_description: string | null;
  level: string;
  badge_image_url: string | null;
}[]> {
  if (!isAdminConfigured()) return [];

  const { data } = await supabaseAdmin
    .from('certification_programs')
    .select('id, code, name, short_description, level, badge_image_url')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order')
    .limit(6);

  return data || [];
}

/**
 * Get certification categories
 */
export async function getCertificationCategories(): Promise<string[]> {
  if (!isAdminConfigured()) return [];

  const { data } = await supabaseAdmin
    .from('certification_programs')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null);

  const categories = new Set(data?.map(d => d.category).filter(Boolean) as string[]);
  return Array.from(categories).sort();
}

/**
 * Check if user has earned a specific certification
 */
export async function hasEarnedCertification(
  userId: string,
  programIdOrCode: string
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const program = await getCertificationProgram(programIdOrCode);
  if (!program) return false;

  const { data } = await supabaseAdmin
    .from('user_certifications')
    .select('id')
    .eq('user_id', userId)
    .eq('program_id', program.id)
    .eq('status', 'active')
    .single();

  return !!data;
}

/**
 * Get user's certification dashboard data
 */
export async function getCertificationDashboard(userId: string): Promise<{
  earned: number;
  in_progress: number;
  available: number;
  recent_certifications: {
    id: string;
    program_name: string;
    earned_at: string;
    badge_image_url: string | null;
  }[];
  current_progress: {
    program_id: string;
    program_name: string;
    completion_percentage: number;
  }[];
}> {
  if (!isAdminConfigured()) {
    return {
      earned: 0,
      in_progress: 0,
      available: 0,
      recent_certifications: [],
      current_progress: [],
    };
  }

  // Count earned
  const { count: earned } = await supabaseAdmin
    .from('user_certifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Count in progress
  const { count: inProgress } = await supabaseAdmin
    .from('user_certification_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['in_progress', 'ready_for_cert']);

  // Count available (active programs)
  const { count: available } = await supabaseAdmin
    .from('certification_programs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Recent certifications
  const { data: recentCerts } = await supabaseAdmin
    .from('user_certifications')
    .select(`
      id,
      earned_at,
      badge_image_url,
      program:certification_programs(name)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('earned_at', { ascending: false })
    .limit(5);

  // Current progress
  const { data: progress } = await supabaseAdmin
    .from('user_certification_progress')
    .select(`
      program_id,
      completion_percentage,
      program:certification_programs(name)
    `)
    .eq('user_id', userId)
    .in('status', ['in_progress', 'ready_for_cert'])
    .order('last_activity_at', { ascending: false })
    .limit(5);

  return {
    earned: earned || 0,
    in_progress: inProgress || 0,
    available: available || 0,
    recent_certifications: (recentCerts || []).map(c => ({
      id: c.id,
      program_name: (c.program as unknown as { name: string })?.name || '',
      earned_at: c.earned_at,
      badge_image_url: c.badge_image_url,
    })),
    current_progress: (progress || []).map(p => ({
      program_id: p.program_id,
      program_name: (p.program as unknown as { name: string })?.name || '',
      completion_percentage: p.completion_percentage,
    })),
  };
}
