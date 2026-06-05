"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  sort_order: number;
  estimated_minutes: number;
  content_type: string;
  passing_score: number;
  is_required: boolean;
  certification_tier: string;
}

export interface ModuleProgress {
  module: TrainingModule;
  status: string;
  score: number | null;
  completedAt: string | null;
}

export interface CertificationStatus {
  certifiedModulesDone: number;
  certifiedModulesTotal: number;
  masterModulesDone: number;
  masterModulesTotal: number;
  certifiedEligible: boolean;
  masterEligible: boolean;
  certifiedPercentage: number;
  masterPercentage: number;
}

export async function getTrainingModules(tier?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("training_modules")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (tier) {
    query = query.eq("certification_tier", tier);
  }

  const { data } = await query;
  return (data || []) as TrainingModule[];
}

export async function getCoachProgress(coachId?: string) {
  const user = await getCurrentUser();
  if (!user) return { modules: [] as ModuleProgress[], status: null };

  const targetId = coachId || user.id;
  const supabase = await createClient();

  const [{ data: modules }, { data: progress }] = await Promise.all([
    supabase
      .from("training_modules")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("coach_training_progress")
      .select("module_id, status, score, completed_at")
      .eq("coach_id", targetId),
  ]);

  const progressMap = new Map((progress || []).map((p) => [p.module_id, p]));

  const moduleProgress: ModuleProgress[] = (modules || []).map((m) => {
    const p = progressMap.get(m.id);
    return {
      module: m as TrainingModule,
      status: p?.status || "not_started",
      score: p?.score || null,
      completedAt: p?.completed_at || null,
    };
  });

  const certifiedDone = moduleProgress.filter(
    (m) =>
      m.module.certification_tier === "certified" && m.status === "completed",
  ).length;
  const certifiedTotal = moduleProgress.filter(
    (m) => m.module.certification_tier === "certified" && m.module.is_required,
  ).length;
  const masterDone = moduleProgress.filter(
    (m) => m.module.certification_tier === "master" && m.status === "completed",
  ).length;
  const masterTotal = moduleProgress.filter(
    (m) => m.module.certification_tier === "master" && m.module.is_required,
  ).length;

  const status: CertificationStatus = {
    certifiedModulesDone: certifiedDone,
    certifiedModulesTotal: certifiedTotal,
    masterModulesDone: masterDone,
    masterModulesTotal: masterTotal,
    certifiedEligible: certifiedDone >= certifiedTotal && certifiedTotal > 0,
    masterEligible:
      certifiedDone >= certifiedTotal &&
      masterDone >= masterTotal &&
      masterTotal > 0,
    certifiedPercentage:
      certifiedTotal > 0
        ? Math.round((certifiedDone / certifiedTotal) * 100)
        : 0,
    masterPercentage:
      masterTotal > 0 ? Math.round((masterDone / masterTotal) * 100) : 0,
  };

  return { modules: moduleProgress, status };
}

export async function startModule(moduleId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return { success: false };

  const supabase = await createClient();

  await supabase.from("coach_training_progress").upsert(
    {
      coach_id: user.id,
      module_id: moduleId,
      status: "in_progress",
      started_at: new Date().toISOString(),
      attempts: 1,
    },
    { onConflict: "coach_id,module_id" },
  );

  revalidatePath("/tutor/training");
  return { success: true };
}

export async function completeModule(moduleId: string, score?: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return { success: false };

  const supabase = await createClient();

  const { data: module } = await supabase
    .from("training_modules")
    .select("passing_score")
    .eq("id", moduleId)
    .single();

  const passed =
    !module?.passing_score || (score && score >= module.passing_score);

  await supabase.from("coach_training_progress").upsert(
    {
      coach_id: user.id,
      module_id: moduleId,
      status: passed ? "completed" : "failed",
      completed_at: passed ? new Date().toISOString() : null,
      score: score || null,
    },
    { onConflict: "coach_id,module_id" },
  );

  revalidatePath("/tutor/training");
  return { success: true, passed };
}

export async function submitCertificationApplication(tier: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return { success: false };

  const supabase = await createClient();

  const { modules, status } = await getCoachProgress();
  if (!status) return { success: false };

  if (tier === "certified" && !status.certifiedEligible) {
    return { success: false, error: "Not all required modules completed" };
  }
  if (tier === "master" && !status.masterEligible) {
    return { success: false, error: "Not all required modules completed" };
  }

  const { error } = await supabase.from("certification_applications").insert({
    coach_id: user.id,
    tier,
    status: "pending",
    modules_completed:
      tier === "certified"
        ? status.certifiedModulesDone
        : status.certifiedModulesDone + status.masterModulesDone,
    modules_required:
      tier === "certified"
        ? status.certifiedModulesTotal
        : status.certifiedModulesTotal + status.masterModulesTotal,
  });

  if (error) return { success: false, error: "Application already submitted" };

  revalidatePath("/tutor/training");
  return { success: true };
}

export async function getAllCertificationStatus() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin"))
    return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("coach_certification_status")
    .select("*");

  return data || [];
}
