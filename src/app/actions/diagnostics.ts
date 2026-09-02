"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail, emailTemplates } from "@/lib/email";

export interface DiagnosticQuestion {
  id: string;
  domain: string;
  grade_band: string;
  difficulty: number;
  question_text: string;
  question_type: string;
  choices: string[];
  correct_answer: string;
  time_estimate_seconds: number;
  concept_tag: string;
}

export interface DomainScore {
  domain: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface PlacementResult {
  recommendedProgram: string;
  programTier: "foundation" | "acceleration" | "elite";
  programDescription: string;
  programPriceMonthly: number;
  programCadence: string;
  domainScores: DomainScore[];
  overallScore: number;
  weakestDomain: string;
  strongestDomain: string;
  assessmentId: string;
}

interface CoachingProgram {
  tier: "foundation" | "acceleration" | "elite";
  name: string;
  priceMonthly: number;
  cadence: string;
  description: (grade?: number) => string;
}

const COACHING_PROGRAMS: Record<
  "foundation" | "acceleration" | "elite",
  CoachingProgram
> = {
  foundation: {
    tier: "foundation",
    name: "Foundation Coaching",
    priceMonthly: 349,
    cadence: "2 sessions / week",
    description: () =>
      "Rebuild confidence and close specific mastery gaps with a named math coach. Weekly coaching, structured progression, and measurable mastery — not hourly tutoring.",
  },
  acceleration: {
    tier: "acceleration",
    name: "Acceleration Coaching",
    priceMonthly: 549,
    cadence: "3 sessions / week",
    description: () =>
      "Fill remaining gaps while advancing beyond grade level. Three coaching meetings per week with a dedicated coach, mastery tracking, and a personalized roadmap.",
  },
  elite: {
    tier: "elite",
    name: "Elite Coaching",
    priceMonthly: 799,
    cadence: "2-3 sessions / week + enrichment",
    description: () =>
      "Ready to accelerate. Elite coaching adds competition prep (AMC, MATHCOUNTS), advanced problem-solving, and additional development opportunities alongside grade-level mastery.",
  },
};

function selectProgram(overallScore: number): CoachingProgram {
  if (overallScore < 40) return COACHING_PROGRAMS.foundation;
  if (overallScore < 70) return COACHING_PROGRAMS.acceleration;
  return COACHING_PROGRAMS.elite;
}

export async function getAssessmentQuestions(
  gradeHint?: number,
): Promise<DiagnosticQuestion[]> {
  const supabase = await createClient();

  let gradeBands: string[];
  switch (gradeHint) {
    case 6:
      gradeBands = ["6-7"];
      break;
    case 7:
      gradeBands = ["6-7", "7-8"];
      break;
    case 8:
      gradeBands = ["7-8", "8-9"];
      break;
    case 9:
      gradeBands = ["8-9", "9-10"];
      break;
    case 10:
      gradeBands = ["9-10", "10-11"];
      break;
    case 11:
      gradeBands = ["10-11", "9-10"];
      break;
    default:
      gradeBands = ["7-8", "8-9", "9-10"];
  }

  const { data } = await supabase
    .from("diagnostic_questions")
    .select(
      "id, domain, grade_band, difficulty, question_text, question_type, choices, correct_answer, time_estimate_seconds, concept_tag",
    )
    .eq("is_active", true)
    .in("grade_band", gradeBands)
    .order("domain")
    .order("difficulty");

  if (!data || data.length === 0) return [];

  const byDomain = new Map<string, typeof data>();
  for (const q of data) {
    const existing = byDomain.get(q.domain) || [];
    existing.push(q);
    byDomain.set(q.domain, existing);
  }

  const selected: typeof data = [];
  for (const [, questions] of byDomain) {
    const easy = questions.filter((q) => q.difficulty <= 2);
    const medium = questions.filter((q) => q.difficulty === 3);
    const hard = questions.filter((q) => q.difficulty >= 4);

    if (easy.length > 0) selected.push(easy[0]);
    if (medium.length > 0) selected.push(medium[0]);
    if (hard.length > 0) selected.push(hard[0]);
  }

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected.map((q) => ({
    ...q,
    choices: (q.choices as string[]) || [],
  }));
}

export async function submitAssessment(
  studentId: string,
  answers: Record<string, string>,
  durationMinutes: number,
  parentEmail?: string,
  parentName?: string,
  studentName?: string,
  gradeHint?: number,
): Promise<PlacementResult | null> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const questionIds = Object.keys(answers);
  const { data: questions } = await supabase
    .from("diagnostic_questions")
    .select("id, domain, correct_answer, difficulty")
    .in("id", questionIds);

