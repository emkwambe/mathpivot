import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import {
  getCertificationProgram,
  checkRequirements,
  getAssessmentsForProgram,
  getAttemptHistory,
} from '@/lib/certifications';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ programId: string }>;
}

export default async function CertificationProgramPage({ params }: PageProps) {
  const { programId } = await params;
  const user = await requireRole(['parent', 'student', 'admin']);

  // Get program details
  const program = await getCertificationProgram(programId);
  if (!program) {
    notFound();
  }

  // Get user's progress and requirements status
  const requirementsCheck = await checkRequirements(user.id, programId);
  const assessments = await getAssessmentsForProgram(programId);
  const attemptHistory = await getAttemptHistory(user.id);

  // Filter attempt history for this program's assessments
  const programAssessmentIds = new Set(assessments.map(a => a.id));
  const programAttempts = attemptHistory.filter(a => programAssessmentIds.has(a.assessment_id));

  const getDifficultyLabel = (rating: number | null) => {
    if (!rating) return 'N/A';
    if (rating <= 2) return 'Beginner';
    if (rating <= 3) return 'Intermediate';
    if (rating <= 4) return 'Advanced';
    return 'Expert';
  };

  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'skills_mastered':
      case 'skill_count':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'hours_logged':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'sessions_completed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'assessment_passed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
          href="/parent/certifications"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Certifications
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {program.badge_image_url ? (
                <img src={program.badge_image_url} alt="" className="w-10 h-10" />
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{program.name}</h1>
              <p className="text-blue-100 mb-4">{program.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20">
                  {program.level}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20">
                  {getDifficultyLabel(program.difficulty_rating)}
                </span>
                {program.estimated_hours && (
                  <span className="text-sm text-blue-100">
                    ~{program.estimated_hours} hours
                  </span>
                )}
                {program.validity_months && (
                  <span className="text-sm text-blue-100">
                    Valid for {program.validity_months} months
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Completion</span>
                <span className="text-lg font-bold text-blue-600">
                  {requirementsCheck.completion_percentage}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${requirementsCheck.completion_percentage}%` }}
                />
              </div>
            </div>

            {requirementsCheck.ready_for_certification ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-800">Ready for Certification!</p>
                    <p className="text-sm text-emerald-600">You&apos;ve completed all requirements.</p>
                  </div>
                  <Button className="ml-auto">
                    Claim Certificate
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Complete all required items below to earn this certification.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requirementsCheck.requirements.map((req) => (
                <div
                  key={req.requirement_id}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    req.completed
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      req.completed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {req.completed ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        getRequirementIcon(req.requirement_type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium ${req.completed ? 'text-emerald-800' : 'text-slate-900'}`}>
                          {req.name}
                        </h4>
                        <span className={`text-sm font-medium ${
                          req.completed ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {req.progress}%
                        </span>
                      </div>
                      {!req.completed && (
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${req.progress}%` }}
                          />
                        </div>
                      )}
                      {req.details && Object.keys(req.details).length > 0 && (
                        <p className="text-xs text-slate-500">
                          {req.details.mastered !== undefined && (
                            <span>{req.details.mastered as number}/{req.details.required as number} skills mastered</span>
                          )}
                          {req.details.completed !== undefined && (
                            <span>{req.details.completed as number}/{req.details.required as number} completed</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assessments */}
        {assessments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment) => {
                  const attempts = programAttempts.filter(a => a.assessment_id === assessment.id);
                  const bestAttempt = attempts.find(a => a.passed) || attempts[0];
                  const attemptsRemaining = assessment.max_attempts - attempts.length;

                  return (
                    <div
                      key={assessment.id}
                      className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-900">{assessment.title}</h4>
                            {bestAttempt?.passed && (
                              <Badge variant="success">Passed</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mb-2">{assessment.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            {assessment.time_limit_minutes && (
                              <span>{assessment.time_limit_minutes} min</span>
                            )}
                            <span>{assessment.passing_score}% to pass</span>
                            <span>{attemptsRemaining} attempts remaining</span>
                          </div>
                          {bestAttempt && (
                            <div className="mt-2 text-sm">
                              <span className="text-slate-500">Best score: </span>
                              <span className={`font-medium ${bestAttempt.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {bestAttempt.percentage_score}%
                              </span>
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/parent/certifications/assessment/${assessment.id}`}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            attemptsRemaining > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {bestAttempt ? 'Retry' : 'Start'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attempt History */}
        {programAttempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Attempt History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {programAttempts.slice(0, 5).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        attempt.passed ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                        {attempt.passed ? (
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{attempt.assessment_title}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(attempt.started_at)} • Attempt #{attempt.attempt_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${attempt.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {attempt.percentage_score}%
                      </p>
                      <p className="text-xs text-slate-500">{attempt.passed ? 'Passed' : 'Not passed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
