/**
 * Assessment System for Certifications
 * Handles quiz creation, taking, and grading
 */

import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import { updateProgress } from './requirements';

export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'numeric'
  | 'short_answer'
  | 'essay'
  | 'math_expression'
  | 'graphing'
  | 'code';

export type AssessmentType =
  | 'quiz'
  | 'timed_challenge'
  | 'project'
  | 'demonstration'
  | 'portfolio'
  | 'oral_exam'
  | 'practical';

export interface Assessment {
  id: string;
  code: string;
  title: string;
  description: string | null;
  instructions: string | null;
  assessment_type: AssessmentType;
  time_limit_minutes: number | null;
  available_from: string | null;
  available_until: string | null;
  max_attempts: number;
  cooldown_hours: number;
  passing_score: number;
  max_score: number;
  question_count: number | null;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
  requires_proctoring: boolean;
  allows_calculator: boolean;
  allows_notes: boolean;
  program_id?: string;
}

export interface Question {
  id: string;
  question_type: QuestionType;
  question_text: string;
  question_html: string | null;
  question_image_url: string | null;
  latex_content: string | null;
  options: { id: string; text: string; image_url?: string }[] | null;
  points: number;
  hint: string | null;
  difficulty: number;
  // Note: correct_answer is NOT included for client-side
}

export interface QuestionWithAnswer extends Question {
  correct_answer: unknown;
  explanation: string | null;
  partial_credit: boolean;
  partial_credit_rules: unknown;
}

export interface AttemptResponse {
  question_id: string;
  response: unknown;
  response_text?: string;
}

export interface AttemptResult {
  attempt_id: string;
  raw_score: number;
  max_score: number;
  percentage_score: number;
  passed: boolean;
  time_spent_seconds: number;
  results: {
    question_id: string;
    is_correct: boolean;
    points_earned: number;
    max_points: number;
    correct_answer?: unknown;
    explanation?: string;
  }[];
}

// =============================================================================
// ASSESSMENT RETRIEVAL
// =============================================================================

/**
 * Get assessment details (without questions)
 */
export async function getAssessment(assessmentId: string): Promise<Assessment | null> {
  if (!isAdminConfigured()) return null;

  const { data } = await supabaseAdmin
    .from('certification_assessments')
    .select('*')
    .eq('id', assessmentId)
    .eq('is_active', true)
    .single();

  return data as Assessment | null;
}

/**
 * Get assessments for a certification program
 */
export async function getAssessmentsForProgram(programId: string): Promise<Assessment[]> {
  if (!isAdminConfigured()) return [];

  const { data } = await supabaseAdmin
    .from('certification_assessments')
    .select('*')
    .eq('program_id', programId)
    .eq('is_active', true);

  return (data || []) as Assessment[];
}

/**
 * Check if user can start an assessment attempt
 */
export async function canStartAttempt(
  userId: string,
  assessmentId: string
): Promise<{ allowed: boolean; reason?: string; next_available_at?: string }> {
  if (!isAdminConfigured()) {
    return { allowed: false, reason: 'System not configured' };
  }

  const assessment = await getAssessment(assessmentId);
  if (!assessment) {
    return { allowed: false, reason: 'Assessment not found' };
  }

  // Check availability window
  const now = new Date();
  if (assessment.available_from && new Date(assessment.available_from) > now) {
    return { allowed: false, reason: 'Assessment not yet available' };
  }
  if (assessment.available_until && new Date(assessment.available_until) < now) {
    return { allowed: false, reason: 'Assessment no longer available' };
  }

  // Check existing attempts
  const { data: attempts } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: false });

  // Check for in-progress attempt
  const inProgress = attempts?.find(a => a.status === 'in_progress');
  if (inProgress) {
    // Check if timed out
    if (assessment.time_limit_minutes) {
      const startTime = new Date(inProgress.started_at);
      const elapsed = (now.getTime() - startTime.getTime()) / 1000 / 60;
      if (elapsed < assessment.time_limit_minutes) {
        return { allowed: false, reason: 'You have an attempt in progress' };
      }
      // Auto-expire the old attempt
      await supabaseAdmin
        .from('assessment_attempts')
        .update({ status: 'expired' })
        .eq('id', inProgress.id);
    }
  }

  // Check max attempts
  const completedAttempts = attempts?.filter(a =>
    ['submitted', 'graded', 'expired'].includes(a.status)
  ).length || 0;

  if (completedAttempts >= assessment.max_attempts) {
    return { allowed: false, reason: 'Maximum attempts reached' };
  }

  // Check cooldown
  const lastAttempt = attempts?.[0];
  if (lastAttempt && assessment.cooldown_hours > 0) {
    const lastAttemptTime = new Date(lastAttempt.submitted_at || lastAttempt.created_at);
    const cooldownEnd = new Date(lastAttemptTime.getTime() + assessment.cooldown_hours * 60 * 60 * 1000);
    if (now < cooldownEnd) {
      return {
        allowed: false,
        reason: 'Cooldown period active',
        next_available_at: cooldownEnd.toISOString(),
      };
    }
  }

  return { allowed: true };
}

