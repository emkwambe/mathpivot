import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole, canAccessStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate, snakeToTitle } from '@/lib/utils';

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { studentId } = await params;
  await requireRole(['parent', 'student', 'admin']);

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

  // Group mastery by level
  const masteryByLevel = {
    mastered: masteryData?.filter(m => m.mastery_level === 'mastered') || [],
    proficient: masteryData?.filter(m => m.mastery_level === 'proficient') || [],
    developing: masteryData?.filter(m => m.mastery_level === 'developing') || [],
    not_started: masteryData?.filter(m => m.mastery_level === 'not_started') || [],
  };

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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-2xl font-bold">
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

      {/* Mastery Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Mastery Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {masteryData && masteryData.length > 0 ? (
            <div className="space-y-6">
              {/* Mastery Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{masteryByLevel.mastered.length}</p>
                  <p className="text-xs text-green-700">Mastered</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{masteryByLevel.proficient.length}</p>
                  <p className="text-xs text-blue-700">Proficient</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{masteryByLevel.developing.length}</p>
                  <p className="text-xs text-yellow-700">Developing</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-600">{masteryByLevel.not_started.length}</p>
                  <p className="text-xs text-slate-700">Not Started</p>
                </div>
              </div>

              {/* Recent Skills */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Recently Practiced Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {masteryData.slice(0, 10).map((m) => {
                    const skill = m.skills as unknown as { code: string; name: string; category: string };
                    const levelColors = {
                      mastered: 'success',
                      proficient: 'info',
                      developing: 'warning',
                      not_started: 'secondary',
                    } as const;
                    return (
                      <Badge key={m.id} variant={levelColors[m.mastery_level as keyof typeof levelColors]}>
                        {skill.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No skill mastery data yet.</p>
          )}
        </CardContent>
      </Card>

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
            <p className="text-slate-500 text-center py-4">No completed sessions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
