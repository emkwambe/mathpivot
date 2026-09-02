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

import { PROGRAMS, type ProgramTier } from "@/lib/stripe/programs";

export interface PlacementResult {
  recommendedProgram: string;
  programTier: ProgramTier;
  programDescription: string;
  programPriceMonthly: number;
  programCadence: string;
  domainScores: DomainScore[];
  overallScore: number;
  weakestDomain: string;
  strongestDomain: string;
  assessmentId: string;
}

// Placement description is longer than the pricing tagline — it's rendered
// in the diagnostic results email + results page after a real assessment,
// so it should speak to what the student's score revealed. Program name,
// price, and cadence come from the canonical PROGRAMS config so a pricing
// or copy change updates both surfaces in one place.
const PLACEMENT_DESCRIPTIONS: Record<ProgramTier, string> = {
  foundation:
    "Foundation coaching strengthens essential mathematics and resolves prerequisite gaps, establishing the mastery future learning depends upon — with a dedicated coach and a small mastery-matched cohort.",
  acceleration:
    "Acceleration coaching moves your student ahead of current course demands — deeper problem solving, enrichment, and preparation for increasingly advanced mathematics with a dedicated coach.",
  advanced:
    "Advanced coaching supports demanding mathematics — advanced high-school coursework, AP mathematics, competition preparation, and other specialized pathways — with pathway-specific opportunities beyond the weekly sessions.",
};

function selectProgramTier(overallScore: number): ProgramTier {
  if (overallScore < 40) return "foundation";
  if (overallScore < 70) return "acceleration";
  return "advanced";
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

  const programTier = selectProgramTier(overallScore);
  const program = PROGRAMS[programTier];
  const recommendedProgram = program.displayName;
  const programDescription = PLACEMENT_DESCRIPTIONS[programTier];
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
