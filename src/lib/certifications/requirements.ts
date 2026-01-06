/**
 * Certification Requirements Engine
 * Evaluates whether a user meets certification requirements
 */

import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';

// Requirement types
export type RequirementType =
  | 'skills_mastered'
  | 'skill_count'
  | 'hours_logged'
  | 'sessions_completed'
  | 'assessment_passed'
  | 'project_submitted'
  | 'tutor_signoff'
  | 'prerequisite_cert'
  | 'external_score'
  | 'attendance'
  | 'competition_score';

export interface Requirement {
  id: string;
  program_id: string;
  requirement_type: RequirementType;
  name: string;
  description: string | null;
  parameters: Record<string, unknown>;
  is_required: boolean;
  group_id: string | null;
  weight: number;
  display_order: number;
}

export interface RequirementResult {
  requirement_id: string;
  requirement_type: RequirementType;
  name: string;
  completed: boolean;
  progress: number; // 0-100
  details: Record<string, unknown>;
  completed_at?: string;
}

export interface RequirementsCheckResult {
  program_id: string;
  user_id: string;
  all_required_met: boolean;
  completion_percentage: number;
  requirements: RequirementResult[];
  ready_for_certification: boolean;
}

// =============================================================================
// REQUIREMENT EVALUATORS
// =============================================================================

type RequirementEvaluator = (
  userId: string,
  params: Record<string, unknown>
) => Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }>;

/**
 * Check if user has mastered specific skills
 */
async function evaluateSkillsMastered(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const skillIds = params.skill_ids as string[];
  const minLevel = (params.min_level as number) || 3;

  if (!skillIds || skillIds.length === 0) {
    return { completed: true, progress: 100, details: { message: 'No skills required' } };
  }

  // Get user's skill levels
  const { data: userSkills } = await supabaseAdmin
    .from('student_skills')
    .select('skill_id, current_level')
    .eq('student_id', userId)
    .in('skill_id', skillIds)
    .gte('current_level', minLevel);

  const masteredCount = userSkills?.length || 0;
  const totalRequired = skillIds.length;
  const progress = (masteredCount / totalRequired) * 100;

  return {
    completed: masteredCount >= totalRequired,
    progress,
    details: {
      mastered: masteredCount,
      required: totalRequired,
      min_level: minLevel,
      mastered_skill_ids: userSkills?.map(s => s.skill_id) || [],
    },
  };
}

/**
 * Check if user has mastered N skills in a category
 */
async function evaluateSkillCount(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const category = params.category as string;
  const minCount = (params.min_count as number) || 1;
  const minLevel = (params.min_level as number) || 3;

  // Get skills in category
  const { data: categorySkills } = await supabaseAdmin
    .from('skills')
    .select('id')
    .eq('category', category);

  if (!categorySkills || categorySkills.length === 0) {
    return { completed: false, progress: 0, details: { error: 'Category not found' } };
  }

  const skillIds = categorySkills.map(s => s.id);

  // Get user's mastered skills in this category
  const { data: userSkills } = await supabaseAdmin
    .from('student_skills')
    .select('skill_id, current_level')
    .eq('student_id', userId)
    .in('skill_id', skillIds)
    .gte('current_level', minLevel);

  const masteredCount = userSkills?.length || 0;
  const progress = Math.min((masteredCount / minCount) * 100, 100);

  return {
    completed: masteredCount >= minCount,
    progress,
    details: {
      category,
      mastered: masteredCount,
      required: minCount,
      min_level: minLevel,
    },
  };
}

/**
 * Check tutoring hours logged
 */
async function evaluateHoursLogged(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const minHours = (params.min_hours as number) || 1;
  const category = params.category as string | undefined;

  // Get completed sessions
  let query = supabaseAdmin
    .from('bookings')
    .select('duration_minutes')
    .eq('student_id', userId)
    .eq('status', 'completed');

  // If category specified, join with products to filter
  // For simplicity, we'll count all completed sessions
  const { data: sessions } = await query;

  const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 60), 0) || 0;
  const totalHours = totalMinutes / 60;
  const progress = Math.min((totalHours / minHours) * 100, 100);

  return {
    completed: totalHours >= minHours,
    progress,
    details: {
      hours_logged: Math.round(totalHours * 10) / 10,
      hours_required: minHours,
      category: category || 'all',
    },
  };
}

/**
 * Check number of sessions completed
 */