// =============================================================================
// ATTEMPT MANAGEMENT
// =============================================================================

/**
 * Start a new assessment attempt
 */
export async function startAttempt(
  userId: string,
  assessmentId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{
  attempt_id: string;
  questions: Question[];
  time_limit_minutes: number | null;
  started_at: string;
} | null> {
  if (!isAdminConfigured()) return null;

  // Verify user can start
  const canStart = await canStartAttempt(userId, assessmentId);
  if (!canStart.allowed) {
    throw new Error(canStart.reason);
  }

  const assessment = await getAssessment(assessmentId);
  if (!assessment) throw new Error('Assessment not found');

  // Get questions
  const query = supabaseAdmin
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('is_active', true);

  const { data: allQuestions } = await query;

  if (!allQuestions || allQuestions.length === 0) {
    throw new Error('No questions found for assessment');
  }

  // Select and optionally randomize questions
  let selectedQuestions = [...allQuestions];

  if (assessment.randomize_questions) {
    selectedQuestions = shuffleArray(selectedQuestions);
  }

  if (assessment.question_count && assessment.question_count < selectedQuestions.length) {
    selectedQuestions = selectedQuestions.slice(0, assessment.question_count);
  }

  // Create attempt record
  const { data: attempt, error } = await supabaseAdmin
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      user_id: userId,
      attempt_number: await getNextAttemptNumber(userId, assessmentId),
      started_at: new Date().toISOString(),
      question_order: selectedQuestions.map(q => q.id),
      status: 'in_progress',
      user_agent: userAgent,
      ip_address: ipAddress,
    })
    .select()
    .single();

  if (error) throw error;

  // Prepare questions for client (without correct answers)
  const clientQuestions: Question[] = selectedQuestions.map(q => {
    const question: Question = {
      id: q.id,
      question_type: q.question_type,
      question_text: q.question_text,
      question_html: q.question_html,
      question_image_url: q.question_image_url,
      latex_content: q.latex_content,
      options: q.options,
      points: q.points,
      hint: q.hint,
      difficulty: q.difficulty,
    };

    // Randomize options if configured
    if (assessment.randomize_options && question.options) {
      question.options = shuffleArray(question.options);
    }

    return question;
  });

  return {
    attempt_id: attempt.id,
    questions: clientQuestions,
    time_limit_minutes: assessment.time_limit_minutes,
    started_at: attempt.started_at,
  };
}

/**
 * Save a response during an attempt
 */
export async function saveResponse(
  attemptId: string,
  userId: string,
  questionId: string,
  response: unknown,
  responseText?: string
): Promise<void> {
  if (!isAdminConfigured()) return;

  // Verify attempt belongs to user and is in progress
  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .single();

  if (!attempt) throw new Error('Invalid or expired attempt');

  // Upsert response
  await supabaseAdmin
    .from('assessment_responses')
    .upsert({
      attempt_id: attemptId,
      question_id: questionId,
      response,
      response_text: responseText,
      answered_at: new Date().toISOString(),
    }, {
      onConflict: 'attempt_id,question_id',
    });
}

/**
 * Submit an assessment attempt for grading
 */
