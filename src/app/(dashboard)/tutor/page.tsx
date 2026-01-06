import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate, formatTime } from '@/lib/utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export default async function TutorDashboardPage() {
  const user = await requireRole('tutor');
  const supabase = await createClient();

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

  // Get today's sessions
  const { data: todaySessions } = await supabase
    .from('bookings')
    .select(`
      id,
      start_at,
      end_at,
      modality,
      status,
      student_user_id,
      sessions (
        id,
        status
      )
    `)
    .eq('tutor_user_id', user.id)
    .gte('start_at', todayStart)
    .lte('start_at', todayEnd)
    .in('status', ['confirmed', 'in_progress'])
    .order('start_at', { ascending: true });

  // Get student names for today's sessions
  const todayStudentIds = todaySessions?.map(b => b.student_user_id) || [];
  const { data: todayStudents } = await supabase
    .from('users_profile')
    .select('id, full_name')
    .in('id', todayStudentIds.length > 0 ? todayStudentIds : ['']);

  const studentNameMap = new Map(todayStudents?.map(s => [s.id, s.full_name]) || []);

  // Get this week's upcoming sessions
  const { data: weekSessions } = await supabase
    .from('bookings')
    .select(`
      id,
      start_at,
      end_at,
      modality,
      status,
      student_user_id
    `)
    .eq('tutor_user_id', user.id)
    .gte('start_at', now.toISOString())
    .lte('start_at', weekEnd)
    .in('status', ['pending', 'confirmed'])
    .order('start_at', { ascending: true })
    .limit(10);

  // Get student names for week sessions
  const weekStudentIds = weekSessions?.map(b => b.student_user_id) || [];
  const { data: weekStudents } = await supabase
    .from('users_profile')
    .select('id, full_name')
    .in('id', weekStudentIds.length > 0 ? weekStudentIds : ['']);

  weekStudents?.forEach(s => studentNameMap.set(s.id, s.full_name));

  // Get session stats for this week
  const { count: completedThisWeek } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', weekStart)
    .lte('completed_at', weekEnd);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.fullName.split(' ')[0]}!</h1>
          <p className="text-slate-600">{formatDate(now, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link
          href="/tutor/availability"
          className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium"
        >
          Manage Availability
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Today&apos;s Sessions</p>
                <p className="text-3xl font-bold text-slate-900">{todaySessions?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed This Week</p>
                <p className="text-3xl font-bold text-slate-900">{completedThisWeek || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming This Week</p>
                <p className="text-3xl font-bold text-slate-900">{weekSessions?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySessions && todaySessions.length > 0 ? (
              <div className="space-y-4">
                {todaySessions.map((booking) => {
                  const session = Array.isArray(booking.sessions) ? booking.sessions[0] : null;
                  const studentName = studentNameMap.get(booking.student_user_id) || 'Student';
                  return (
                    <Link
                      key={booking.id}
                      href={session ? `/tutor/sessions/${session.id}` : '#'}
                      className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-900">{studentName}</p>
                        <Badge variant={booking.status === 'in_progress' ? 'info' : 'success'}>
                          {booking.status === 'in_progress' ? 'In Progress' : 'Confirmed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {booking.modality === 'online' ? 'Online' : 'In Person'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6">No sessions scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming This Week */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {weekSessions && weekSessions.length > 0 ? (
              <div className="space-y-3">
                {weekSessions.map((booking) => {
                  const studentName = studentNameMap.get(booking.student_user_id) || 'Student';
                  return (
                    <div key={booking.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-slate-900">{studentName}</p>
                        <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {formatDate(booking.start_at, 'EEE, MMM d')} at {formatTime(booking.start_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6">No upcoming sessions this week.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
