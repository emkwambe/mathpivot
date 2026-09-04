"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CODE_OF_CONDUCT_VERSION } from "@/lib/coach-onboarding/code-of-conduct";

export interface OnboardingProgress {
  id: string;
  coach_id: string;
  application_id: string | null;
  background_check_attested: boolean;
  background_check_attested_at: string | null;
  background_check_provider: string | null;
  background_check_completed_on: string | null;
  code_of_conduct_accepted: boolean;
  code_of_conduct_accepted_at: string | null;
  code_of_conduct_version: string | null;
  admin_verified_background: boolean;
  admin_verified_background_at: string | null;
  admin_verification_notes: string | null;
  activated: boolean;
  activated_at: string | null;
}

async function requireCoach() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "tutor") return null;
  return user;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;
  return user;
}

export async function getOnboardingForCoach(
  coachId: string,
): Promise<OnboardingProgress | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_onboarding_progress")
    .select("*")
    .eq("coach_id", coachId)
    .maybeSingle();
  return (data as OnboardingProgress | null) ?? null;
}

export async function getMyOnboarding() {
  const coach = await requireCoach();
  if (!coach) return null;
  return getOnboardingForCoach(coach.id);
}

// Ensures an onboarding row exists for the current coach. Called from
// the /tutor/onboarding page on first visit so a coach who signed up
// before the invite-accept path was hit still gets a row.
export async function ensureOnboardingRow() {
  const coach = await requireCoach();
  if (!coach) return { success: false };

  const supabase = await createClient();
  const existing = await getOnboardingForCoach(coach.id);
  if (existing) return { success: true, created: false };

  await supabase.from("coach_onboarding_progress").insert({
    coach_id: coach.id,
  });
  return { success: true, created: true };
}

export interface AttestBackgroundInput {
  provider: string;
  completedOn: string; // YYYY-MM-DD
}

export async function attestBackgroundCheck(input: AttestBackgroundInput) {
  const coach = await requireCoach();
  if (!coach) return { success: false, error: "Not authorized" };

  const provider = input.provider.trim();
  if (!provider) {
    return { success: false, error: "Provider name is required." };
  }
  if (!input.completedOn) {
    return { success: false, error: "Completion date is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_onboarding_progress")
    .update({
      background_check_attested: true,
      background_check_attested_at: new Date().toISOString(),
      background_check_provider: provider,
      background_check_completed_on: input.completedOn,
    })
    .eq("coach_id", coach.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/tutor/onboarding");
  return { success: true };
}

export async function acceptCodeOfConduct() {
  const coach = await requireCoach();
  if (!coach) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_onboarding_progress")
    .update({
      code_of_conduct_accepted: true,
      code_of_conduct_accepted_at: new Date().toISOString(),
      code_of_conduct_version: CODE_OF_CONDUCT_VERSION,
    })
    .eq("coach_id", coach.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/tutor/onboarding");
  return { success: true };
}

export async function adminVerifyBackground(coachId: string, notes?: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_onboarding_progress")
    .update({
      admin_verified_background: true,
      admin_verified_background_at: new Date().toISOString(),
      admin_verified_background_by: admin.id,
      admin_verification_notes: notes ?? null,
    })
    .eq("coach_id", coachId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/coach-applications`);
  revalidatePath(`/admin/coaches/${coachId}`);
  return { success: true };
}

export async function adminActivateCoach(coachId: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();

  // Gate: coach must have completed attestations + admin verification.
  // Certified Coach status (approved certification_application) is also
  // required — check that too.
  const [{ data: onboarding }, { data: certApp }] = await Promise.all([
    supabase
      .from("coach_onboarding_progress")
      .select("*")
      .eq("coach_id", coachId)
      .maybeSingle(),
    supabase
      .from("certification_applications")
      .select("id, status")
      .eq("coach_id", coachId)
      .eq("tier", "certified")
      .in("status", ["approved"])
      .maybeSingle(),
  ]);

  if (!onboarding) {
    return { success: false, error: "No onboarding record found." };
  }
  if (!onboarding.background_check_attested) {
    return {
      success: false,
      error: "Coach has not attested to background check.",
    };
  }
  if (!onboarding.admin_verified_background) {
    return {
      success: false,
      error: "Admin has not verified the background check.",
    };
  }
  if (!onboarding.code_of_conduct_accepted) {
    return {
      success: false,
      error: "Coach has not accepted the Code of Conduct.",
    };
  }
  if (!certApp) {
    return {
      success: false,
      error: "Coach must hold an approved Certified Coach certification.",
    };
  }

  const { error } = await supabase
    .from("coach_onboarding_progress")
    .update({
      activated: true,
      activated_at: new Date().toISOString(),
      activated_by: admin.id,
    })
    .eq("coach_id", coachId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/coach-applications");
  return { success: true };
}

// Called from /coach-apply/accept/[token] once the applicant is signed
// in. Links their user_id to the application, sets tutor role (never
// overwriting an admin role), and creates their onboarding row.
export async function acceptInvitation(token: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Please sign in first." };

  const supabase = await createClient();

  const { data: application } = await supabase
    .from("coach_applications")
    .select("id, email, status, user_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (!application) {
    return { success: false, error: "Invitation not found or expired." };
  }
  if (application.status !== "approved" && application.status !== "accepted") {
    return { success: false, error: "This invitation is no longer valid." };
  }
  if (application.user_id && application.user_id !== user.id) {
    return {
      success: false,
      error: "This invitation was already accepted by a different account.",
    };
  }
  if (application.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return {
      success: false,
      error: `This invitation was sent to ${application.email}. Sign in with that email address.`,
    };
  }

  // Never overwrite an existing admin role.
  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.role !== "admin" && profile.role !== "super_admin") {
    await supabase
      .from("users_profile")
      .update({ role: "tutor" })
      .eq("id", user.id);
  }

  await supabase
    .from("coach_applications")
    .update({
      status: "accepted",
      user_id: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", application.id);

  await supabase.from("coach_onboarding_progress").upsert(
    {
      coach_id: user.id,
      application_id: application.id,
    },
    { onConflict: "coach_id" },
  );

  return { success: true };
}
