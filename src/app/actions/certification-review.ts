"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CertificationApplicationRow {
  id: string;
  coach_id: string;
  tier: "certified" | "master";
  status: "pending" | "under_review" | "approved" | "denied" | "revoked";
  modules_completed: number | null;
  modules_required: number | null;
  practicum_hours: number | null;
  practicum_required: number | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  certified_at: string | null;
  expires_at: string | null;
  coach_name: string | null;
  coach_email: string | null;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;
  return user;
}

export async function listCertificationApplications(statusFilter?: string) {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = await createClient();
  let query = supabase
    .from("certification_applications")
    .select(
      `
      id, coach_id, tier, status,
      modules_completed, modules_required,
      practicum_hours, practicum_required,
      submitted_at, reviewed_by, reviewed_at, review_notes,
      certified_at, expires_at,
      users_profile:coach_id ( full_name, email )
      `,
    )
    .order("submitted_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;

  return (data ?? []).map((row) => flattenRow(row));
}

export async function getCertificationApplication(id: string) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("certification_applications")
    .select(
      `
      id, coach_id, tier, status,
      modules_completed, modules_required,
      practicum_hours, practicum_required,
      submitted_at, reviewed_by, reviewed_at, review_notes,
      certified_at, expires_at,
      users_profile:coach_id ( full_name, email )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return flattenRow(data);
}

// Supabase can return the joined users_profile as either an object or an
// array (depends on the schema cache's view of the FK relationship). Cast
// through unknown so TypeScript accepts both shapes at compile time.
type RawRow = Omit<
  CertificationApplicationRow,
  "coach_name" | "coach_email"
> & {
  users_profile:
    | { full_name: string; email: string }
    | { full_name: string; email: string }[]
    | null;
};

function flattenRow(row: unknown): CertificationApplicationRow {
  const r = row as RawRow;
  const profile = Array.isArray(r.users_profile)
    ? r.users_profile[0]
    : r.users_profile;
  const { users_profile: _unused, ...rest } = r;
  void _unused;
  return {
    ...rest,
    coach_name: profile?.full_name ?? null,
    coach_email: profile?.email ?? null,
  };
}

// Move to under_review — signals to the coach that the app has been picked up.
export async function markUnderReview(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("certification_applications")
    .update({
      status: "under_review",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/certification-reviews");
  revalidatePath(`/admin/certification-reviews/${id}`);
  return { success: true };
}

// Approve certification. Sets certified_at, and expires_at one year out
// (annual re-certification cadence). Marks the coach's onboarding
// "Earn Certified Coach status" step complete implicitly through the
// existing check in /tutor/onboarding.
export async function approveCertification(id: string, notes?: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const now = new Date();
  const expires = new Date(now);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);

  const { error } = await supabase
    .from("certification_applications")
    .update({
      status: "approved",
      reviewed_by: admin.id,
      reviewed_at: now.toISOString(),
      review_notes: notes ?? null,
      certified_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/certification-reviews");
  revalidatePath(`/admin/certification-reviews/${id}`);
  revalidatePath("/admin/coach-applications");
  return { success: true };
}

export async function denyCertification(id: string, notes: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };
  if (!notes || notes.trim().length < 3) {
    return {
      success: false,
      error: "Please explain what needs to change before reapplying.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("certification_applications")
    .update({
      status: "denied",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes.trim(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/certification-reviews");
  revalidatePath(`/admin/certification-reviews/${id}`);
  return { success: true };
}

// Revoke a previously approved certification. Used when a coach has
// violated Code of Conduct, failed calibration, or otherwise lost
// standing. Records a required reason for auditability.
export async function revokeCertification(id: string, notes: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };
  if (!notes || notes.trim().length < 3) {
    return { success: false, error: "A revocation reason is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("certification_applications")
    .update({
      status: "revoked",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes.trim(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/certification-reviews");
  revalidatePath(`/admin/certification-reviews/${id}`);
  return { success: true };
}

// Compact snapshot of a coach's training progress for the review page.
export async function getCoachTrainingSnapshot(coachId: string, tier: string) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = await createClient();

  const [{ data: modules }, { data: progress }] = await Promise.all([
    supabase
      .from("training_modules")
      .select("id, slug, title, sort_order, estimated_minutes, is_required")
      .eq("certification_tier", tier)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("coach_training_progress")
      .select("module_id, status, score, completed_at")
      .eq("coach_id", coachId),
  ]);

  const progressMap = new Map((progress ?? []).map((p) => [p.module_id, p]));

  return (modules ?? []).map((m) => {
    const p = progressMap.get(m.id);
    return {
      slug: m.slug as string,
      title: m.title as string,
      sortOrder: m.sort_order as number,
      minutes: m.estimated_minutes as number,
      isRequired: m.is_required as boolean,
      status: (p?.status as string) ?? "not_started",
      score: (p?.score as number | null) ?? null,
      completedAt: (p?.completed_at as string | null) ?? null,
    };
  });
}
