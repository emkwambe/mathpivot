import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default async function TutorSessionsPage() {
  const user = await requireRole(['tutor', 'admin']);
  const supabase = await createClient();

  // Get tutor profile
  const { data: tutorProfile } = await supabase
    .from('tutors_profile')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  // Get all sessions for this tutor (filter via bookings join)
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      booking:bookings!inner(
        start_at,
        end_at,
        status,
        student_user_id,
        tutor_user_id
      )
    `)
    .eq('bookings.tutor_user_id', user.id)
    .order('created_at', { ascending: false });

  // Get student names
  const studentIds = [...new Set(sessions?.map(s => (s.booking as { student_user_id: string })?.student_user_id).filter(Boolean) || [])];
  const { data: students } = await supabase
    .from('users_profile')
    .select('id, full_name')
    .in('id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000']);

  const studentMap = new Map(students?.map(s => [s.id, s.full_name]) || []);

  // Group sessions by status
  const upcomingSessions = sessions?.filter(s => {
    const booking = s.booking as { start_at: string; status: string } | null;
    return booking && new Date(booking.start_at) > new Date() && booking.status !== 'canceled';
  }) || [];

  const pastSessions = sessions?.filter(s => {
    const booking = s.booking as { start_at: string; status: string } | null;
    return booking && (new Date(booking.start_at) <= new Date() || booking.status === 'completed');
  }) || [];

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Sessions</h1>
          <p className="text-slate-600">View and manage your tutoring sessions</p>
        </div>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upcoming Sessions ({upcomingSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  const booking = session.booking as { start_at: string; end_at: string; student_user_id: string; status: string };
                  return (
                    <Link
                      key={session.id}
                      href={`/tutor/sessions/${session.id}`}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {studentMap.get(booking.student_user_id)?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {studentMap.get(booking.student_user_id) || 'Unknown Student'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(booking.start_at, 'EEEE, MMM d')} at {formatDate(booking.start_at, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="default">Scheduled</Badge>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-500">No upcoming sessions</p>
                <p className="text-sm text-slate-400 mt-1">Sessions will appear here when parents book with you</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Past Sessions ({pastSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastSessions.length > 0 ? (
              <div className="space-y-3">
                {pastSessions.slice(0, 10).map((session) => {
                  const booking = session.booking as { start_at: string; end_at: string; student_user_id: string; status: string };
                  const isCompleted = booking.status === 'completed';
                  return (
                    <Link
                      key={session.id}
                      href={`/tutor/sessions/${session.id}`}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-slate-600 font-semibold">
                            {studentMap.get(booking.student_user_id)?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {studentMap.get(booking.student_user_id) || 'Unknown Student'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(booking.start_at, 'MMM d, yyyy')} at {formatDate(booking.start_at, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={isCompleted ? 'success' : 'secondary'}>
                          {isCompleted ? 'Completed' : 'Past'}
                        </Badge>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500">No past sessions yet</p>
                <p className="text-sm text-slate-400 mt-1">Your completed sessions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
