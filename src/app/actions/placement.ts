"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Placement queue = program_subscriptions that are paid (active/trialing)
// but do not yet have a cohort_enrollments row. These students have been
// billed by Stripe and are waiting for admin to assign them to a coach's
// weekly time slot (coaching_schedules row).
//
// Auto-suggestion picks matching coaching_schedules where program_slug
// equals the subscription's program_tier and spots_remaining > 0.

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;
  return user;
}

export interface UnplacedRow {
  subscription_id: string;
  student_user_id: string | null;
  parent_user_id: string | null;
  student_name: string | null;
  student_grade: number | null;
  parent_name: string | null;
  parent_email: string | null;
  program_tier: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

export interface SuggestedSchedule {
  schedule_id: string;
  coach_id: string;
  coach_name: string | null;
  coach_email: string;
  program_slug: string;
  cohort_label: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  enrolled_count: number;
  default_capacity: number;
  max_capacity: number;
  spots_remaining: number;
  fill_status: string;
}

export async function getPlacementQueue(): Promise<UnplacedRow[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = await createClient();

  // 1. Active subscriptions.
  const { data: subs } = await supabase
    .from("program_subscriptions")
    .select(
      "id, student_user_id, parent_user_id, parent_name, parent_email, student_name, student_grade, program_tier, status, current_period_end, created_at",
    )
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: true });

  if (!subs || subs.length === 0) return [];

  // 2. Which students already have a cohort_enrollment on any active
  // schedule for the matching tier? Fetch all cohort_enrollments joined
  // with schedule to check tier.
  const studentIds = subs
    .map((s) => s.student_user_id)
    .filter((id): id is string => Boolean(id));

  let placedKey = new Set<string>();
  if (studentIds.length > 0) {
    const { data: placements } = await supabase
      .from("cohort_enrollments")
      .select("student_id, status, coaching_schedules!inner(program_slug)")
      .in("student_id", studentIds)
      .in("status", ["confirmed", "active"]);

    placedKey = new Set(
      (placements ?? []).map((p) => {
        const raw = (p as unknown as { coaching_schedules: unknown })
          .coaching_schedules;
        const cs = Array.isArray(raw)
          ? (raw as { program_slug: string }[])[0]
          : (raw as { program_slug: string } | null);
        return `${p.student_id}|${cs?.program_slug ?? ""}`;
      }),
    );
  }

  const unplaced = subs.filter(
    (s) =>
      s.student_user_id &&
      !placedKey.has(`${s.student_user_id}|${s.program_tier}`),
  );

  return unplaced.map((s) => ({
    subscription_id: s.id as string,
    student_user_id: s.student_user_id as string | null,
    parent_user_id: s.parent_user_id as string | null,
    student_name: (s.student_name as string | null) ?? null,
    student_grade: (s.student_grade as number | null) ?? null,
    parent_name: (s.parent_name as string | null) ?? null,
    parent_email: (s.parent_email as string | null) ?? null,
    program_tier: s.program_tier as string,
    status: s.status as string,
    current_period_end: (s.current_period_end as string | null) ?? null,
    created_at: s.created_at as string,
  }));
}

export async function getSuggestionsForTier(
  tier: string,
): Promise<SuggestedSchedule[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = await createClient();

  // Query the coach_schedule_overview view (defined in migration 00041)
  // for schedules matching this tier's slug with capacity remaining.
  const { data } = await supabase
    .from("coach_schedule_overview")
    .select(
      "schedule_id, coach_id, program_slug, cohort_label, day_of_week, start_time, end_time, enrolled_count, default_capacity, max_capacity, spots_remaining, fill_status",
    )
    .eq("program_slug", tier)
    .order("day_of_week")
    .order("start_time");

  if (!data || data.length === 0) return [];

  // Enrich with coach name/email so admin sees who they're placing under.
  const coachIds = Array.from(new Set(data.map((r) => r.coach_id as string)));
  const { data: coaches } = await supabase
    .from("users_profile")
    .select("id, full_name, email")
    .in("id", coachIds);

  const coachMap = new Map(
    (coaches ?? []).map((c) => [
      c.id as string,
      { name: c.full_name as string | null, email: c.email as string },
    ]),
  );

  return data
    .filter((r) => (r.spots_remaining as number) > 0)
    .map((r) => {
      const c = coachMap.get(r.coach_id as string);
      return {
        schedule_id: r.schedule_id as string,
        coach_id: r.coach_id as string,
        coach_name: c?.name ?? null,
        coach_email: c?.email ?? "",
        program_slug: r.program_slug as string,
        cohort_label: r.cohort_label as string,
        day_of_week: r.day_of_week as string,
        start_time: r.start_time as string,
        end_time: r.end_time as string,
        enrolled_count: r.enrolled_count as number,
        default_capacity: r.default_capacity as number,
        max_capacity: r.max_capacity as number,
        spots_remaining: r.spots_remaining as number,
        fill_status: r.fill_status as string,
      };
    });
}

export interface PlaceInput {
  subscriptionId: string;
  scheduleId: string;
}

export async function placeStudent(input: PlaceInput) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorized" };

  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("program_subscriptions")
    .select("student_user_id, parent_user_id, program_tier")
    .eq("id", input.subscriptionId)
    .maybeSingle();

  if (!sub?.student_user_id) {
    return {
      success: false,
      error: "Subscription is missing a linked student account.",
    };
  }

  const { data: schedule } = await supabase
    .from("coaching_schedules")
    .select("id, program_slug, max_capacity")
    .eq("id", input.scheduleId)
    .maybeSingle();

  if (!schedule) return { success: false, error: "Schedule not found." };
  if (schedule.program_slug !== sub.program_tier) {
    return {
      success: false,
      error: `Schedule is for ${schedule.program_slug}, but the student's subscription is ${sub.program_tier}. Pick a matching schedule.`,
    };
  }

  // Guard against overfill: recount live and reject if at capacity.
  const { count } = await supabase
    .from("cohort_enrollments")
    .select("id", { head: true, count: "exact" })
    .eq("schedule_id", input.scheduleId)
    .in("status", ["confirmed", "active"]);
  if ((count ?? 0) >= schedule.max_capacity) {
    return { success: false, error: "This cohort is already full." };
  }

  const { error } = await supabase.from("cohort_enrollments").insert({
    schedule_id: input.scheduleId,
    student_id: sub.student_user_id,
    parent_id: sub.parent_user_id ?? null,
    status: "confirmed",
    placement_method: "admin",
    payment_status: "paid",
    confirmed_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/placement-queue");
  revalidatePath("/admin/schedules");
  return { success: true };
}
