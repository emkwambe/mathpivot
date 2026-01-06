/**
 * Database types for MathPivot TutorOS
 * These types mirror the Supabase database schema
 */

export type UserRole = 'admin' | 'tutor' | 'parent' | 'student';

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
  product_type: ProductType;
  credits: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
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
