"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// Public-facing coach roster: activated (student-assignable) coaches
// who also hold an approved Certified Coach status. Uses the admin
// client so the query is not gated by RLS — only public-safe fields
// are returned (no email, no phone, no availability, no application
// notes).

export interface PublicCoach {
  id: string;
  name: string;
  avatar_url: string | null;
  tier: "certified" | "master";
  specialties: string[];
  location: string | null;
  years_teaching: number | null;
  bio: string | null;
}

export async function listPublicCoaches(): Promise<PublicCoach[]> {
  const supabase = createAdminClient();

  // Activated coaches (approved for student assignment).
  const { data: onboarding } = await supabase
    .from("coach_onboarding_progress")
    .select("coach_id, activated, application_id")
    .eq("activated", true);

  if (!onboarding || onboarding.length === 0) return [];

  const coachIds = onboarding.map((o) => o.coach_id as string);

  // Certified applications that are approved.
  const { data: certs } = await supabase
    .from("certification_applications")
    .select("coach_id, tier, status")
    .in("coach_id", coachIds)
    .in("status", ["approved"]);

  const bestTierByCoach = new Map<string, "certified" | "master">();
  for (const c of certs ?? []) {
    const tier = c.tier as "certified" | "master";
    const existing = bestTierByCoach.get(c.coach_id as string);
    // Master trumps certified.
    if (!existing || tier === "master") {
      bestTierByCoach.set(c.coach_id as string, tier);
    }
  }

  // Only include coaches with at least one approved certification.
  const eligibleIds = coachIds.filter((id) => bestTierByCoach.has(id));
  if (eligibleIds.length === 0) return [];

  const [{ data: profiles }, { data: apps }] = await Promise.all([
    supabase
      .from("users_profile")
      .select("id, full_name, avatar_url")
      .in("id", eligibleIds),
    supabase
      .from("coach_applications")
      .select("user_id, specialties, location, years_teaching, why_mathpivot")
      .in("user_id", eligibleIds),
  ]);

  const appsByUser = new Map((apps ?? []).map((a) => [a.user_id as string, a]));

  return eligibleIds
    .map((id) => {
      const p = profiles?.find((pp) => pp.id === id);
      if (!p || !p.full_name) return null;
      const a = appsByUser.get(id);
      return {
        id,
        name: p.full_name as string,
        avatar_url: (p.avatar_url as string | null) ?? null,
        tier: bestTierByCoach.get(id)!,
        specialties: ((a?.specialties as string[] | null) ?? []).filter(
          Boolean,
        ),
        location: (a?.location as string | null) ?? null,
        years_teaching: (a?.years_teaching as number | null) ?? null,
        bio: (a?.why_mathpivot as string | null) ?? null,
      } satisfies PublicCoach;
    })
    .filter((c): c is PublicCoach => c !== null)
    .sort((a, b) => {
      // Master coaches first, then alphabetical.
      if (a.tier !== b.tier) return a.tier === "master" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}
