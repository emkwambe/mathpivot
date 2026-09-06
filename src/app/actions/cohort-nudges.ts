"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Cohort formation nudges — surfaced anywhere admin needs to see when a
// cohort has hit its 5-student target (fill_status='overflow') or the
// 6-student max (fill_status='full'). Business rule: once a cohort hits
// 5, spin up a second cohort at a different time for the same coach +
// program.

export interface CohortNudge {
  coach_id: string;
  coach_name: string | null;
  coach_email: string | null;
  program_slug: string;
  full_count: number;
  overflow_count: number;
  schedules: {
    schedule_id: string;
    cohort_label: string;
    day_of_week: string;
    start_time: string;
    enrolled_count: number;
    default_capacity: number;
    max_capacity: number;
    fill_status: string;
  }[];
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;
  return user;
}

export async function getCohortNudges(): Promise<CohortNudge[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = await createClient();

  // Pull every active schedule at or over target. Summer clinics have
  // their own capacity dynamics so exclude them from this nudge.
  const { data: rows } = await supabase
    .from("coach_schedule_overview")
    .select(
      "schedule_id, coach_id, program_slug, cohort_label, day_of_week, start_time, enrolled_count, default_capacity, max_capacity, fill_status, is_summer_clinic, is_active",
    )
    .in("fill_status", ["overflow", "full"])
    .eq("is_summer_clinic", false)
    .eq("is_active", true);

  if (!rows || rows.length === 0) return [];

  // Enrich with coach identity.
  const coachIds = Array.from(new Set(rows.map((r) => r.coach_id as string)));
  const { data: coaches } = await supabase
    .from("users_profile")
    .select("id, full_name, email")
    .in("id", coachIds);
  const coachMap = new Map(
    (coaches ?? []).map((c) => [
      c.id as string,
      {
        name: (c.full_name as string) ?? null,
        email: (c.email as string) ?? null,
      },
    ]),
  );

  // Group by (coach, program_slug). One nudge card per grouping.
  const grouped = new Map<string, CohortNudge>();
  for (const r of rows) {
    const key = `${r.coach_id}|${r.program_slug}`;
    if (!grouped.has(key)) {
      const c = coachMap.get(r.coach_id as string);
      grouped.set(key, {
        coach_id: r.coach_id as string,
        coach_name: c?.name ?? null,
        coach_email: c?.email ?? null,
        program_slug: r.program_slug as string,
        full_count: 0,
        overflow_count: 0,
        schedules: [],
      });
    }
    const g = grouped.get(key)!;
    if (r.fill_status === "full") g.full_count += 1;
    else g.overflow_count += 1;
    g.schedules.push({
      schedule_id: r.schedule_id as string,
      cohort_label: r.cohort_label as string,
      day_of_week: r.day_of_week as string,
      start_time: r.start_time as string,
      enrolled_count: r.enrolled_count as number,
      default_capacity: r.default_capacity as number,
      max_capacity: r.max_capacity as number,
      fill_status: r.fill_status as string,
    });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    // Full cohorts first (most urgent), then overflow, then alpha.
    if (a.full_count !== b.full_count) return b.full_count - a.full_count;
    if (a.overflow_count !== b.overflow_count)
      return b.overflow_count - a.overflow_count;
    return (a.coach_name ?? "").localeCompare(b.coach_name ?? "");
  });
}