  if (!questions || questions.length === 0) return null;

  const domainResults: Record<string, { correct: number; total: number }> = {};

  for (const q of questions) {
    if (!domainResults[q.domain]) {
      domainResults[q.domain] = { correct: 0, total: 0 };
    }
    domainResults[q.domain].total++;
    if (answers[q.id] === q.correct_answer) {
      domainResults[q.domain].correct++;
    }
  }

  const domainScores: Record<string, DomainScore> = {};
  const domainScoreArray: DomainScore[] = [];

  for (const [domain, result] of Object.entries(domainResults)) {
    const score: DomainScore = {
      domain,
      correct: result.correct,
      total: result.total,
      percentage: Math.round((result.correct / result.total) * 100),
    };
    domainScores[domain] = score;
    domainScoreArray.push(score);
  }

  const totalCorrect = domainScoreArray.reduce((s, d) => s + d.correct, 0);
  const totalQuestions = domainScoreArray.reduce((s, d) => s + d.total, 0);
  const overallScore = Math.round((totalCorrect / totalQuestions) * 100);

  const sorted = [...domainScoreArray].sort(
    (a, b) => a.percentage - b.percentage,
  );
  const weakestDomain = sorted[0]?.domain || "";
  const strongestDomain = sorted[sorted.length - 1]?.domain || "";

  const program = selectProgram(overallScore);
  const recommendedProgram = program.name;
  const programTier = program.tier;
  const programDescription = program.description(gradeHint);
  const programPriceMonthly = program.priceMonthly;
  const programCadence = program.cadence;

  let assessmentId = `local-${Date.now()}`;

  if (user) {
    const { data: assessment, error } = await supabase
      .from("diagnostic_assessments")
      .insert({
        student_id: studentId,
        administered_by: user.id,
        assessment_type: "placement",
        questions: questionIds,
        answers,
        domain_scores: domainScores,
        overall_score: overallScore,
        recommended_program: recommendedProgram,
        started_at: new Date(
          Date.now() - durationMinutes * 60000,
        ).toISOString(),
        completed_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
      })
      .select("id")
      .single();

    if (!error && assessment) {
      assessmentId = assessment.id;
    }

    revalidatePath("/admin/summer-waitlist");
    revalidatePath("/tutor/portfolio");
  }

  const placementResult: PlacementResult = {
    recommendedProgram,
    programTier,
    programDescription,
    programPriceMonthly,
    programCadence,
    domainScores: domainScoreArray,
    overallScore,
    weakestDomain,
    strongestDomain,
    assessmentId,
  };

  if (parentEmail) {
    try {
      const template = emailTemplates.diagnosticResults({
        parentName: parentName || "Parent",
        studentName: studentName || "your child",
        overallScore,
        domainScores: domainScoreArray,
        recommendedProgram,
        programDescription,
        programPriceMonthly,
        programCadence,
        strongestDomain,
        weakestDomain,
      });

      const emailResult = await sendEmail({
        to: parentEmail,
        subject: template.subject,
        html: template.html,
        bcc: "mathpivot@mpingo.ai",
      });

      console.log(
        "[diagnostic email] sent to",
        parentEmail,
        "result:",
        emailResult,
      );
    } catch (err) {
      console.error("[diagnostic email] failed:", err);
    }
  }

  return placementResult;
}

export async function getStudentDiagnostics(studentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("diagnostic_assessments")
    .select(
      "id, overall_score, domain_scores, recommended_program, completed_at, duration_minutes",
    )
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false })
    .limit(5);

  return data || [];
}