async function evaluateSessionsCompleted(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const minSessions = (params.min_sessions as number) || 1;
  const sessionType = params.session_type as string | undefined;

  let query = supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact' })
    .eq('student_id', userId)
    .eq('status', 'completed');

  if (sessionType) {
    query = query.eq('session_type', sessionType);
  }

  const { count } = await query;
  const sessionsCompleted = count || 0;
  const progress = Math.min((sessionsCompleted / minSessions) * 100, 100);

  return {
    completed: sessionsCompleted >= minSessions,
    progress,
    details: {
      sessions_completed: sessionsCompleted,
      sessions_required: minSessions,
      session_type: sessionType || 'any',
    },
  };
}

/**
 * Check if user passed an assessment
 */
async function evaluateAssessmentPassed(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const assessmentId = params.assessment_id as string;
  const minScore = (params.min_score as number) || 70;

  // Get best attempt
  const { data: attempts } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, percentage_score, passed, submitted_at')
    .eq('user_id', userId)
    .eq('assessment_id', assessmentId)
    .eq('status', 'graded')
    .order('percentage_score', { ascending: false })
    .limit(1);

  const bestAttempt = attempts?.[0];

  if (!bestAttempt) {
    return {
      completed: false,
      progress: 0,
      details: {
        assessment_id: assessmentId,
        min_score: minScore,
        message: 'No attempts found',
      },
    };
  }

  const score = bestAttempt.percentage_score || 0;
  const progress = Math.min((score / minScore) * 100, 100);

  return {
    completed: score >= minScore,
    progress,
    details: {
      assessment_id: assessmentId,
      best_score: score,
      min_score: minScore,
      attempt_id: bestAttempt.id,
      completed_at: bestAttempt.submitted_at,
    },
  };
}

/**
 * Check if project was submitted and approved
 */
async function evaluateProjectSubmitted(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const projectAssessmentId = params.project_assessment_id as string;
  const minScore = (params.min_score as number) || 70;

  // Check for graded project submission
  const { data: attempts } = await supabaseAdmin
    .from('assessment_attempts')
    .select('id, percentage_score, passed, submitted_at')
    .eq('user_id', userId)
    .eq('assessment_id', projectAssessmentId)
    .eq('status', 'graded')
    .order('percentage_score', { ascending: false })
    .limit(1);

  const bestAttempt = attempts?.[0];

  if (!bestAttempt) {
    return {
      completed: false,
      progress: 0,
      details: {
        project_id: projectAssessmentId,
        message: 'No project submitted',
      },
    };
  }

  const score = bestAttempt.percentage_score || 0;

  return {
    completed: score >= minScore,
    progress: score >= minScore ? 100 : 50, // 50% for submitted but not passing
    details: {
      project_id: projectAssessmentId,
      score,
      min_score: minScore,
      submitted_at: bestAttempt.submitted_at,
    },
  };
}

/**
 * Check for tutor sign-off
 */
async function evaluateTutorSignoff(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const signoffType = params.signoff_type as string;
  const programId = params.program_id as string;

  // Check for tutor sign-off in progress record
  const { data: progress } = await supabaseAdmin
    .from('user_certification_progress')
    .select('requirements_completed')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .single();

  const reqCompleted = progress?.requirements_completed as Record<string, { completed: boolean; tutor_id?: string }>;
  const signoffReq = reqCompleted?.[signoffType];

  return {
    completed: signoffReq?.completed || false,
    progress: signoffReq?.completed ? 100 : 0,
    details: {
      signoff_type: signoffType,
      tutor_id: signoffReq?.tutor_id,
    },
  };
}

/**
 * Check for prerequisite certification
 */
async function evaluatePrerequisiteCert(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const prereqProgramId = params.program_id as string;

  // Check if user has active certification
  const { data: cert } = await supabaseAdmin
    .from('user_certifications')
    .select('id, credential_number, earned_at, valid_until')
    .eq('user_id', userId)
    .eq('program_id', prereqProgramId)
    .eq('status', 'active')
    .single();

  if (!cert) {
    // Check progress on prerequisite
    const { data: progress } = await supabaseAdmin
      .from('user_certification_progress')
      .select('completion_percentage')
      .eq('user_id', userId)
      .eq('program_id', prereqProgramId)
      .single();

    return {
      completed: false,
      progress: progress?.completion_percentage || 0,
      details: {
        prerequisite_program_id: prereqProgramId,
        message: 'Prerequisite certification not earned',
        prereq_progress: progress?.completion_percentage || 0,
      },
    };
  }

  // Check if still valid
  if (cert.valid_until && new Date(cert.valid_until) < new Date()) {
    return {
      completed: false,
      progress: 0,
      details: {
        prerequisite_program_id: prereqProgramId,
        message: 'Prerequisite certification expired',
        expired_at: cert.valid_until,
      },
    };
  }

  return {
    completed: true,
    progress: 100,
    details: {
      prerequisite_program_id: prereqProgramId,
      credential_number: cert.credential_number,
      earned_at: cert.earned_at,
    },
  };
}

