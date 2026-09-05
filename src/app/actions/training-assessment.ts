"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  CERTIFIED_ASSESSMENT_QUESTIONS,
  PASS_THRESHOLD_PERCENT,
} from "@/lib/training/certified-assessment";

export interface AssessmentResult {
  success: boolean;
  error?: string;
  passed?: boolean;
  score?: number;
  correctCount?: number;
  totalCount?: number;
  perQuestion?: {
    id: string;
    prompt: string;
    correct: boolean;
    correctIndex: number;
    selectedIndex: number;
    rationale: string;
  }[];
}

// answers is a map of question id → chosen index. Score is computed
// server-side against the immutable question bank, then the coach's
// attempt is recorded on coach_training_progress for the certification
// assessment module. Passing (>= 80%) marks the module completed;
// failing marks it failed and preserves attempt count for retry logic.
export async function submitCertifiedAssessment(
  answers: Record<string, number>,
): Promise<AssessmentResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor")
    return { success: false, error: "Only coaches can take this assessment." };

  const total = CERTIFIED_ASSESSMENT_QUESTIONS.length;
  const perQuestion = CERTIFIED_ASSESSMENT_QUESTIONS.map((q) => {
    const selected = answers[q.id];
    const correct = typeof selected === "number" && selected === q.correctIndex;
    return {
      id: q.id,
      prompt: q.prompt,
      correct,
      correctIndex: q.correctIndex,
      selectedIndex: typeof selected === "number" ? selected : -1,
      rationale: q.rationale,
    };
  });

  const correctCount = perQuestion.filter((q) => q.correct).length;
  const score = Math.round((correctCount / total) * 100);
  const passed = score >= PASS_THRESHOLD_PERCENT;

  const supabase = await createClient();

  const { data: mod } = await supabase
    .from("training_modules")
    .select("id")
    .eq("slug", "mp-certification-assessment")
    .maybeSingle();

  if (!mod) {
    return {
      success: false,
      error: "Certification assessment module not found.",
    };
  }

  const { data: existing } = await supabase
    .from("coach_training_progress")
    .select("attempts")
    .eq("coach_id", user.id)
    .eq("module_id", mod.id)
    .maybeSingle();

  const attempts = (existing?.attempts ?? 0) + 1;

  await supabase.from("coach_training_progress").upsert(
    {
      coach_id: user.id,
      module_id: mod.id,
      status: passed ? "completed" : "failed",
      score,
      attempts,
      completed_at: passed ? new Date().toISOString() : null,
      started_at: existing ? undefined : new Date().toISOString(),
    },
    { onConflict: "coach_id,module_id" },
  );

  revalidatePath("/tutor/training");
  revalidatePath("/tutor/training/mp-certification-assessment");
  revalidatePath("/tutor/onboarding");

  return {
    success: true,
    passed,
    score,
    correctCount,
    totalCount: total,
    perQuestion,
  };
}
