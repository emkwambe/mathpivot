import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default async function StudentSessionsPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Get all sessions for this student
  const { data: sessions } = await supabase
    .from('bookings')
    .select(`
      id,
      start_at,
      end_at,
      status,
      notes,
      tutor:tutors_profile!bookings_tutor_user_id_fkey(
        user:users_profile!tutors_profile_user_id_fkey(full_name)
      ),
      session:sessions(
        id,
        started_at,
        ended_at,
        tutor_notes,
        next_steps
      )
    `)
    .eq('student_user_id', user.id)
    .order('start_at', { ascending: false });

  const upcomingSessions = sessions?.filter(
    (s) => s.status === 'confirmed' || s.status === 'pending'
  ) || [];

  const pastSessions = sessions?.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled'
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Sessions</h1>
        <p className="text-slate-600">View your upcoming and past tutoring sessions</p>
      </div>

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
          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const tutor = session.tutor as { user: { full_name: string } | null } | null;
                return (
                  <div
                    key={session.id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(session.start_at, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-slate-600">
                          {formatDate(session.start_at, 'h:mm a')} - {formatDate(session.end_at, 'h:mm a')}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          with {tutor?.user?.full_name || 'Your Tutor'}
                        </p>
                      </div>
                      <Badge variant={session.status === 'confirmed' ? 'success' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-slate-600 mt-3 p-2 bg-slate-50 rounded">
                        {session.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 font-medium">No upcoming sessions</p>
              <p className="text-sm text-slate-400 mt-1">
                Ask your parent to book a session for you!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Past Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length > 0 ? (
            <div className="space-y-4">
              {pastSessions.map((booking) => {
                const tutor = booking.tutor as { user: { full_name: string } | null } | null;
                const sessionData = booking.session as Array<{
                  id: string;
                  started_at: string;
                  ended_at: string;
                  tutor_notes: string | null;
                  next_steps: string | null;
                }> | null;
                const session = sessionData?.[0];

                return (
                  <div
                    key={booking.id}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(booking.start_at, 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-slate-500">
                          with {tutor?.user?.full_name || 'Your Tutor'}
                        </p>
                      </div>
                      <Badge variant={booking.status === 'completed' ? 'success' : 'destructive'}>
                        {booking.status}
                      </Badge>
                    </div>

                    {session && (
                      <div className="mt-3 space-y-2">
                        {session.tutor_notes && (
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs font-medium text-slate-500 mb-1">Session Notes</p>
                            <p className="text-sm text-slate-700">{session.tutor_notes}</p>
                          </div>
                        )}
                        {session.next_steps && (
                          <div className="p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs font-medium text-amber-700 mb-1">Next Steps</p>
                            <p className="text-sm text-amber-800">{session.next_steps}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-500">No past sessions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
