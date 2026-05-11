"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AttendanceRecord {
  date: string;
  durationMinutes: number;
  conceptsCovered: string[];
  coachName: string;
}

export interface MasteryRecord {
  conceptTitle: string;
  unitTitle: string;
  masteryLevel: string;
  assessedAt: string | null;
  standardCode: string | null;
}

export interface ProgressReportData {
  studentName: string;
  month: string;
  gradeLevel: string | null;
  totalSessions: number;
  totalMinutes: number;
  conceptsIntroduced: number;
  conceptsMastered: number;
  overallMastery: number;
  highlights: string[];
}

export interface TranscriptEntry {
  courseName: string;
  creditHours: number;
  grade: string;
  completedAt: string | null;
  conceptsTotal: number;
  conceptsMastered: number;
}

export async function generateAttendanceLog(
  studentId: string,
  startDate: string,
  endDate: string,
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

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
  } else if (user.role !== "admin" && user.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      `
      started_at, completed_at, internal_notes,
      booking:bookings!inner(student_user_id, tutor_user_id)
    `,
    )
    .eq("status", "completed")
    .gte("started_at", startDate)
    .lte("started_at", endDate)
    .order("started_at");

  const studentSessions = (sessions || []).filter((s) => {
    const b = s.booking as unknown as { student_user_id: string };
    return b.student_user_id === studentId;
  });

  const tutorIds = [
    ...new Set(
      studentSessions.map((s) => {
        const b = s.booking as unknown as { tutor_user_id: string };
        return b.tutor_user_id;
      }),
    ),
  ];

  const { data: tutors } =
    tutorIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", tutorIds)
      : { data: [] };

  const tutorMap = new Map((tutors || []).map((t) => [t.id, t.full_name]));

  const { data: mastery } = await supabase
    .from("student_concept_mastery")
    .select("concept_id, assessed_at")
    .eq("student_id", studentId)
    .gte("assessed_at", startDate)
    .lte("assessed_at", endDate);

  const conceptIds = [...new Set((mastery || []).map((m) => m.concept_id))];
  const { data: concepts } =
    conceptIds.length > 0
      ? await supabase
          .from("atomic_concepts")
          .select("id, title")
          .in("id", conceptIds)
      : { data: [] };
  const conceptMap = new Map((concepts || []).map((c) => [c.id, c.title]));

  const records: AttendanceRecord[] = studentSessions.map((s) => {
    const b = s.booking as unknown as { tutor_user_id: string };
    const duration =
      s.completed_at && s.started_at
        ? Math.round(
            (new Date(s.completed_at).getTime() -
              new Date(s.started_at).getTime()) /
              60000,
          )
        : 60;

    const sessionDate = new Date(s.started_at).toISOString().split("T")[0];
    const sessionConcepts = (mastery || [])
      .filter((m) => m.assessed_at && m.assessed_at.startsWith(sessionDate))
      .map((m) => conceptMap.get(m.concept_id) || "Unknown Concept");

    return {
      date: sessionDate,
      durationMinutes: duration,
      conceptsCovered: sessionConcepts,
      coachName: tutorMap.get(b.tutor_user_id) || "Coach",
    };
  });

  return { success: true, data: records };
}

