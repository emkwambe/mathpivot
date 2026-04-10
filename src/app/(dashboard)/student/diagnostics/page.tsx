import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

const COURSE_TRACK_LABELS: Record<string, string> = {
  standard: 'Standard Track',
  honors: 'Honors Track',
  accelerated: 'Accelerated Track',
};

function getScoreColor(score: number, maxScore: number) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'text-emerald-600';
  if (percentage >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBadge(score: number, maxScore: number) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return { label: 'Excellent', variant: 'success' as const };
  if (percentage >= 80) return { label: 'Good', variant: 'success' as const };
  if (percentage >= 70) return { label: 'Satisfactory', variant: 'warning' as const };
  if (percentage >= 60) return { label: 'Needs Work', variant: 'warning' as const };
  return { label: 'Requires Attention', variant: 'danger' as const };
}

export default async function StudentDiagnosticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get all diagnostics for this student
  const { data: diagnostics } = await supabase
    .from('diagnostics')
    .select(`
      *,
      administered_by:users_profile!diagnostics_administered_by_user_id_fkey(full_name)
    `)
    .eq('student_user_id', user.id)
    .order('administered_at', { ascending: false });

  // Calculate stats
  const totalAssessments = diagnostics?.length || 0;
  const latestDiagnostic = diagnostics?.[0];
  const averageScore = diagnostics?.length
    ? diagnostics.reduce((sum, d) => sum + ((d.score || 0) / (d.max_score || 1)) * 100, 0) / diagnostics.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Diagnostics</h1>
        <p className="text-slate-600">View your assessment results and progress over time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Assessments</p>
              <p className="text-3xl font-bold text-slate-900">{totalAssessments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Average Score</p>
              <p className={`text-3xl font-bold ${averageScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {averageScore > 0 ? `${averageScore.toFixed(0)}%` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Current Track</p>
              <p className="text-lg font-bold text-blue-600">
                {latestDiagnostic ? COURSE_TRACK_LABELS[latestDiagnostic.course_track] || latestDiagnostic.course_track : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics List */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnostics && diagnostics.length > 0 ? (
            <div className="space-y-4">
              {diagnostics.map((diagnostic) => {
                const adminBy = diagnostic.administered_by as { full_name: string } | null;
                const scoreBadge = diagnostic.score && diagnostic.max_score
                  ? getScoreBadge(diagnostic.score, diagnostic.max_score)
                  : null;

                return (
                  <div
                    key={diagnostic.id}
                    className="p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {COURSE_TRACK_LABELS[diagnostic.course_track] || diagnostic.course_track} Diagnostic
                            </h3>
                            <p className="text-sm text-slate-500">
                              {formatDate(diagnostic.administered_at)}
                              {adminBy && ` • Administered by ${adminBy.full_name}`}
                            </p>
                          </div>
                        </div>

                        {diagnostic.score !== null && diagnostic.max_score && (
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-bold ${getScoreColor(diagnostic.score, diagnostic.max_score)}`}>
                                {diagnostic.score}
                              </span>
                              <span className="text-slate-500">/ {diagnostic.max_score}</span>
                            </div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (diagnostic.score / diagnostic.max_score) >= 0.8 ? 'bg-emerald-500' :
                                  (diagnostic.score / diagnostic.max_score) >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(diagnostic.score / diagnostic.max_score) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {((diagnostic.score / diagnostic.max_score) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}

                        {diagnostic.notes && (
                          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                            {diagnostic.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {scoreBadge && (
                          <Badge variant={scoreBadge.variant}>
                            {scoreBadge.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Diagnostics Yet</h3>
              <p className="text-slate-500">Your tutor will administer a diagnostic assessment to help plan your learning path.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">About Diagnostic Assessments</h4>
              <p className="text-sm text-slate-600">
                Diagnostics help us understand your current math skills and place you on the right learning track.
                They are administered by your tutor and cover topics relevant to your grade level and goals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
