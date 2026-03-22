/**
 * Database types for MathPivot TutorOS
 * These types mirror the Supabase database schema
 */

export type UserRole = 'super_admin' | 'admin' | 'tutor' | 'parent' | 'student';

// Guide Model Types
export type GuideLevel = 'Guide I' | 'Guide II' | 'Guide III';

export type GuideLevelCode = 'GUIDE_I' | 'GUIDE_II' | 'GUIDE_III' | 'GUIDE_SPECIALIST';

export type EligibilityTier = 'TIER_1_EXPLORER' | 'TIER_2_DEVELOPER' | 'TIER_3_ACCELERATOR' | 'NOT_ELIGIBLE';

export type ProgramType = 'package' | 'subscription' | 'cohort' | 'accelerator' | 'fellowship' | 'elite';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'canceled' | 'no_show';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'canceled';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'no_show';

export type MasteryLevel = 'not_started' | 'developing' | 'proficient' | 'mastered';

export type SkillExposure = 'introduced' | 'practiced' | 'assessed';

export type HomeworkStatus = 'assigned' | 'submitted' | 'reviewed';

export type ProductType = 'package' | 'subscription';

export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type CreditTransactionType = 'purchase' | 'session_debit' | 'refund' | 'adjustment' | 'expiry';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'canceled';

export type Modality = 'online' | 'in_person';

export type CourseTrack = 'math_1' | 'math_2' | 'math_3' | 'pre_calc' | 'ap_calc_ab' | 'ap_calc_bc' | 'ap_stats';

// Database Tables
export interface UsersProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  primary_parent_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  member_role: 'parent' | 'student';
  created_at: string;
}

