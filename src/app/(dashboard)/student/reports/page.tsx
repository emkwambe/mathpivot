import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default async function StudentReportsPage() {
  const user = await requireRole('student');
  const supabase = await createClient();

  // Get weekly reports for this student
  const { data: reports } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('student_user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(12);

  // Calculate stats
  const totalReports = reports?.length || 0;
  const totalSessions = reports?.reduce((sum, r) => sum + (r.sessions_count || 0), 0) || 0;
  const avgAttendance = reports?.length
    ? reports.reduce((sum, r) => sum + (Number(r.attendance_rate) || 0), 0) / reports.length * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Weekly Reports</h1>
        <p className="text-slate-600">Track your learning progress week by week</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Weeks</p>
              <p className="text-3xl font-bold text-slate-900">{totalReports}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Sessions</p>
              <p className="text-3xl font-bold text-blue-600">{totalSessions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Avg Attendance</p>
              <p className={`text-3xl font-bold ${avgAttendance >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {avgAttendance > 0 ? `${avgAttendance.toFixed(0)}%` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
        </CardHeader>
        <CardContent>
          {reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => {
                const masteryChanges = report.mastery_changes as { skill: string; from: string; to: string }[] | null;
                const skillsPracticed = report.skills_practiced as string[] | null;
                const atRiskReasons = report.at_risk_reasons as string[] | null;

                return (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-xl ${report.is_at_risk ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            Week of {formatDate(report.week_start)}
                          </h3>
                          {report.is_at_risk && (
                            <Badge variant="warning">Needs Attention</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {formatDate(report.week_start)} - {formatDate(report.week_end)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{report.sessions_count}</p>
                        <p className="text-xs text-slate-500">sessions</p>
                      </div>
                    </div>

                    {/* Attendance Rate */}
                    {report.attendance_rate !== null && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600">Attendance</span>
                          <span className="font-medium">{(Number(report.attendance_rate) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              Number(report.attendance_rate) >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Number(report.attendance_rate) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Skills Practiced */}
                    {skillsPracticed && skillsPracticed.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">Skills Practiced:</p>
                        <div className="flex flex-wrap gap-1">
                          {skillsPracticed.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mastery Changes */}
                    {masteryChanges && masteryChanges.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">Progress:</p>
                        <div className="space-y-1">
                          {masteryChanges.map((change, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-slate-600">{change.skill}:</span>
                              <span className="text-slate-500">{change.from}</span>
                              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <span className="text-emerald-600 font-medium">{change.to}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {report.summary_text && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                          {report.summary_text}
                        </p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {report.recommendations && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">Recommendations:</p>
                        <p className="text-sm text-slate-600">{report.recommendations}</p>
                      </div>
                    )}

                    {/* At Risk Reasons */}
                    {report.is_at_risk && atRiskReasons && atRiskReasons.length > 0 && (
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-1">Areas of Concern:</p>
                        <ul className="text-sm text-amber-700 list-disc list-inside">
                          {atRiskReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Reports Yet</h3>
              <p className="text-slate-500">Weekly reports will appear here after you complete your first week of sessions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
