"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CoachRosterRow } from "@/lib/coach-roster";

// Aggregated view of every coach's state. Joins users_profile (tutors)
// with coach_onboarding_progress, the most recent certified certification
// application, and their booking count. One admin page consumes this to
// show operational status at a glance.

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;
  return user;
}

export async function listCoaches(): Promise<CoachRosterRow[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = await createClient();

  const { data: tutors } = await supabase
    .from("users_profile")
    .select("id, full_name, email, avatar_url, created_at")
    .eq("role", "tutor")
    .order("created_at", { ascending: false });

  if (!tutors || tutors.length === 0) return [];
  const ids = tutors.map((t) => t.id);

  const [onboardingRes, certAppsRes, trainingRes, modulesRes, bookingsRes] =
    await Promise.all([
      supabase
        .from("coach_onboarding_progress")
        .select(
          "coach_id, background_check_attested, admin_verified_background, code_of_conduct_accepted, activated",
        )
        .in("coach_id", ids),
      supabase
        .from("certification_applications")
        .select(
          "coach_id, tier, status, certified_at, expires_at, submitted_at",
        )
        .in("coach_id", ids)
        .eq("tier", "certified")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("coach_training_progress")
        .select("coach_id, module_id, status")
        .in("coach_id", ids)
        .eq("status", "completed"),
      supabase
        .from("training_modules")
        .select("id, certification_tier, is_required, is_active")
        .eq("certification_tier", "certified")
        .eq("is_required", true)
        .eq("is_active", true),
      supabase
        .from("bookings")
        .select("tutor_user_id, start_at, status")
        .in("tutor_user_id", ids),
    ]);

  const onboardingMap = new Map(
    (onboardingRes.data ?? []).map((o) => [o.coach_id, o]),
  );

  // Keep only the most recent certified application per coach (already
  // ordered desc by submitted_at above).
  type CertRow = NonNullable<typeof certAppsRes.data>[number];
  const certMap = new Map<string, CertRow>();
  for (const app of certAppsRes.data ?? []) {
    if (!certMap.has(app.coach_id)) certMap.set(app.coach_id, app);
  }

  const requiredCertifiedIds = new Set(
    (modulesRes.data ?? []).map((m) => m.id as string),
  );
  const requiredTotal = requiredCertifiedIds.size;
  const completedByCoach = new Map<string, number>();
  for (const p of trainingRes.data ?? []) {
    if (!requiredCertifiedIds.has(p.module_id)) continue;
    completedByCoach.set(
      p.coach_id,
      (completedByCoach.get(p.coach_id) ?? 0) + 1,
    );
  }

  const now = Date.now();
  const bookingStats = new Map<string, { total: number; upcoming: number }>();
  for (const b of bookingsRes.data ?? []) {
    const s = bookingStats.get(b.tutor_user_id) ?? { total: 0, upcoming: 0 };
    s.total += 1;
    if (
      b.status !== "canceled" &&
      b.start_at &&
      new Date(b.start_at).getTime() > now
    ) {
      s.upcoming += 1;
    }
    bookingStats.set(b.tutor_user_id, s);
  }

  return tutors.map((t) => {
    const o = onboardingMap.get(t.id);
    const c = certMap.get(t.id);
    const bg = o?.background_check_attested ?? false;
    const bgv = o?.admin_verified_background ?? false;
    const coc = o?.code_of_conduct_accepted ?? false;
    const act = o?.activated ?? false;
    // Steps mirror /tutor/onboarding surface: profile, bg attest, coc,
    // training done, certified, activated.
    const training = completedByCoach.get(t.id) ?? 0;
    const trainingDone = requiredTotal > 0 && training >= requiredTotal;
    const certified = c?.status === "approved";
    const stepsDone = [
      Boolean(t.full_name),
      bg,
      coc,
      trainingDone,
      certified,
      act,
    ].filter(Boolean).length;
    const stats = bookingStats.get(t.id) ?? { total: 0, upcoming: 0 };

    return {
      id: t.id,
      full_name: t.full_name,
      email: t.email,
      avatar_url: t.avatar_url,
      created_at: t.created_at,
      onboarding: {
        background_check_attested: bg,
        admin_verified_background: bgv,
        code_of_conduct_accepted: coc,
        activated: act,
        steps_done: stepsDone,
        steps_total: 6,
      },
      certified: {
        tier: (c?.tier as "certified" | "master" | null) ?? null,
        status: (c?.status as string) ?? null,
        certified_at: (c?.certified_at as string | null) ?? null,
        expires_at: (c?.expires_at as string | null) ?? null,
      },
      training: {
        completed: training,
        required: requiredTotal,
      },
      activity: {
        total_bookings: stats.total,
        upcoming_bookings: stats.upcoming,
      },
    };
  });
}
