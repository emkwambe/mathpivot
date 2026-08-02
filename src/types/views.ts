/**
 * View model types for MathPivot TutorOS
 *
 * These types represent the shapes returned by Supabase queries with
 * joins/relations — the actual data shapes used in dashboard pages
 * and client components. Separated from database.ts (raw row types)
 * to maintain clarity between storage and presentation layers.
 */

// ============================================================
// INVOICES
// ============================================================

/** Admin invoice list view (with family/parent joins) */
export interface AdminInvoiceRow {
  id: string;
  invoice_number: string;
  status: string;
  total_cents: number;
  due_date: string | null;
  family?: { name: string } | null;
  parent?: { full_name: string } | null;
}

/** Parent invoice view (own invoices) */
export interface ParentInvoiceRow {
  id: string;
  invoice_number: string;
  issued_at: string | null;
  created_at: string;
  total_cents: number;
  due_date: string | null;
  status: string;
}

// ============================================================
// LEADS
// ============================================================

/** Full lead record (with assigned user join) */
export interface LeadRecord {
  id: string;
  status: string;
  parent_name: string;
  parent_email: string;
  score: number;
  student_name: string | null;
  student_grade: string | null;
  subjects_interested: string[] | null;
  source: string;
  goals: string | null;
  notes: string | null;
  assigned_user: { full_name: string } | null;
  next_follow_up_at: string | null;
  persona?: string;
  persona_confidence?: string | null;
}

/** Lead analytics source stats */
export interface LeadSourceStat {
  source: string;
  total: number;
  qualified: number;
  trials: number;
  converted: number;
  conversionRate: string;
}

// ============================================================
// PAYROLL
// ============================================================

/** Payout period (admin + tutor views) */
export interface PayoutPeriod {
  id: string;
  period_start: string;
  period_end: string;
  is_locked: boolean;
}

/** Payout row (admin view — with tutor join) */
export interface AdminPayoutRow {
  id: string;
  status: string;
  total_amount_cents: number;
  sessions_count: number;
  total_hours: number;
  tutor?: { full_name: string; email?: string } | null;
}

/** Payout row (tutor earnings view — with period join) */
export interface TutorPayoutRow {
  id: string;
  status: string;
  total_amount_cents: number;
  sessions_count: number;
  total_hours: number;
  period: { period_start: string; period_end: string } | null;
}

/** Tutor rate row */
export interface TutorRateRow {
  id: string;
  label: string;
  is_default: boolean;
  rate_cents: number;
  rate_type: string;
}

// ============================================================
// ROOMS
// ============================================================

/** Room record (admin view) */
export interface RoomRecord {
  id: string;
  name: string;
  room_type: string;
  capacity: number;
  is_active: boolean;
  is_virtual: boolean;
  location?: string | null;
  floor?: string | null;
  virtual_link?: string | null;
  notes?: string | null;
}

// ============================================================
// DROP-IN
// ============================================================

/** Drop-in attendance row (with student + slot joins) */
export interface DropInAttendanceRow {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  student: { full_name: string } | null;
  slot: { title: string } | null;
}

/** Drop-in slot row (with tutor + room joins) */
export interface DropInSlotRow {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  tutor: { full_name: string } | null;
  room: { name: string } | null;
  modality: string;
  max_concurrent: number;
}

// ============================================================
// USERS
// ============================================================

/** User record for admin user management */
export interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  phone?: string | null;
  timezone?: string | null;
}

// ============================================================
// PACKAGES
// ============================================================

/** Package record for admin management */
export interface PackageRecord {
  id: string;
  name: string;
  slug: string;
  service_tier: string;
  billing_type: string;
  price_cents: number;
  credits_per_period: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

// ============================================================
// IMPORT
// ============================================================

/** CSV import job row */
export interface ImportJobRow {
  id: string;
  file_name: string;
  entity_type: string;
  success_rows: number;
  error_rows: number;
  total_rows: number;
  status: string;
  created_at: string;
}

// ============================================================
// CODE PROBLEMS
// ============================================================

/** Code problem row (list view) */
export interface CodeProblemRow {
  id: string;
  title: string;
  difficulty: string;
  language: string;
  topic: string | null;
  test_cases: unknown[];
}

// ============================================================
// REFERRALS
// ============================================================

/** Referral row (parent view) */
export interface ReferralRow {
  id: string;
  status: string;
  referrer_reward_cents: number;
  referred_name: string;
  referred_email: string;
  created_at: string;
}
