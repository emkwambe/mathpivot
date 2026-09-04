"use server";

import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CoachApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  applicant_role: string | null;
  years_teaching: number | null;
  specialties: string[];
  resume_url: string | null;
  linkedin_url: string | null;
  why_mathpivot: string | null;
  availability: string | null;
  status:
    | "submitted"
    | "screening"
    | "interview_scheduled"
    | "approved"
    | "denied"
    | "withdrawn"
    | "accepted";
  admin_notes: string | null;
  denied_reason: string | null;
  reviewed_at: string | null;
  invite_token: string | null;
  invited_at: string | null;
  user_id: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitApplicationInput {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  currentRole?: string;
  yearsTeaching?: number;
  specialties?: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  whyMathpivot?: string;
  availability?: string;
}

// Public — anyone can submit an application from /coach-apply.
export async function submitCoachApplication(input: SubmitApplicationInput) {
  const supabase = await createClient();

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }
  if (!input.fullName || input.fullName.trim().length < 2) {
    return { success: false, error: "Please provide your full name." };
  }

  // Reject duplicate email — the applicant can update their existing
  // submission by re-applying (upsert semantics keep things simple in v1).
  const { error } = await supabase.from("coach_applications").upsert(
    {
      full_name: input.fullName.trim(),
      email,
      phone: input.phone?.trim() || null,
      location: input.location?.trim() || null,
      applicant_role: input.currentRole?.trim() || null,
      years_teaching: input.yearsTeaching ?? null,
      specialties: input.specialties?.filter(Boolean) ?? [],
      resume_url: input.resumeUrl?.trim() || null,
      linkedin_url: input.linkedinUrl?.trim() || null,
      why_mathpivot: input.whyMathpivot?.trim() || null,
      availability: input.availability?.trim() || null,
    },
    { onConflict: "email" },
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;
  return user;
}

export async function listCoachApplications(statusFilter?: string) {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = await createClient();
  let query = supabase
    .from("coach_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  const { data } = await query;
  return (data ?? []) as CoachApplication[];
}

export async function getCoachApplication(id: string) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as CoachApplication | null) ?? null;
}

export async function updateApplicationStatus(
  id: string,
  status: CoachApplication["status"],
  extra?: { adminNotes?: string; deniedReason?: string },
) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_applications")
    .update({
      status,
      admin_notes: extra?.adminNotes ?? undefined,
      denied_reason: extra?.deniedReason ?? undefined,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/coach-applications");
  revalidatePath(`/admin/coach-applications/${id}`);
  return { success: true };
}

// Approve + generate invitation token. The admin then copies the
// resulting URL and sends it to the applicant (email integration comes
// later). The applicant clicks the URL, signs up (or signs in), and the
// accept flow links the resulting user to this application.
export async function approveAndInvite(id: string, adminNotes?: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("coach_applications")
    .select("invite_token, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { success: false, error: "Application not found" };

  // Reuse an existing token so re-clicking Approve does not invalidate a
  // link the admin already sent.
  const token = existing.invite_token ?? randomBytes(24).toString("hex");

  const { error } = await supabase
    .from("coach_applications")
    .update({
      status: "approved",
      invite_token: token,
      invited_at: new Date().toISOString(),
      invited_by: admin.id,
      admin_notes: adminNotes ?? undefined,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/coach-applications");
  revalidatePath(`/admin/coach-applications/${id}`);
  return { success: true, inviteToken: token };
}

export interface CreateApplicationForExistingUserInput {
  userId: string;
  fullName: string;
  email: string;
}

// Test-path shortcut: admin creates an application for a user who already
// has an account, immediately approves it, and links them. Used to walk
// the founder through the flow without needing a second real email.
export async function createAndAcceptForExistingUser(
  input: CreateApplicationForExistingUserInput,
) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();

  const email = input.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("coach_applications")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const token = randomBytes(24).toString("hex");

  const upsertPayload = {
    full_name: input.fullName.trim(),
    email,
    status: "accepted" as const,
    admin_notes: "Created for existing user (self-onboarding test).",
    reviewed_by: admin.id,
    reviewed_at: nowIso,
    invite_token: token,
    invited_at: nowIso,
    invited_by: admin.id,
    user_id: input.userId,
    accepted_at: nowIso,
  };

  const upsert = await supabase
    .from("coach_applications")
    .upsert(upsertPayload, { onConflict: "email" })
    .select("id")
    .single();

  if (upsert.error) return { success: false, error: upsert.error.message };

  const applicationId = upsert.data?.id ?? existing?.id;

  // Ensure the user's role is 'tutor' unless they are already an admin.
  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", input.userId)
    .maybeSingle();

  if (profile && profile.role !== "admin" && profile.role !== "super_admin") {
    await supabase
      .from("users_profile")
      .update({ role: "tutor" })
      .eq("id", input.userId);
  }

  // Ensure onboarding row exists.
  await supabase.from("coach_onboarding_progress").upsert(
    {
      coach_id: input.userId,
      application_id: applicationId,
    },
    { onConflict: "coach_id" },
  );

  revalidatePath("/admin/coach-applications");
  return { success: true, applicationId };
}
