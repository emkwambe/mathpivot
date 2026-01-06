import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export default async function AdminReportsPage() {
  await requireRole('admin');
  const supabase = await createClient();

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(currentWeekStart, 1);
  const lastWeekEnd = subWeeks(currentWeekEnd, 1);

  // Get weekly reports
  const { data: weeklyReports } = await supabase
    .from('weekly_reports')
    .select('*')
    .order('week_end', { ascending: false })
    .limit(50);

  // Get student names for reports
  const studentIds = [...new Set(weeklyReports?.map((r) => r.student_user_id) || [])];
  const { data: studentProfiles } = await supabase
    .from('users_profile')
    .select('id, full_name')
    .in('id', studentIds.length > 0 ? studentIds : ['']);

  const studentNameMap = new Map(
    studentProfiles?.map((p) => [p.id, p.full_name]) || []
  );

  // Calculate platform metrics
  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .gte('started_at', lastWeekStart.toISOString())
    .lte('started_at', lastWeekEnd.toISOString());

  const { count: completedSessions } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .gte('started_at', lastWeekStart.toISOString())
    .lte('started_at', lastWeekEnd.toISOString())
    .not('ended_at', 'is', null);

  const { count: noShows } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'no_show')
    .gte('start_at', lastWeekStart.toISOString())
    .lte('start_at', lastWeekEnd.toISOString());

  const { count: cancellations } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'canceled')
    .gte('start_at', lastWeekStart.toISOString())
    .lte('start_at', lastWeekEnd.toISOString());

  // Revenue this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const { data: monthlyPurchases } = await supabase
    .from('purchases')
    .select('amount_cents')
    .eq('status', 'completed')
    .gte('paid_at', monthStart.toISOString());

  const monthlyRevenue = monthlyPurchases?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  // Group reports by week
  type WeeklyReport = NonNullable<typeof weeklyReports>[number];
  const reportsByWeek: Record<string, WeeklyReport[]> = {};
  for (const report of weeklyReports || []) {
    const weekKey = report.week_end;
    if (!reportsByWeek[weekKey]) {
      reportsByWeek[weekKey] = [];
    }
    reportsByWeek[weekKey].push(report);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-600">Platform performance and student progress</p>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Sessions Last Week</p>
            <p className="text-3xl font-bold text-slate-900">{totalSessions || 0}</p>
            <p className="text-xs text-slate-500 mt-1">
              {completedSessions || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">No-Shows Last Week</p>
            <p className="text-3xl font-bold text-red-600">{noShows || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Cancellations Last Week</p>
            <p className="text-3xl font-bold text-amber-600">{cancellations || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Revenue This Month</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(monthlyRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Reports Button */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Weekly Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Generate weekly progress reports for all active students. Reports include
            session attendance, skills covered, and at-risk flagging.
          </p>
          <form action={generateReportsAction}>
            <input type="hidden" name="weekStart" value={lastWeekStart.toISOString()} />
            <input type="hidden" name="weekEnd" value={lastWeekEnd.toISOString()} />
            <Button type="submit">
              Generate Reports for Last Week
            </Button>
          </form>
          <p className="text-xs text-slate-500 mt-2">
            Week: {formatDate(lastWeekStart.toISOString(), 'MMM d')} -{' '}
            {formatDate(lastWeekEnd.toISOString(), 'MMM d, yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Weekly Reports */}
      {Object.keys(reportsByWeek).length > 0 ? (
        Object.entries(reportsByWeek)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([weekEnd, reports]) => (
            <Card key={weekEnd}>
              <CardHeader>
                <CardTitle>
                  Week Ending {formatDate(weekEnd, 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports?.map((report) => (
                    <div
                      key={report.id}
                      className={`p-4 rounded-lg border ${
                        report.is_at_risk
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {studentNameMap.get(report.student_user_id) || 'Student'}
                            </p>
                            {report.is_at_risk && (
                              <Badge variant="danger">At Risk</Badge>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Sessions</p>
                              <p className="font-medium">{report.session_count}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Homework Rate</p>
                              <p className="font-medium">
                                {Math.round((report.homework_completion_rate || 0) * 100)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Skills Worked</p>
                              <p className="font-medium">
                                {Array.isArray(report.skills_worked)
                                  ? report.skills_worked.length
                                  : 0}
                              </p>
                            </div>
                          </div>
                          {report.is_at_risk && report.at_risk_reasons && (
                            <div className="mt-2">
                              {(report.at_risk_reasons as string[]).map((reason, i) => (
                                <p key={i} className="text-sm text-red-700">
                                  {reason}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">
              No weekly reports generated yet. Click the button above to generate reports.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function generateReportsAction(formData: FormData) {
  'use server';

  const { createClient } = await import('@/lib/supabase/server');
  const { getCurrentUser } = await import('@/lib/auth');
  const { revalidatePath } = await import('next/cache');

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return;
  }

  const weekStart = formData.get('weekStart') as string;
  const weekEnd = formData.get('weekEnd') as string;

  const supabase = await createClient();

  // Get all active students
  const { data: students } = await supabase
    .from('students_profile')
    .select('user_id');

  // Generate report for each student
  for (const student of students || []) {
    await supabase.rpc('generate_weekly_report', {
      p_student_user_id: student.user_id,
      p_week_start: weekStart.split('T')[0],
      p_week_end: weekEnd.split('T')[0],
    });
  }

  revalidatePath('/admin/reports');
}
