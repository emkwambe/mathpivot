import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default async function StudentDashboardPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Get student profile
  const { data: studentProfile } = await supabase
    .from('students_profile')
    .select('grade_level, course_track, goals')
    .eq('user_id', user.id)
    .single();

  // Get upcoming sessions
  const { data: upcomingSessions } = await supabase
    .from('bookings')
    .select(`
      id,
      start_at,
      end_at,
      status,
      tutor:tutors_profile!bookings_tutor_user_id_fkey(
        user:users_profile!tutors_profile_user_id_fkey(full_name)
      )
    `)
    .eq('student_user_id', user.id)
    .in('status', ['confirmed', 'pending'])
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(5);

  // Get recent session notes
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      id,
      started_at,
      ended_at,
      tutor_notes,
      next_steps
    `)
    .eq('student_user_id', user.id)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(3);

  // Get mastery levels
  const { data: masteryData } = await supabase
    .from('mastery')
    .select(`
      current_level,
      skill:skills(name, category)
    `)
    .eq('student_user_id', user.id)
    .order('last_assessed_at', { ascending: false })
    .limit(6);

  const masteryLevelColors: Record<string, string> = {
    not_started: 'bg-slate-200 text-slate-700',
    developing: 'bg-amber-100 text-amber-800',
    proficient: 'bg-sky-100 text-sky-800',
    mastered: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-indigo-100 mt-1">
          {studentProfile?.grade_level
            ? `Grade ${studentProfile.grade_level} • ${studentProfile.course_track?.replace('_', ' ') || 'General Math'}`
            : "Let's keep learning together!"}
        </p>
        {studentProfile?.goals && (
          <p className="text-sm text-indigo-200 mt-2">
            Goal: {studentProfile.goals}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming Sessions</p>
                <p className="text-3xl font-bold text-slate-900">
                  {upcomingSessions?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <Link href="/student/sessions" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
              View schedule →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Skills Tracked</p>
                <p className="text-3xl font-bold text-slate-900">
                  {masteryData?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <Link href="/student/progress" className="text-sm text-purple-600 hover:text-purple-700 mt-2 inline-block">
              View progress →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">AI Tutor</p>
                <p className="text-lg font-semibold text-slate-900">
                  Ready to help!
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <Link href="/student/ai-tutor" className="text-sm text-green-600 hover:text-green-700 mt-2 inline-block">
              Start chatting →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  const tutor = session.tutor as unknown as { user: { full_name: string } | null } | null;
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatDate(session.start_at, 'EEEE, MMM d')}
                        </p>
                        <p className="text-sm text-slate-600">
                          {formatDate(session.start_at, 'h:mm a')} with {tutor?.user?.full_name || 'Tutor'}
                        </p>
                      </div>
                      <Badge variant={session.status === 'confirmed' ? 'success' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-500">No upcoming sessions</p>
                <p className="text-sm text-slate-400 mt-1">
                  Ask your parent to book a session!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Recent Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {masteryData && masteryData.length > 0 ? (
              <div className="space-y-3">
                {masteryData.map((item, idx) => {
                  const skill = item.skill as unknown as { name: string; category: string } | null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{skill?.name}</p>
                        <p className="text-xs text-slate-500">{skill?.category}</p>
                      </div>
                      <Badge className={masteryLevelColors[item.current_level] || 'bg-slate-100'}>
                        {item.current_level.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-slate-500">No skills tracked yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Your tutor will track your progress
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Session Notes */}
      {recentSessions && recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recent Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="border-l-4 border-amber-400 pl-4 py-2">
                  <p className="text-sm text-slate-500 mb-1">
                    {formatDate(session.ended_at!, 'MMM d, yyyy')}
                  </p>
                  {session.tutor_notes && (
                    <p className="text-slate-700">{session.tutor_notes}</p>
                  )}
                  {session.next_steps && (
                    <div className="mt-2 p-2 bg-amber-50 rounded text-sm">
                      <span className="font-medium text-amber-800">Next steps: </span>
                      <span className="text-amber-700">{session.next_steps}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
