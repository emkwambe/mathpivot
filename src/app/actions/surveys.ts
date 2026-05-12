"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SurveyTemplate {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  target_role: string;
  questions: SurveyQuestion[];
  frequency_days: number | null;
  is_system: boolean;
}

export interface SurveyQuestion {
  key: string;
  type: string;
  label: string;
  placeholder?: string;
  options?: string[];
  anchors?: string[];
  domain?: string;
  required?: boolean;
}

export interface SurveyResponseSummary {
  id: string;
  template_title: string;
  category: string;
  answers: Record<string, unknown>;
  completed_at: string;
}

export async function getSurveyTemplates(category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("survey_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at");

  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return (data || []) as SurveyTemplate[];
}

export async function submitSurvey(
  templateId: string,
  answers: Record<string, unknown>,
  enrollmentId?: string,
  studentId?: string,
  sessionId?: string,
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase.from("survey_responses").insert({
    template_id: templateId,
    enrollment_id: enrollmentId || null,
    student_id: studentId || null,
    respondent_id: user.id,
    respondent_role: user.role,
    answers,
    session_id: sessionId || null,
    completed_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: "Failed to save survey" };

  if (enrollmentId) {
    await supabase
      .from("survey_schedule")
      .update({
        last_completed_at: new Date().toISOString(),
      })
      .eq("template_id", templateId)
      .eq("enrollment_id", enrollmentId);
  }

  revalidatePath("/tutor/portfolio");
  return { success: true };
}

export async function submitSchoolPulse(
  studentId: string,
  enrollmentId: string,
  currentTopic: string,
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") return { success: false };

  const supabase = await createClient();

  await supabase
    .from("student_academic_profiles")
    .update({
      school_current_topic: currentTopic.trim(),
      school_topic_updated_at: new Date().toISOString(),
    })
    .eq("student_id", studentId);

  const templates = await getSurveyTemplates("school_pulse");
  const template = templates[0];
  if (template) {
    await submitSurvey(
      template.id,
      { current_topic: currentTopic.trim() },
      enrollmentId,
      studentId,
    );
  }

  revalidatePath("/tutor/portfolio");
  return { success: true };
}

export async function submitCareerInterest(
  studentId: string,
  enrollmentId: string,
  answers: Record<string, number>,
) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  const supabase = await createClient();

  const templates = await getSurveyTemplates("career_interest");
  const template = templates[0];
  if (!template) return { success: false, error: "Template not found" };

  const result = await submitSurvey(
    template.id,
    answers,
    enrollmentId,
    studentId,
  );
  if (!result.success) return result;

  const domainScores: Record<string, number> = {};
  for (const question of template.questions) {
    if (question.domain && answers[question.key] !== undefined) {
      domainScores[question.domain] =
        (domainScores[question.domain] || 0) +
        (answers[question.key] as number);
    }
  }

  const careerMap: Record<string, string[]> = {
    realistic: ["Robotics Engineer", "Civil Engineer", "Software Developer"],
    investigative: [
      "Data Scientist",
      "Research Mathematician",
      "Epidemiologist",
    ],
    artistic: ["Game Designer", "Architect", "UX Designer"],
    social: ["Math Teacher", "School Counselor", "Nonprofit Director"],
    enterprising: ["Financial Analyst", "Product Manager", "Entrepreneur"],
    conventional: ["Actuary", "Accountant", "Operations Analyst"],
  };

  const topDomains = Object.entries(domainScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => domain);

  const topCareers = topDomains.flatMap((d) => careerMap[d] || []).slice(0, 5);

  const { data: latestResponse } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("template_id", template.id)
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("student_career_interests").upsert(
    {
      student_id: studentId,
      riasec_scores: domainScores,
      top_careers: topCareers,
      last_assessed_at: new Date().toISOString(),
      survey_response_id: latestResponse?.id || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" },
  );

  revalidatePath("/student/journey");
  return { success: true, topCareers };
}

export async function getOverdueSurveys(coachId: string) {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id")
    .eq("coach_id", coachId)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) return [];

  const enrollmentIds = enrollments.map((e) => e.id);

  const { data: schedules } = await supabase
    .from("survey_schedule")
    .select("id, template_id, enrollment_id, next_due_at, last_completed_at")
    .in("enrollment_id", enrollmentIds)
    .lt("next_due_at", new Date().toISOString());

  const overdue = (schedules || []).filter(
    (s) =>
      !s.last_completed_at ||
      new Date(s.last_completed_at) < new Date(s.next_due_at),
  );

  if (overdue.length === 0) return [];

  const templateIds = [...new Set(overdue.map((s) => s.template_id))];
  const { data: templates } = await supabase
    .from("survey_templates")
    .select("id, title, slug, category")
    .in("id", templateIds);

  const templateMap = new Map((templates || []).map((t) => [t.id, t]));
  const studentMap = new Map(enrollments.map((e) => [e.id, e.student_id]));

  const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
  const { data: students } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .in("id", studentIds);
  const nameMap = new Map((students || []).map((s) => [s.id, s.full_name]));

  return overdue.map((s) => {
    const template = templateMap.get(s.template_id);
    const studentId = studentMap.get(s.enrollment_id);
    return {
      scheduleId: s.id,
      templateSlug: template?.slug || "",
      templateTitle: template?.title || "Survey",
      category: template?.category || "",
      enrollmentId: s.enrollment_id,
      studentId: studentId || "",
      studentName: nameMap.get(studentId || "") || "Student",
      dueAt: s.next_due_at,
    };
  });
}

export async function getRecentSurveyResponses(
  enrollmentId: string,
  limit = 10,
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("survey_responses")
    .select("id, template_id, answers, completed_at")
    .eq("enrollment_id", enrollmentId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const templateIds = [...new Set(data.map((r) => r.template_id))];
  const { data: templates } = await supabase
    .from("survey_templates")
    .select("id, title, category")
    .in("id", templateIds);

  const templateMap = new Map((templates || []).map((t) => [t.id, t]));

  return data.map((r) => {
    const template = templateMap.get(r.template_id);
    return {
      id: r.id,
      template_title: template?.title || "Survey",
      category: template?.category || "",
      answers: r.answers,
      completed_at: r.completed_at,
    } as SurveyResponseSummary;
  });
}