export async function generateMasteryPortfolio(
  studentId: string,
): Promise<{ success: boolean; data?: MasteryRecord[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

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
  } else if (user.role !== "admin" && user.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const { data: mastery } = await supabase
    .from("student_concept_mastery")
    .select("concept_id, mastery_level, assessed_at")
    .eq("student_id", studentId);

  if (!mastery || mastery.length === 0) return { success: true, data: [] };

  const conceptIds = mastery.map((m) => m.concept_id);
  const { data: concepts } = await supabase
    .from("atomic_concepts")
    .select("id, title, unit_id, standard_code, sort_order")
    .in("id", conceptIds)
    .order("sort_order");

  const unitIds = [...new Set((concepts || []).map((c) => c.unit_id))];
  const { data: units } =
    unitIds.length > 0
      ? await supabase
          .from("curriculum_units")
          .select("id, title")
          .in("id", unitIds)
      : { data: [] };

  const unitMap = new Map((units || []).map((u) => [u.id, u.title]));
  const masteryMap = new Map(mastery.map((m) => [m.concept_id, m]));

  const records: MasteryRecord[] = (concepts || []).map((c) => {
    const m = masteryMap.get(c.id);
    return {
      conceptTitle: c.title,
      unitTitle: unitMap.get(c.unit_id) || "Unknown Unit",
      masteryLevel: m?.mastery_level || "not_started",
      assessedAt: m?.assessed_at || null,
      standardCode: c.standard_code || null,
    };
  });

  return { success: true, data: records };
}

export async function generateProgressReport(
  studentId: string,
  month: string,
): Promise<{ success: boolean; data?: ProgressReportData; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

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
  } else if (user.role !== "admin" && user.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 1, 1).toISOString();
  const endDate = new Date(year, mon, 0, 23, 59, 59).toISOString();

  const [
    { data: studentProfile },
    { data: academicProfile },
    { data: sessions },
    { data: masteryThisMonth },
    { data: allMastery },
  ] = await Promise.all([
    supabase
      .from("users_profile")
      .select("full_name")
      .eq("id", studentId)
      .single(),
    supabase
      .from("student_academic_profiles")
      .select("grade_level")
      .eq("student_id", studentId)
      .single(),
    supabase
      .from("sessions")
      .select(
        "started_at, completed_at, booking:bookings!inner(student_user_id)",
      )
      .eq("status", "completed")
      .gte("started_at", startDate)
      .lte("started_at", endDate),
    supabase
      .from("student_concept_mastery")
      .select("concept_id, mastery_level")
      .eq("student_id", studentId)
      .gte("assessed_at", startDate)
      .lte("assessed_at", endDate),
    supabase
      .from("student_concept_mastery")
      .select("concept_id, mastery_level")
      .eq("student_id", studentId),
  ]);

  const studentSessions = (sessions || []).filter((s) => {
    const b = s.booking as unknown as { student_user_id: string };
    return b.student_user_id === studentId;
  });

  const totalMinutes = studentSessions.reduce((acc, s) => {
    if (s.completed_at && s.started_at) {
      return (
        acc +
        Math.round(
          (new Date(s.completed_at).getTime() -
            new Date(s.started_at).getTime()) /
            60000,
        )
      );
    }
    return acc + 60;
  }, 0);

  const conceptsIntroduced = (masteryThisMonth || []).length;
  const conceptsMastered = (masteryThisMonth || []).filter(
    (m) => m.mastery_level === "mastered" || m.mastery_level === "proficient",
  ).length;

  const totalConcepts = (allMastery || []).length;
  const totalMastered = (allMastery || []).filter(
    (m) => m.mastery_level === "mastered" || m.mastery_level === "proficient",
  ).length;
  const overallMastery =
    totalConcepts > 0 ? Math.round((totalMastered / totalConcepts) * 100) : 0;

  const highlights: string[] = [];
  if (studentSessions.length > 0) {
    highlights.push(
      `Completed ${studentSessions.length} coaching sessions (${totalMinutes} total minutes)`,
    );
  }
  if (conceptsMastered > 0) {
    highlights.push(`Mastered ${conceptsMastered} new concepts this month`);
  }
  if (conceptsIntroduced > conceptsMastered) {
    highlights.push(
      `${conceptsIntroduced - conceptsMastered} concepts currently in progress`,
    );
  }

  const monthLabel = new Date(year, mon - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return {
    success: true,
    data: {
      studentName: studentProfile?.full_name || "Student",
      month: monthLabel,
      gradeLevel: academicProfile?.grade_level || null,
      totalSessions: studentSessions.length,
      totalMinutes,
      conceptsIntroduced,
      conceptsMastered,
      overallMastery,
      highlights,
    },
  };
}

export async function generateTranscript(
  studentId: string,
): Promise<{ success: boolean; data?: TranscriptEntry[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

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
  } else if (user.role !== "admin" && user.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, credit_hours")
    .eq("is_active", true)
    .order("title");

  if (!courses || courses.length === 0) return { success: true, data: [] };

  const { data: mastery } = await supabase
    .from("student_concept_mastery")
    .select("concept_id, mastery_level, assessed_at")
    .eq("student_id", studentId);

  const masteryMap = new Map((mastery || []).map((m) => [m.concept_id, m]));

  const courseIds = courses.map((c) => c.id);
  const { data: units } = await supabase
    .from("curriculum_units")
    .select("id, course_id")
    .in("course_id", courseIds);

  const unitIds = (units || []).map((u) => u.id);
  const { data: concepts } =
    unitIds.length > 0
      ? await supabase
          .from("atomic_concepts")
          .select("id, unit_id")
          .in("unit_id", unitIds)
      : { data: [] };

  const unitToCourse = new Map((units || []).map((u) => [u.id, u.course_id]));
  const courseConceptCounts = new Map<
    string,
    { total: number; mastered: number; latestDate: string | null }
  >();

  for (const concept of concepts || []) {
    const courseId = unitToCourse.get(concept.unit_id);
    if (!courseId) continue;

    const current = courseConceptCounts.get(courseId) || {
      total: 0,
      mastered: 0,
      latestDate: null,
    };
    current.total++;

    const m = masteryMap.get(concept.id);
    if (
      m &&
      (m.mastery_level === "mastered" || m.mastery_level === "proficient")
    ) {
      current.mastered++;
      if (
        m.assessed_at &&
        (!current.latestDate || m.assessed_at > current.latestDate)
      ) {
        current.latestDate = m.assessed_at;
      }
    }
    courseConceptCounts.set(courseId, current);
  }

  const entries: TranscriptEntry[] = courses
    .map((course) => {
      const stats = courseConceptCounts.get(course.id) || {
        total: 0,
        mastered: 0,
        latestDate: null,
      };
      if (stats.total === 0) return null;

      const pct = stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0;
      let grade = "IP";
      if (pct >= 90) grade = "A";
      else if (pct >= 80) grade = "B";
      else if (pct >= 70) grade = "C";
      else if (pct >= 60) grade = "D";
      else if (pct > 0) grade = "IP";

      return {
        courseName: course.title,
        creditHours: course.credit_hours || 1,
        grade,
        completedAt: pct >= 90 ? stats.latestDate : null,
        conceptsTotal: stats.total,
        conceptsMastered: stats.mastered,
      };
    })
    .filter((e): e is TranscriptEntry => e !== null);

  return { success: true, data: entries };
}