export interface StudentsProfile {
  user_id: string;
  family_id: string;
  grade: number;
  course_track: CourseTrack;
  goals: string | null;
  notes: string | null;
  baseline_diagnostic_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TutorsProfile {
  user_id: string;
  bio: string | null;
  specialties: string[];
  timezone: string;
  is_active: boolean;
  hourly_rate: number | null;
  // Guide model fields
  guide_level: GuideLevel | null;
  guide_level_code: GuideLevelCode | null;
  career_pathway_specializations: string[] | null;
  eligible_grades: number[] | null;
  max_concurrent_students: number;
  guide_certified_at: string | null;
  guide_certification_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  tutor_user_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityException {
  id: string;
  tutor_user_id: string;
  exception_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  family_id: string;
  student_user_id: string;
  parent_user_id: string;
  tutor_user_id: string;
  start_at: string;
  end_at: string;
  modality: Modality;
  status: BookingStatus;
  notes: string | null;
  video_link: string | null;
  calendar_invite_sent: boolean;
  canceled_at: string | null;
  canceled_by: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  booking_id: string;
  status: SessionStatus;
  attendance_status: AttendanceStatus | null;
  started_at: string | null;
  completed_at: string | null;
  internal_notes: string | null;
  parent_summary: string | null;
  next_steps: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionAttachment {
  id: string;
  session_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface SessionWhiteboard {
  id: string;
  session_id: string;
  elements: unknown[]; // Excalidraw elements array
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Whiteboard {
  id: string;
  tutor_user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  elements: unknown[]; // Excalidraw elements array
  is_public: boolean;
  tags: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  course_track: CourseTrack;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SessionSkill {
  id: string;
  session_id: string;
  skill_id: string;
  exposure_level: SkillExposure;
  notes: string | null;
  created_at: string;
}

export interface StudentSkillMastery {
  id: string;
  student_user_id: string;
  skill_id: string;
  mastery_level: MasteryLevel;
  last_practiced_at: string | null;
  updated_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Diagnostic {
  id: string;
  student_user_id: string;
  administered_by_user_id: string;
  administered_at: string;
  course_track: CourseTrack;
  score: number | null;
  max_score: number | null;
  results_json: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

export interface HomeworkItem {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: HomeworkStatus;
  submission_text: string | null;
  submission_file_path: string | null;
  submitted_at: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  product_type: ProgramType;
  credits: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  // Guide model fields
  guide_level_required: GuideLevelCode | null;
  eligibility_tier_required: EligibilityTier | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  family_id: string;
  parent_user_id: string;
  product_id: string;
  amount_cents: number;
  currency: string;
  status: PurchaseStatus;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditLedger {
  id: string;
  family_id: string;
  transaction_type: CreditTransactionType;
  amount: number; // positive for credit, negative for debit
  balance_after: number;
  reference_type: string | null; // 'purchase', 'session', etc.
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  notification_type: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  template_key: string;
  payload_json: Record<string, unknown>;
  status: NotificationStatus;
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  type: string;
  actor_user_id: string | null;
  subject_type: string;
  subject_id: string;
  data: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface StripeWebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  payload_json: Record<string, unknown>;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  student_user_id: string;
  family_id: string;
  week_start: string;
  week_end: string;
  sessions_count: number;
  attendance_rate: number | null;
  skills_practiced: string[];
  mastery_changes: Record<string, unknown>[];
  summary_text: string | null;
  recommendations: string | null;
  is_at_risk: boolean;
  at_risk_reasons: string[];
  generated_at: string;
  sent_at: string | null;
  created_at: string;
}

export interface Waitlist {
  id: string;
  family_id: string;
  student_user_id: string;
  parent_user_id: string;
  tutor_user_id: string | null;
  preferred_date: string;
  preferred_start_time: string;
  preferred_end_time: string;
  modality: Modality;
  status: 'waiting' | 'notified' | 'booked' | 'expired';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// GUIDE MODEL TYPES
// =============================================================================

export interface GuideLevelDefinition {
  id: string;
  level_code: GuideLevelCode;
  name: string;
  description: string | null;
  coach_focus_percent: number;
  mentor_focus_percent: number;
  min_experience_years: number;
  required_certifications: string[] | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  max_students: number | null;
  training_hours_required: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StudentEligibilityProfile {
  id: string;
  student_id: string;
  assessment_date: string;
  // 5-Factor Assessment Scores (1-5 each)
  academic_performance: number | null;
  math_passion: number | null;
  achievement_level: number | null;
  career_direction: number | null;
  personal_qualities: number | null;
  // Computed total (5-25)
  total_score: number;
  notes: string | null;
  assessed_by: string | null;
  next_assessment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramGuide {
  id: string;
  program_id: string;
  guide_level_code: GuideLevelCode;
  min_guides_required: number;
  max_guides_allowed: number | null;
  guide_student_ratio: number | null;
  created_at: string;
}

export interface GuideCompensationPlan {
  id: string;
  guide_level_code: GuideLevelCode;
  base_rate_per_hour: number;
  commission_percent: number | null;
  session_bonus: number | null;
  retention_bonus: number | null;
  outcome_bonus_rules: Record<string, number> | null;
  health_stipend: number | null;
  training_budget: number | null;
  technology_allowance: number | null;
  effective_date: string;
  expiration_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentPathwayRecommendation {
  id: string;
  student_id: string;
  pathway_id: string;
  recommended_guide_level: GuideLevelCode | null;
  confidence_score: number | null;
  reason_codes: string[] | null;
  suggested_programs: string[] | null;
  recommended_start_date: string | null;
  estimated_completion_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface CareerPathway {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  color: string | null;
  target_grades: number[] | null;
  guide_specializations: GuideLevel[] | null;
  min_guide_level: GuideLevel | null;
  prerequisite_tracks: CourseTrack[] | null;
  career_outcomes: string[] | null;
  certifications: string[] | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Helper function to get eligibility tier from score
export function getEligibilityTier(score: number): EligibilityTier {
  if (score >= 23) return 'TIER_3_ACCELERATOR';
  if (score >= 20) return 'TIER_2_DEVELOPER';
  if (score >= 16) return 'TIER_1_EXPLORER';
  return 'NOT_ELIGIBLE';
}

// Helper to get tier display name
export function getEligibilityTierName(tier: EligibilityTier): string {
  switch (tier) {
    case 'TIER_3_ACCELERATOR': return 'Accelerator';
    case 'TIER_2_DEVELOPER': return 'Developer';
    case 'TIER_1_EXPLORER': return 'Explorer';
    case 'NOT_ELIGIBLE': return 'Not Eligible';
  }
}

// Helper to get guide level display info
export function getGuideLevelInfo(code: GuideLevelCode): { name: string; coachPercent: number; mentorPercent: number } {
  switch (code) {
    case 'GUIDE_I': return { name: 'Guide I', coachPercent: 80, mentorPercent: 20 };
    case 'GUIDE_II': return { name: 'Guide II', coachPercent: 50, mentorPercent: 50 };
    case 'GUIDE_III': return { name: 'Guide III', coachPercent: 20, mentorPercent: 80 };
    case 'GUIDE_SPECIALIST': return { name: 'Specialist', coachPercent: 30, mentorPercent: 70 };
  }
}

// Joined/Extended types for UI
export interface BookingWithDetails extends Booking {
  student?: StudentsProfile & { user: UsersProfile };
  tutor?: TutorsProfile & { user: UsersProfile };
  session?: Session;
}

export interface SessionWithDetails extends Session {
  booking: BookingWithDetails;
  skills?: (SessionSkill & { skill: Skill })[];
  homework?: HomeworkItem[];
  attachments?: SessionAttachment[];
}

export interface StudentWithMastery extends StudentsProfile {
  user: UsersProfile;
  mastery: (StudentSkillMastery & { skill: Skill })[];
  diagnostics: Diagnostic[];
}

// Event Types (domain.action.v1 format)
export type EventType =
  // Booking events
  | 'booking.created.v1'
  | 'booking.confirmed.v1'
  | 'booking.rescheduled.v1'
  | 'booking.canceled.v1'
  | 'booking.reminder_scheduled.v1'
  | 'booking.reminder_sent.v1'
  | 'booking.no_show_marked.v1'
  // Session events
  | 'session.started.v1'
  | 'session.completed.v1'
  | 'session.notes_saved.v1'
  | 'session.summary_published.v1'
  // Homework events
  | 'session.homework_assigned.v1'
  | 'session.homework_submitted.v1'
  | 'session.homework_reviewed.v1'
  // Mastery events
  | 'mastery.skill_tagged_in_session.v1'
  | 'mastery.level_updated.v1'
  | 'diagnostic.completed.v1'
  // Payment events
  | 'payment.purchase_initiated.v1'
  | 'payment.succeeded.v1'
  | 'payment.failed.v1'
  | 'payment.refunded.v1'
  | 'credits.added.v1'
  | 'credits.debited.v1'
  // Communication events
  | 'comm.session_summary_sent.v1'
  | 'comm.weekly_report_generated.v1'
  | 'comm.weekly_report_sent.v1'
  | 'comm.at_risk_alert_generated.v1'
  | 'comm.at_risk_alert_sent.v1'
  // System events
  | 'system.job_failed.v1'
  | 'system.dead_lettered.v1';