export async function submitAttempt(
  attemptId: string,
  userId: string,
  responses?: AttemptResponse[]
): Promise<AttemptResult> {
  if (!isAdminConfigured()) throw new Error('System not configured');

  // Verify attempt belongs to user and is in progress
  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*, assessment:certification_assessments(*)')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .single();

  if (!attempt) throw new Error('Invalid or expired attempt');

  const assessment = attempt.assessment as unknown as Assessment;

  // Save any final responses
  if (responses) {
    for (const resp of responses) {
      await saveResponse(attemptId, userId, resp.question_id, resp.response, resp.response_text);
    }
  }

  // Get all responses and questions
  const { data: savedResponses } = await supabaseAdmin
    .from('assessment_responses')
    .select('*')
    .eq('attempt_id', attemptId);

  const questionIds = attempt.question_order as string[];
  const { data: questions } = await supabaseAdmin
    .from('assessment_questions')
    .select('*')
    .in('id', questionIds);

  // Grade each response
  const results: AttemptResult['results'] = [];
  let totalEarned = 0;
  let totalPossible = 0;

  for (const question of questions || []) {
    const response = savedResponses?.find(r => r.question_id === question.id);
    const gradeResult = gradeQuestion(question, response?.response);

    totalEarned += gradeResult.points_earned;
    totalPossible += question.points;

    // Update response record
    if (response) {
      await supabaseAdmin
        .from('assessment_responses')
        .update({
          is_correct: gradeResult.is_correct,
          points_earned: gradeResult.points_earned,
          max_points: question.points,
          auto_feedback: gradeResult.feedback,
        })
        .eq('id', response.id);
    }

    results.push({
      question_id: question.id,
      is_correct: gradeResult.is_correct,
      points_earned: gradeResult.points_earned,
      max_points: question.points,
      correct_answer: assessment.show_correct_answers ? question.correct_answer : undefined,
      explanation: assessment.show_explanations ? question.explanation : undefined,
    });
  }

  // Calculate final score
  const percentageScore = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
  const passed = percentageScore >= assessment.passing_score;

  // Calculate time spent
  const startTime = new Date(attempt.started_at);
  const endTime = new Date();
  const timeSpentSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  // Update attempt record
  await supabaseAdmin
    .from('assessment_attempts')
    .update({
      submitted_at: endTime.toISOString(),
      time_spent_seconds: timeSpentSeconds,
      raw_score: totalEarned,
      max_possible_score: totalPossible,
      percentage_score: Math.round(percentageScore * 100) / 100,
      passed,
      status: 'graded',
    })
    .eq('id', attemptId);

  // Update certification progress if linked to a program
  if (attempt.assessment.program_id) {
    await updateProgress(userId, attempt.assessment.program_id);
  }

  return {
    attempt_id: attemptId,
    raw_score: totalEarned,
    max_score: totalPossible,
    percentage_score: Math.round(percentageScore * 100) / 100,
    passed,
    time_spent_seconds: timeSpentSeconds,
    results,
  };
}

/**
 * Get attempt history for a user
 */
