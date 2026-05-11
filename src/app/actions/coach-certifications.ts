"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { REQUIRED_CERTIFICATIONS } from "@/lib/coach-certifications";

export interface CoachReadiness {
  coachId: string;
  coachName: string;
  certifications: {
    key: string;
    title: string;
    completedAt: string | null;
    expiresAt: string | null;
    isExpired: boolean;
    isComplete: boolean;
  }[];
  isReady: boolean;
  completedCount: number;
  totalRequired: number;
}

export async function getCoachReadiness(
  coachId: string,
): Promise<CoachReadiness | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users_profile")
    .select("full_name")
    .eq("id", coachId)
    .single();

  const { data: certs } = await supabase
    .from("coach_certifications")
    .select("certification_type, completed_at, expires_at")
    .eq("coach_id", coachId);

  const certMap = new Map((certs || []).map((c) => [c.certification_type, c]));

  const now = new Date();

  const certifications = REQUIRED_CERTIFICATIONS.map((req) => {
    const cert = certMap.get(req.key);
    const isExpired = cert?.expires_at
      ? new Date(cert.expires_at) < now
      : false;
    const isComplete = !!cert?.completed_at && !isExpired;

    return {
      key: req.key,
      title: req.title,
      completedAt: cert?.completed_at || null,
      expiresAt: cert?.expires_at || null,
      isExpired,
      isComplete,
    };
  });

  const completedCount = certifications.filter((c) => c.isComplete).length;

  return {
    coachId,
    coachName: profile?.full_name || "Coach",
    certifications,
    isReady: completedCount === REQUIRED_CERTIFICATIONS.length,
    completedCount,
    totalRequired: REQUIRED_CERTIFICATIONS.length,
  };
}

export async function getAllCoachReadiness(): Promise<CoachReadiness[]> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin"))
    return [];

  const supabase = await createClient();

  const { data: coaches } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .eq("role", "tutor");

  if (!coaches || coaches.length === 0) return [];

  const results: CoachReadiness[] = [];
  for (const coach of coaches) {
    const readiness = await getCoachReadiness(coach.id);
    if (readiness) results.push(readiness);
  }

  return results;
}

export async function updateCertification(
  coachId: string,
  certType: string,
  action: "complete" | "revoke",
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false };
  }

  const supabase = await createClient();
  const certDef = REQUIRED_CERTIFICATIONS.find((c) => c.key === certType);
  if (!certDef) return { success: false };

  if (action === "complete") {
    const now = new Date();
    const expiresAt = certDef.expiresInMonths
      ? new Date(
          now.getTime() + certDef.expiresInMonths * 30 * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null;

    await supabase.from("coach_certifications").upsert(
      {
        coach_id: coachId,
        certification_type: certType,
        completed_at: now.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "coach_id,certification_type" },
    );
  } else {
    await supabase
      .from("coach_certifications")
      .delete()
      .eq("coach_id", coachId)
      .eq("certification_type", certType);
  }

  revalidatePath("/admin/coach-readiness");
  revalidatePath("/tutor/settings");
  return { success: true };
}
