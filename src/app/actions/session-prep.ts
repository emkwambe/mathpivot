"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getReviewQueue } from "./student-insights";

export interface SessionPrepBrief {
  studentName: string;
  programName: string;
  trackLevel: string;
  overallMastery: number;
  totalConcepts: number;
  masteredCount: number;
  practiceStreak: number;
  practiceDaysThisWeek: number;
  focusAreas: {
    title: string;
    lessonNumber: string;
    reason: string;
    currentLevel: string;
  }[];
  reviewQueue: {
    title: string;
    lessonNumber: string;
    daysSinceReview: number;
    masteryLevel: string;
  }[];
  coachNotes: string | null;
}

export async function getSessionPrepBrief(
  enrollmentId: string,
): Promise<SessionPrepBrief | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return null;

  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, student_id, coach_id, program_id")
    .eq("id", enrollmentId)
    .eq("coach_id", user.id)
    .single();

  if (!enrollment) return null;

  const [
    { data: studentProfile },
    { data: program },
    { data: mastery },
    { data: practiceLogs },
    { data: lastSession },
  ] = await Promise.all([
    supabase
      .from("users_profile")
      .select("full_name")
      .eq("id", enrollment.student_id)
      .single(),
    supabase
      .from("coaching_programs")
      .select("name, track_level")
      .eq("id", enrollment.program_id)
      .single(),
    supabase
      .from("student_concept_mastery")
      .select("concept_id, mastery_level, assessed_at")
      .eq("student_id", enrollment.student_id),
    supabase
      .from("practice_logs")
      .select("practice_date, duration_minutes")
      .eq("student_id", enrollment.student_id)
      .order("practice_date", { ascending: false })
      .limit(14),
    supabase
      .from("sessions")
      .select("internal_notes, next_steps")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const totalConcepts = (mastery || []).length;
  const masteredCount = (mastery || []).filter(
    (m) => m.mastery_level === "mastered" || m.mastery_level === "proficient",
  ).length;
  const overallMastery =
    totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const practiceDaysThisWeek = (practiceLogs || []).filter((l) => {
    const d = new Date(l.practice_date);
    return d >= weekStart;
  }).length;

  let practiceStreak = 0;
  if (practiceLogs && practiceLogs.length > 0) {
    const logDates = new Set(practiceLogs.map((l) => l.practice_date));
    const checkDate = new Date();
    const todayStr = checkDate.toISOString().split("T")[0];
    if (!logDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (logDates.has(checkDate.toISOString().split("T")[0])) {
      practiceStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  const stalledConcepts = (mastery || []).filter((m) => {
    if (m.mastery_level !== "introduced" && m.mastery_level !== "developing")
      return false;
    if (!m.assessed_at) return false;
    const daysSince = Math.floor(
      (now.getTime() - new Date(m.assessed_at).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return daysSince >= 7;
  });

  const stalledConceptIds = stalledConcepts.map((m) => m.concept_id);
  const { data: stalledDetails } =
    stalledConceptIds.length > 0
      ? await supabase
          .from("atomic_concepts")
          .select("id, title, lesson_number")
          .in("id", stalledConceptIds)
      : { data: [] };

  const stalledMap = new Map((stalledDetails || []).map((c) => [c.id, c]));

  const focusAreas = stalledConcepts.slice(0, 3).map((m) => {
    const concept = stalledMap.get(m.concept_id);
    const daysSince = Math.floor(
      (now.getTime() - new Date(m.assessed_at!).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return {
      title: concept?.title || "Concept",
      lessonNumber: concept?.lesson_number || "",
      reason: `Stalled at "${m.mastery_level}" for ${daysSince} days`,
      currentLevel: m.mastery_level,
    };
  });

  const reviewQueue = await getReviewQueue(enrollment.student_id);

  return {
    studentName: studentProfile?.full_name || "Student",
    programName: program?.name || "Program",
    trackLevel: program?.track_level || "foundation",
    overallMastery,
    totalConcepts,
    masteredCount,
    practiceStreak,
    practiceDaysThisWeek,
    focusAreas,
    reviewQueue: reviewQueue.slice(0, 5),
    coachNotes: lastSession?.next_steps || lastSession?.internal_notes || null,
  };
}
