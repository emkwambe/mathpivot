import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole, canAccessStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { StudentProgressVisualization } from '@/components/StudentProgressVisualization';
import { formatDate, snakeToTitle } from '@/lib/utils';

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { studentId } = await params;
  const user = await requireRole(['parent', 'student', 'admin']);

  // Check access
  const hasAccess = await canAccessStudent(studentId);
  if (!hasAccess) {
    notFound();
  }

  const supabase = await createClient();

  // Get student profile
  const { data: student } = await supabase
    .from('students_profile')
    .select(`
      *,
      users_profile!inner (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('user_id', studentId)
    .single();

  if (!student) {
    notFound();
  }

  // Get diagnostics
  const { data: diagnostics } = await supabase
    .from('diagnostics')
    .select(`
      id,
      administered_at,
      course_track,
      score,
      max_score,
      notes
    `)
    .eq('student_user_id', studentId)
    .order('administered_at', { ascending: false });

  // Get mastery data
  const { data: masteryData } = await supabase
    .from('student_skill_mastery')
    .select(`
      id,
      mastery_level,
      last_practiced_at,
      skills!inner (
        code,
        name,
        category,
        course_track
      )
    `)
    .eq('student_user_id', studentId)
    .order('mastery_level', { ascending: false });

  // Get recent sessions
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      completed_at,
      parent_summary,
      bookings!inner (
        student_user_id,
        start_at,
        tutors_profile!inner (
          users_profile!inner (
            full_name
          )
        )
      )
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  const studentSessions = recentSessions?.filter(
    s => (s.bookings as unknown as { student_user_id: string })?.student_user_id === studentId
  ) || [];

  const profile = student.users_profile as unknown as { full_name: string; email: string; avatar_url: string | null };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
          href="/parent"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">
                {profile.full_name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
              <p className="text-slate-600">
                Grade {student.grade} • {snakeToTitle(student.course_track)}
            </p>
          </div>
        </div>
        <Link
          href="/parent/book"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Book Session
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Goals & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">Learning Goals</h4>
                <p className="text-sm text-slate-600">
                  {student.goals || 'No goals set yet.'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">Tutor Notes</h4>
                <p className="text-sm text-slate-600">
                  {student.notes || 'No notes yet.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostics && diagnostics.length > 0 ? (
              <div className="space-y-3">
                {diagnostics.map((diag) => (
                  <div key={diag.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900">
                        {snakeToTitle(diag.course_track)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(diag.administered_at)}
                      </p>
                    </div>
                    {diag.score !== null && diag.max_score !== null && (
                      <p className="text-sm text-slate-600">
                        Score: {diag.score}/{diag.max_score} ({Math.round((diag.score / diag.max_score) * 100)}%)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No diagnostic assessments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Visualization */}
      <StudentProgressVisualization
        masteryData={(masteryData || []).map(m => ({
          ...m,
          skills: m.skills as unknown as {
            code: string;
            name: string;
            category: string | null;
            course_track: 'math_1' | 'math_2' | 'math_3' | 'pre_calc' | 'ap_calc_ab' | 'ap_calc_bc' | 'ap_stats';
          }
        }))}
        diagnostics={(diagnostics || []).map(d => ({
          id: d.id,
          administered_at: d.administered_at,
          course_track: d.course_track as 'math_1' | 'math_2' | 'math_3' | 'pre_calc' | 'ap_calc_ab' | 'ap_calc_bc' | 'ap_stats',
          score: d.score,
          max_score: d.max_score
        }))}
        studentName={profile.full_name}
      />

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {studentSessions.length > 0 ? (
            <div className="space-y-4">
              {studentSessions.map((session) => {
                const booking = session.bookings as unknown as {
                  start_at: string;
                  tutors_profile: { users_profile: { full_name: string } };
                };
                return (
                  <div key={session.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">
                        with {booking.tutors_profile.users_profile.full_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(booking.start_at)}
                      </p>
                    </div>
                    {session.parent_summary && (
                      <p className="text-sm text-slate-600">{session.parent_summary}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500">No completed sessions yet</p>
              <Link href="/parent/book" className="text-sm text-blue-600 hover:underline font-medium mt-2 inline-block">
                Book a session
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
