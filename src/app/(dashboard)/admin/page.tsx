import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default async function AdminDashboardPage() {
  const user = await requireRole('admin');
  const supabase = await createClient();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  // Get counts
  const { count: totalStudents } = await supabase
    .from('students_profile')
    .select('user_id', { count: 'exact', head: true });

  const { count: totalTutors } = await supabase
    .from('tutors_profile')
    .select('user_id', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: sessionsThisWeek } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekStart)
    .lte('created_at', weekEnd);

  const { count: noShowsThisWeek } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'no_show')
    .gte('start_at', weekStart)
    .lte('start_at', weekEnd);

  // Get revenue this month
  const { data: monthlyPurchases } = await supabase
    .from('purchases')
    .select('amount_cents')
    .eq('status', 'completed')
    .gte('paid_at', monthStart)
    .lte('paid_at', monthEnd);

  const monthlyRevenue = monthlyPurchases?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  // Get upcoming sessions today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: upcomingSessions } = await supabase
    .from('bookings')
    .select(`
      id,
      start_at,
      status,
      student_user_id,
      tutor_user_id
    `)
    .in('status', ['confirmed', 'pending'])
    .gte('start_at', todayStart.toISOString())
    .lte('start_at', todayEnd.toISOString())
    .order('start_at', { ascending: true })
    .limit(10);

  // Get user names
  const userIds = [
    ...(upcomingSessions?.map(s => s.student_user_id) || []),
    ...(upcomingSessions?.map(s => s.tutor_user_id) || []),
  ];
  const { data: userProfiles } = await supabase
    .from('users_profile')
    .select('id, full_name')
    .in('id', userIds.length > 0 ? userIds : ['']);

  const nameMap = new Map(userProfiles?.map(u => [u.id, u.full_name]) || []);

  // Get at-risk students (from weekly reports)
  const { data: atRiskReports } = await supabase
    .from('weekly_reports')
    .select(`
      id,
      student_user_id,
      at_risk_reasons,
      week_end
    `)
    .eq('is_at_risk', true)
    .order('week_end', { ascending: false })
    .limit(5);

  // Get at-risk student names
  const atRiskIds = atRiskReports?.map(r => r.student_user_id) || [];
  const { data: atRiskProfiles } = await supabase
    .from('users_profile')
    .select('id, full_name')
    .in('id', atRiskIds.length > 0 ? atRiskIds : ['']);

  const atRiskNameMap = new Map(atRiskProfiles?.map(u => [u.id, u.full_name]) || []);

  return (
    <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-purple-100 mt-1">Platform overview and operations</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/skills"
                className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Skills
              </Link>
              <Link
                href="/admin/reports"
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reports
              </Link>
            </div>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Active Students</p>
            <p className="text-3xl font-bold text-slate-900">{totalStudents || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Active Tutors</p>
            <p className="text-3xl font-bold text-slate-900">{totalTutors || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Sessions This Week</p>
            <p className="text-3xl font-bold text-slate-900">{sessionsThisWeek || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Revenue This Month</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(monthlyRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        {nameMap.get(session.student_user_id) || 'Student'}
                      </p>
                      <p className="text-sm text-slate-500">
                        with {nameMap.get(session.tutor_user_id) || 'Tutor'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{formatDate(session.start_at, 'h:mm a')}</p>
                      <Badge variant={session.status === 'confirmed' ? 'success' : 'warning'}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-500">No sessions scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <CardTitle>At-Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskReports && atRiskReports.length > 0 ? (
              <div className="space-y-3">
                {atRiskReports.map((report) => (
                  <div key={report.id} className="p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                    <p className="font-medium text-slate-900">
                      {atRiskNameMap.get(report.student_user_id) || 'Student'}
                    </p>
                    <div className="mt-1">
                      {(report.at_risk_reasons as string[] || []).slice(0, 2).map((reason, i) => (
                        <p key={i} className="text-sm text-red-700">{reason}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-500">No at-risk students</p>
                <p className="text-sm text-slate-400 mt-1">All students are making progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* No-Shows Alert */}
      {(noShowsThisWeek || 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-900">No-Shows This Week</p>
                <p className="text-sm text-amber-700">
                  {noShowsThisWeek} session(s) marked as no-show. Consider following up with these families.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
