"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type CodeResult = {
  success: boolean;
  error?: string;
  submissionId?: string;
};

// ============================================================
// GET CODE PROBLEMS (student view)
// ============================================================
export async function getCodeProblems(topic?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("code_problems")
    .select(
      "id, title, description, difficulty, language, topic, starter_code, hints, time_limit_ms",
    )
    .eq("is_active", true)
    .order("difficulty", { ascending: true });

  if (topic) query = query.eq("topic", topic);

  const { data, error } = await query;
  if (error) return { problems: [], error: error.message };
  return { problems: data || [], error: null };
}

// ============================================================
// GET PROBLEM DETAIL (with test cases for student — hidden ones excluded)
// ============================================================
export async function getProblemDetail(problemId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("code_problems")
    .select("*")
    .eq("id", problemId)
    .single();

  if (error || !data)
    return { problem: null, error: error?.message || "Not found" };

  // Filter out hidden test cases and solution for non-admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user?.id || "")
    .single();

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  const problem = {
    ...data,
    test_cases: isAdmin
      ? data.test_cases
      : (data.test_cases as { is_hidden?: boolean }[]).filter(
          (tc) => !tc.is_hidden,
        ),
    solution_code: isAdmin ? data.solution_code : null,
  };

  return { problem, error: null };
}

// ============================================================
// SUBMIT CODE (student)
// ============================================================
const submitSchema = z.object({
  problemId: z.string().uuid(),
  language: z.enum([
    "python",
    "javascript",
    "java",
    "cpp",
    "r",
    "sql",
    "pseudocode",
  ]),
  sourceCode: z.string().min(1).max(50000),
  homeworkItemId: z.string().uuid().optional(),
});

export async function submitCode(formData: FormData): Promise<CodeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = submitSchema.safeParse({
    problemId: formData.get("problemId"),
    language: formData.get("language"),
    sourceCode: formData.get("sourceCode"),
    homeworkItemId: formData.get("homeworkItemId") || undefined,
  });

  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  // Get problem test cases
  const { data: problem } = await supabase
    .from("code_problems")
    .select("test_cases, time_limit_ms")
    .eq("id", parsed.data.problemId)
    .single();

  if (!problem) return { success: false, error: "Problem not found" };

  const testCases = problem.test_cases as unknown[];
  const testsTotal = testCases.length;

  // For now, create submission as pending (actual execution would be done by a sandboxed runner)
  // In production, this would call an external code execution API (Judge0, Piston, etc.)
  const { data: submission, error } = await supabase
    .from("code_submissions")
    .insert({
      problem_id: parsed.data.problemId,
      student_user_id: user.id,
      homework_item_id: parsed.data.homeworkItemId || null,
      language: parsed.data.language,
      source_code: parsed.data.sourceCode,
      verdict: "pending",
      tests_total: testsTotal,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/student/homework");
  return { success: true, submissionId: submission?.id };
}

// ============================================================
// GET MY SUBMISSIONS (student)
// ============================================================
export async function getMySubmissions(problemId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { submissions: [], error: "Not authenticated" };

  let query = supabase
    .from("code_submissions")
    .select(
      `
      *,
      problem:problem_id (title, difficulty, language)
    `,
    )
    .eq("student_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (problemId) query = query.eq("problem_id", problemId);

  const { data, error } = await query;
  if (error) return { submissions: [], error: error.message };
  return { submissions: data || [], error: null };
}

// ============================================================
// CREATE CODE PROBLEM (admin)
// ============================================================
const problemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.enum([
    "python",
    "javascript",
    "java",
    "cpp",
    "r",
    "sql",
    "pseudocode",
  ]),
  starterCode: z.string().optional(),
  solutionCode: z.string().optional(),
  topic: z.string().optional(),
  timeLimitMs: z.coerce.number().int().default(5000),
});

export async function createCodeProblem(
  formData: FormData,
): Promise<CodeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const parsed = problemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    difficulty: formData.get("difficulty"),
    language: formData.get("language"),
    starterCode: formData.get("starterCode") || undefined,
    solutionCode: formData.get("solutionCode") || undefined,
    topic: formData.get("topic") || undefined,
    timeLimitMs: formData.get("timeLimitMs") || 5000,
  });

  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const testCasesRaw = formData.get("testCases") as string;
  let testCases: unknown[] = [];
  try {
    testCases = testCasesRaw ? JSON.parse(testCasesRaw) : [];
  } catch {
    return { success: false, error: "Invalid test cases JSON" };
  }

  const { error } = await supabase.from("code_problems").insert({
    title: parsed.data.title,
    description: parsed.data.description,
    difficulty: parsed.data.difficulty,
    language: parsed.data.language,
    starter_code: parsed.data.starterCode || null,
    solution_code: parsed.data.solutionCode || null,
    topic: parsed.data.topic || null,
    time_limit_ms: parsed.data.timeLimitMs,
    test_cases: testCases,
    created_by: user?.id || null,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/code-problems");
  return { success: true };
}

// ============================================================
// GRADE SUBMISSION (tutor/admin manual review)
// ============================================================
export async function gradeSubmission(
  submissionId: string,
  score: number,
  feedback: string,
): Promise<CodeResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("code_submissions")
    .update({
      verdict: "manual_review",
      score,
      tutor_feedback: feedback,
    })
    .eq("id", submissionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
