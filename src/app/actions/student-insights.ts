"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  coachName: string;
  programName: string;
  riskScore: number;
  riskFactors: string[];
  enrollmentId: string;
}

export async function getAtRiskStudents(): Promise<AtRiskStudent[]> {
  const supabase = createAdminClient();

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, coach_id, program_id, enrolled_at")
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) return [];

  const allIds = [
    ...new Set([
      ...enrollments.map((e) => e.student_id),
      ...enrollments.map((e) => e.coach_id),
    ]),
  ];
  const programIds = [...new Set(enrollments.map((e) => e.program_id))];

  const [{ data: profiles }, { data: programs }] = await Promise.all([
    supabase.from("users_profile").select("id, full_name").in("id", allIds),
    supabase
      .from("coaching_programs")
      .select("id, name, sessions_per_month")
      .in("id", programIds),
  ]);

  const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
  const programMap = new Map((programs || []).map((p) => [p.id, p]));

  const now = new Date();
  const oneWeekAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const twoWeeksAgo = new Date(
    now.getTime() - 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const results: AtRiskStudent[] = [];

  for (const enrollment of enrollments) {
    const riskFactors: string[] = [];
    let riskScore = 0;

    const { count: recentMastery } = await supabase
      .from("student_concept_mastery")
      .select("id", { count: "exact", head: true })
      .eq("student_id", enrollment.student_id)
      .gte("assessed_at", twoWeeksAgo);

    if (!recentMastery || recentMastery === 0) {
      riskScore += 35;
      riskFactors.push("No mastery progress in 2 weeks");
    } else if (recentMastery < 3) {
      riskScore += 15;
      riskFactors.push("Low mastery velocity (< 3 concepts in 2 weeks)");
    }

    const { count: practiceThisWeek } = await supabase
      .from("practice_logs")
      .select("id", { count: "exact", head: true })
      .eq("student_id", enrollment.student_id)
      .gte("practice_date", oneWeekAgo.split("T")[0]);

    if (!practiceThisWeek || practiceThisWeek === 0) {
      riskScore += 25;
      riskFactors.push("No practice logged this week");
    } else if (practiceThisWeek < 2) {
      riskScore += 10;
      riskFactors.push("Low practice frequency (< 2 days this week)");
    }

    const { count: recentSessions } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", thirtyDaysAgo);

    const program = programMap.get(enrollment.program_id);
    const expectedSessions = program?.sessions_per_month || 4;
    if (recentSessions !== null && recentSessions < expectedSessions * 0.5) {
      riskScore += 25;
      riskFactors.push(
        `Only ${recentSessions}/${expectedSessions} sessions delivered this month`,
      );
    }

    const { data: stalledConcepts } = await supabase
      .from("student_concept_mastery")
      .select("mastery_level, assessed_at")
      .eq("student_id", enrollment.student_id)
      .in("mastery_level", ["introduced", "developing"])
      .lt("assessed_at", twoWeeksAgo);

    if (stalledConcepts && stalledConcepts.length >= 3) {
      riskScore += 15;
      riskFactors.push(
        `${stalledConcepts.length} concepts stalled at developing/introduced`,
      );
    }

    if (riskScore >= 25) {
      results.push({
        studentId: enrollment.student_id,
        studentName: nameMap.get(enrollment.student_id) || "Student",
        coachName: nameMap.get(enrollment.coach_id) || "Coach",
        programName: program?.name || "Program",
        riskScore: Math.min(riskScore, 100),
        riskFactors,
        enrollmentId: enrollment.id,
      });
    }
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

export async function getReviewQueue(
  studentId: string,
): Promise<
  {
    conceptId: string;
    title: string;
    lessonNumber: string;
    lastAssessed: string;
    masteryLevel: string;
    daysSinceReview: number;
  }[]
> {
  const supabase = await createClient();

  const { data: mastery } = await supabase
    .from("student_concept_mastery")
    .select("concept_id, mastery_level, assessed_at")
    .eq("student_id", studentId)
    .in("mastery_level", ["introduced", "developing", "proficient"])
    .order("assessed_at", { ascending: true });

  if (!mastery || mastery.length === 0) return [];

  const conceptIds = mastery.map((m) => m.concept_id);
  const { data: concepts } = await supabase
    .from("atomic_concepts")
    .select("id, title, lesson_number")
    .in("id", conceptIds);

  const conceptMap = new Map((concepts || []).map((c) => [c.id, c]));

  const now = new Date();

  return mastery
    .map((m) => {
      const concept = conceptMap.get(m.concept_id);
      const assessedDate = new Date(m.assessed_at || now);
      const daysSince = Math.floor(
        (now.getTime() - assessedDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const intervalDays =
        m.mastery_level === "introduced"
          ? 2
          : m.mastery_level === "developing"
            ? 5
            : 14;

      return {
        conceptId: m.concept_id,
        title: concept?.title || "Concept",
        lessonNumber: concept?.lesson_number || "",
        lastAssessed: m.assessed_at || "",
        masteryLevel: m.mastery_level,
        daysSinceReview: daysSince,
        _dueScore: daysSince - intervalDays,
      };
    })
    .filter((item) => item._dueScore >= 0)
    .sort((a, b) => b._dueScore - a._dueScore)
    .slice(0, 10)
    .map(({ _dueScore, ...rest }) => rest);
}
