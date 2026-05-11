"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveStudentIntake(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const studentId = formData.get("studentId") as string;
  if (!studentId) return { success: false, error: "Missing student ID" };

  if (user.role === "parent") {
    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from("program_enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("parent_id", user.id)
      .limit(1)
      .single();
    if (!enrollment) return { success: false, error: "Not authorized" };
  } else if (user.role === "student") {
    if (user.id !== studentId) return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const profile: Record<string, unknown> = {
    student_id: studentId,
    updated_at: new Date().toISOString(),
  };

  const fields = [
    "grade_level", "school_type", "school_name", "current_math_course",
    "textbook_curriculum", "current_math_grade", "teacher_name",
    "learning_goal_parent", "learning_goal_student", "accommodations",
    "extracurriculars", "best_session_times", "homeschool_curriculum",
    "communication_preference",
  ];

  let filled = 0;
  for (const field of fields) {
    const value = formData.get(field) as string;
    if (value && value.trim()) {
      profile[field] = value.trim();
      filled++;
    }
  }

  profile.is_homeschool = formData.get("school_type") === "homeschool";
  profile.profile_completeness = Math.round((filled / fields.length) * 100);

  const nextTestDates = formData.get("next_test_dates") as string;
  if (nextTestDates) {
    try {
      profile.next_test_dates = JSON.parse(nextTestDates);
    } catch {
      profile.next_test_dates = [];
    }
  }

  const { error } = await supabase
    .from("student_academic_profiles")
    .upsert(profile, { onConflict: "student_id" });

  if (error) return { success: false, error: "Failed to save profile" };

  revalidatePath("/parent");
  revalidatePath("/tutor/portfolio");

  return { success: true };
}

export async function getStudentContext(studentId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("student_academic_profiles")
    .select("*")
    .eq("student_id", studentId)
    .single();

  return profile;
}

export async function completeOnboardingStep(
  enrollmentId: string,
  stepKey: string,
  notes?: string,
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return { success: false };

  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, coach_id")
    .eq("id", enrollmentId)
    .eq("coach_id", user.id)
    .single();

  if (!enrollment) return { success: false };

  await supabase.from("onboarding_steps").upsert(
    {
      enrollment_id: enrollmentId,
      step_key: stepKey,
      completed_at: new Date().toISOString(),
      notes: notes || null,
    },
    { onConflict: "enrollment_id,step_key" },
  );

  const { count: completedSteps } = await supabase
    .from("onboarding_steps")
    .select("id", { count: "exact", head: true })
    .eq("enrollment_id", enrollmentId)
    .not("completed_at", "is", null);

  const allComplete = (completedSteps || 0) >= 6;

  if (allComplete) {
    await supabase
      .from("program_enrollments")
      .update({
        onboarding_status: "completed",
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", enrollmentId);
  } else {
    await supabase
      .from("program_enrollments")
      .update({ onboarding_status: "in_progress" })
      .eq("id", enrollmentId);
  }

  revalidatePath("/tutor/portfolio");
  return { success: true, allComplete };
}

export async function getCareerSpotlights(studentId: string) {
  const supabase = await createClient();

  const { data: mastery } = await supabase
    .from("student_concept_mastery")
    .select("concept_id, mastery_level")
    .eq("student_id", studentId)
    .in("mastery_level", ["proficient", "mastered"]);

  if (!mastery || mastery.length === 0) return [];

  const conceptIds = mastery.map((m) => m.concept_id);
  const { data: concepts } = await supabase
    .from("atomic_concepts")
    .select("id, unit_id")
    .in("id", conceptIds);

  if (!concepts || concepts.length === 0) return [];

  const unitIds = [...new Set(concepts.map((c) => c.unit_id))];
  const { data: units } = await supabase
    .from("curriculum_units")
    .select("id, title")
    .in("id", unitIds);

  const domainMap: Record<string, number> = {};
  const domainKeywords: Record<string, string[]> = {
    statistics: ["Statistics", "Data", "Mean", "Median", "Variability", "Distribution"],
    probability: ["Probability", "Random", "Chance", "Expected"],
    algebra: ["Equation", "Expression", "Variable", "Linear", "Quadratic", "Function", "Polynomial"],
    geometry: ["Area", "Volume", "Surface", "Triangle", "Angle", "Coordinate", "Transformation"],
    calculus: ["Rate", "Exponential", "Growth", "Decay"],
    proportional_reasoning: ["Ratio", "Proportion", "Percent", "Rate", "Unit"],
    data_analysis: ["Scatter", "Correlation", "Regression", "Best Fit"],
    measurement: ["Volume", "Surface Area", "Conversion"],
    logic: ["Proof", "Reasoning", "Solution"],
  };

  (units || []).forEach((unit) => {
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some((kw) => unit.title.includes(kw))) {
        const conceptsInUnit = concepts.filter((c) => c.unit_id === unit.id).length;
        domainMap[domain] = (domainMap[domain] || 0) + conceptsInUnit;
      }
    }
  });

  const topDomains = Object.entries(domainMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => domain);

  if (topDomains.length === 0) return [];

  const { data: spotlights } = await supabase
    .from("career_spotlights")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (spotlights || [])
    .filter((s) => s.math_domains.some((d: string) => topDomains.includes(d)))
    .slice(0, 3);
}