export async function getAttemptHistory(
  userId: string,
  assessmentId?: string
): Promise<{
  id: string;
  assessment_id: string;
  assessment_title: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  percentage_score: number | null;
  passed: boolean | null;
  status: string;
}[]> {
  if (!isAdminConfigured()) return [];

  let query = supabaseAdmin
    .from('assessment_attempts')
    .select(`
      id,
      assessment_id,
      attempt_number,
      started_at,
      submitted_at,
      percentage_score,
      passed,
      status,
      assessment:certification_assessments(title)
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (assessmentId) {
    query = query.eq('assessment_id', assessmentId);
  }

  const { data } = await query;

  return (data || []).map(a => ({
    id: a.id,
    assessment_id: a.assessment_id,
    assessment_title: (a.assessment as unknown as { title: string })?.title || '',
    attempt_number: a.attempt_number,
    started_at: a.started_at,
    submitted_at: a.submitted_at,
    percentage_score: a.percentage_score,
    passed: a.passed,
    status: a.status,
  }));
}

// =============================================================================
// GRADING
// =============================================================================

interface GradeResult {
  is_correct: boolean;
  points_earned: number;
  feedback?: string;
}

/**
 * Grade a single question
 */
function gradeQuestion(question: QuestionWithAnswer, response: unknown): GradeResult {
  if (response === null || response === undefined) {
    return { is_correct: false, points_earned: 0, feedback: 'No answer provided' };
  }

  const correctAnswer = question.correct_answer;
  const maxPoints = question.points;

  switch (question.question_type) {
    case 'multiple_choice':
    case 'true_false':
      return gradeExactMatch(response, correctAnswer, maxPoints);

    case 'multiple_select':
      return gradeMultipleSelect(response as string[], correctAnswer as string[], maxPoints, question.partial_credit);

    case 'numeric':
      return gradeNumeric(response as number, correctAnswer as { value: number; tolerance?: number }, maxPoints);

    case 'math_expression':
      return gradeMathExpression(response as string, correctAnswer as { expression: string; equivalents?: string[] }, maxPoints);

    case 'short_answer':
      return gradeShortAnswer(response as string, correctAnswer as string | string[], maxPoints);

    case 'essay':
    case 'code':
    case 'graphing':
      // These require manual grading
      return { is_correct: false, points_earned: 0, feedback: 'Pending manual review' };

    default:
      return gradeExactMatch(response, correctAnswer, maxPoints);
  }
}

function gradeExactMatch(response: unknown, correct: unknown, maxPoints: number): GradeResult {
  const isCorrect = JSON.stringify(response) === JSON.stringify(correct);
  return {
    is_correct: isCorrect,
    points_earned: isCorrect ? maxPoints : 0,
  };
}

function gradeMultipleSelect(
  response: string[],
  correct: string[],
  maxPoints: number,
  partialCredit: boolean = false
): GradeResult {
  if (!Array.isArray(response)) {
    return { is_correct: false, points_earned: 0 };
  }

  const responseSet = new Set(response);
  const correctSet = new Set(correct);

  // Check for exact match
  if (
    responseSet.size === correctSet.size &&
    [...responseSet].every(r => correctSet.has(r))
  ) {
    return { is_correct: true, points_earned: maxPoints };
  }

  if (!partialCredit) {
    return { is_correct: false, points_earned: 0 };
  }

  // Partial credit: points for correct answers, minus points for incorrect
  let correctCount = 0;
  let incorrectCount = 0;

  for (const r of responseSet) {
    if (correctSet.has(r)) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  // Partial score: correct answers minus wrong answers, normalized
  const partialScore = Math.max(0, (correctCount - incorrectCount) / correct.length);
  const pointsEarned = Math.round(maxPoints * partialScore * 100) / 100;

  return {
    is_correct: false,
    points_earned: pointsEarned,
    feedback: `${correctCount} correct, ${incorrectCount} incorrect`,
  };
}

function gradeNumeric(
  response: number,
  correct: { value: number; tolerance?: number },
  maxPoints: number
): GradeResult {
  const tolerance = correct.tolerance || 0;
  const diff = Math.abs(response - correct.value);
  const isCorrect = diff <= tolerance;

  return {
    is_correct: isCorrect,
    points_earned: isCorrect ? maxPoints : 0,
    feedback: isCorrect ? undefined : `Expected ${correct.value} (±${tolerance})`,
  };
}

function gradeMathExpression(
  response: string,
  correct: { expression: string; equivalents?: string[] },
  maxPoints: number
): GradeResult {
  // Normalize expressions for comparison
  const normalize = (expr: string) => expr.replace(/\s+/g, '').toLowerCase();

  const normalizedResponse = normalize(response);
  const normalizedCorrect = normalize(correct.expression);

  if (normalizedResponse === normalizedCorrect) {
    return { is_correct: true, points_earned: maxPoints };
  }

  // Check equivalents
  if (correct.equivalents) {
    for (const equiv of correct.equivalents) {
      if (normalizedResponse === normalize(equiv)) {
        return { is_correct: true, points_earned: maxPoints };
      }
    }
  }

  // TODO: Add symbolic math equivalence checking (e.g., using mathjs)
  return { is_correct: false, points_earned: 0 };
}

function gradeShortAnswer(
  response: string,
  correct: string | string[],
  maxPoints: number
): GradeResult {
  const normalizedResponse = response.trim().toLowerCase();

  const acceptedAnswers = Array.isArray(correct) ? correct : [correct];

  for (const answer of acceptedAnswers) {
    if (normalizedResponse === answer.trim().toLowerCase()) {
      return { is_correct: true, points_earned: maxPoints };
    }
  }

  return { is_correct: false, points_earned: 0 };
}

// =============================================================================
// HELPERS
// =============================================================================

async function getNextAttemptNumber(userId: string, assessmentId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('assessment_id', assessmentId);

  return (count || 0) + 1;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Manually grade a response (for essay, code, etc.)
 */
export async function manualGrade(
  responseId: string,
  graderId: string,
  pointsEarned: number,
  feedback: string
): Promise<void> {
  if (!isAdminConfigured()) return;

  await supabaseAdmin
    .from('assessment_responses')
    .update({
      points_earned: pointsEarned,
      manual_feedback: feedback,
      graded_by: graderId,
      is_correct: pointsEarned > 0,
    })
    .eq('id', responseId);

  // Re-calculate attempt score
  const { data: response } = await supabaseAdmin
    .from('assessment_responses')
    .select('attempt_id')
    .eq('id', responseId)
    .single();

  if (response) {
    await recalculateAttemptScore(response.attempt_id);
  }
}

/**
 * Recalculate attempt score after manual grading
 */
async function recalculateAttemptScore(attemptId: string): Promise<void> {
  const { data: responses } = await supabaseAdmin
    .from('assessment_responses')
    .select('points_earned, max_points')
    .eq('attempt_id', attemptId);

  if (!responses) return;

  const totalEarned = responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
  const totalPossible = responses.reduce((sum, r) => sum + (r.max_points || 0), 0);
  const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

  const { data: attempt } = await supabaseAdmin
    .from('assessment_attempts')
    .select('assessment:certification_assessments(passing_score)')
    .eq('id', attemptId)
    .single();

  const passingScore = (attempt?.assessment as unknown as { passing_score: number })?.passing_score || 70;

  await supabaseAdmin
    .from('assessment_attempts')
    .update({
      raw_score: totalEarned,
      max_possible_score: totalPossible,
      percentage_score: Math.round(percentage * 100) / 100,
      passed: percentage >= passingScore,
      status: 'graded',
      graded_at: new Date().toISOString(),
    })
    .eq('id', attemptId);
}