/**
 * Check external exam score
 */
async function evaluateExternalScore(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const examType = params.exam_type as string;
  const minScore = params.min_score as number;

  // Get verified external score
  const { data: scores } = await supabaseAdmin
    .from('external_exam_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('exam_type', examType)
    .eq('verified', true)
    .eq('is_active', true)
    .order('score', { ascending: false })
    .limit(1);

  const bestScore = scores?.[0];

  if (!bestScore) {
    return {
      completed: false,
      progress: 0,
      details: {
        exam_type: examType,
        min_score: minScore,
        message: 'No verified score found',
      },
    };
  }

  const progress = Math.min((bestScore.score / minScore) * 100, 100);

  return {
    completed: bestScore.score >= minScore,
    progress,
    details: {
      exam_type: examType,
      score: bestScore.score,
      min_score: minScore,
      exam_date: bestScore.exam_date,
    },
  };
}

/**
 * Check camp/event attendance
 */
async function evaluateAttendance(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const programId = params.program_id as string;
  const minAttendance = (params.min_attendance_percentage as number) || 80;

  // Check camp registration and attendance
  const { data: registration } = await supabaseAdmin
    .from('camp_registrations')
    .select(`
      *,
      camp:camps(*)
    `)
    .eq('student_id', userId)
    .eq('camp_id', programId)
    .single();

  if (!registration) {
    return {
      completed: false,
      progress: 0,
      details: {
        program_id: programId,
        message: 'Not registered for program',
      },
    };
  }

  const attendancePercentage = registration.attendance_percentage || 0;
  const progress = Math.min((attendancePercentage / minAttendance) * 100, 100);

  return {
    completed: attendancePercentage >= minAttendance,
    progress,
    details: {
      program_id: programId,
      attendance_percentage: attendancePercentage,
      min_attendance: minAttendance,
    },
  };
}

/**
 * Check competition placement
 */
async function evaluateCompetitionScore(
  userId: string,
  params: Record<string, unknown>
): Promise<{ completed: boolean; progress: number; details: Record<string, unknown> }> {
  if (!isAdminConfigured()) {
    return { completed: false, progress: 0, details: { error: 'Admin not configured' } };
  }

  const competitionId = params.competition_id as string;
  const minScore = params.min_score as number | undefined;
  const maxRank = params.max_rank as number | undefined;
  const minPercentile = params.min_percentile as number | undefined;

  // Get competition result
  const { data: result } = await supabaseAdmin
    .from('competition_registrations')
    .select('*')
    .eq('student_id', userId)
    .eq('competition_id', competitionId)
    .single();

  if (!result || !result.final_score) {
    return {
      completed: false,
      progress: 0,
      details: {
        competition_id: competitionId,
        message: 'No competition result found',
      },
    };
  }

  let completed = false;

  if (minScore !== undefined && result.final_score >= minScore) {
    completed = true;
  }
  if (maxRank !== undefined && result.final_rank && result.final_rank <= maxRank) {
    completed = true;
  }
  if (minPercentile !== undefined && result.percentile && result.percentile >= minPercentile) {
    completed = true;
  }

  return {
    completed,
    progress: completed ? 100 : 50,
    details: {
      competition_id: competitionId,
      score: result.final_score,
      rank: result.final_rank,
      percentile: result.percentile,
      criteria: { minScore, maxRank, minPercentile },
    },
  };
}

// Evaluator registry
const evaluators: Record<RequirementType, RequirementEvaluator> = {
  skills_mastered: evaluateSkillsMastered,
  skill_count: evaluateSkillCount,
  hours_logged: evaluateHoursLogged,
  sessions_completed: evaluateSessionsCompleted,
  assessment_passed: evaluateAssessmentPassed,
  project_submitted: evaluateProjectSubmitted,
  tutor_signoff: evaluateTutorSignoff,
  prerequisite_cert: evaluatePrerequisiteCert,
  external_score: evaluateExternalScore,
  attendance: evaluateAttendance,
  competition_score: evaluateCompetitionScore,
};

// =============================================================================
// MAIN API
// =============================================================================

/**
 * Check all requirements for a certification program
 */
export async function checkRequirements(
  userId: string,
  programId: string
): Promise<RequirementsCheckResult> {
  if (!isAdminConfigured()) {
    throw new Error('Admin client not configured');
  }

  // Get all requirements for the program
  const { data: requirements, error } = await supabaseAdmin
    .from('certification_requirements')
    .select('*')
    .eq('program_id', programId)
    .order('display_order');

  if (error) throw error;

  const results: RequirementResult[] = [];
  const groupResults: Record<string, RequirementResult[]> = {};

  // Evaluate each requirement
  for (const req of requirements || []) {
    const evaluator = evaluators[req.requirement_type as RequirementType];

    if (!evaluator) {
      results.push({
        requirement_id: req.id,
        requirement_type: req.requirement_type,
        name: req.name,
        completed: false,
        progress: 0,
        details: { error: `Unknown requirement type: ${req.requirement_type}` },
      });
      continue;
    }

    const evalResult = await evaluator(userId, req.parameters);

    const result: RequirementResult = {
      requirement_id: req.id,
      requirement_type: req.requirement_type,
      name: req.name,
      completed: evalResult.completed,
      progress: evalResult.progress,
      details: evalResult.details,
      completed_at: evalResult.details.completed_at as string | undefined,
    };

    // Handle grouping (OR logic)
    if (req.group_id) {
      if (!groupResults[req.group_id]) {
        groupResults[req.group_id] = [];
      }
      groupResults[req.group_id].push(result);
    }

    results.push(result);
  }

  // Calculate overall completion
  let requiredMet = 0;
  let requiredTotal = 0;

  const processedGroups = new Set<string>();

  for (const req of requirements || []) {
    if (!req.is_required) continue;

    if (req.group_id) {
      // For grouped requirements (OR logic), only count once per group
      if (processedGroups.has(req.group_id)) continue;
      processedGroups.add(req.group_id);

      const groupReqs = groupResults[req.group_id] || [];
      const anyCompleted = groupReqs.some(r => r.completed);

      requiredTotal++;
      if (anyCompleted) requiredMet++;
    } else {
      // Individual requirement
      const result = results.find(r => r.requirement_id === req.id);
      requiredTotal++;
      if (result?.completed) requiredMet++;
    }
  }

  const completionPercentage = requiredTotal > 0 ? (requiredMet / requiredTotal) * 100 : 0;

  return {
    program_id: programId,
    user_id: userId,
    all_required_met: requiredMet === requiredTotal,
    completion_percentage: Math.round(completionPercentage * 100) / 100,
    requirements: results,
    ready_for_certification: requiredMet === requiredTotal,
  };
}

/**
 * Update user's certification progress
 */
export async function updateProgress(userId: string, programId: string): Promise<void> {
  if (!isAdminConfigured()) return;

  const result = await checkRequirements(userId, programId);

  // Build requirements_completed object
  const requirementsCompleted: Record<string, { completed: boolean; completed_at?: string; progress: number }> = {};

  for (const req of result.requirements) {
    requirementsCompleted[req.requirement_id] = {
      completed: req.completed,
      completed_at: req.completed_at,
      progress: req.progress,
    };
  }

  // Upsert progress record
  await supabaseAdmin
    .from('user_certification_progress')
    .upsert({
      user_id: userId,
      program_id: programId,
      requirements_completed: requirementsCompleted,
      completion_percentage: result.completion_percentage,
      status: result.ready_for_certification ? 'ready_for_cert' : 'in_progress',
      last_activity_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,program_id',
    });
}

/**
 * Get user's progress on all certifications
 */
export async function getUserProgress(userId: string): Promise<{
  program_id: string;
  program_name: string;
  program_code: string;
  level: string;
  completion_percentage: number;
  status: string;
}[]> {
  if (!isAdminConfigured()) return [];

  const { data } = await supabaseAdmin
    .from('user_certification_progress')
    .select(`
      program_id,
      completion_percentage,
      status,
      program:certification_programs(name, code, level)
    `)
    .eq('user_id', userId);

  return (data || []).map(p => ({
    program_id: p.program_id,
    program_name: (p.program as unknown as { name: string })?.name || '',
    program_code: (p.program as unknown as { code: string })?.code || '',
    level: (p.program as unknown as { level: string })?.level || 'foundation',
    completion_percentage: p.completion_percentage,
    status: p.status,
  }));
}
