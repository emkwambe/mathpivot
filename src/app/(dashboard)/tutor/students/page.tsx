import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TutorStudentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get all unique students this tutor has worked with via bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      student_user_id,
      students_profile:student_user_id (
        user_id,
        grade,
        course_track,
        goals
      ),
      users_profile:student_user_id (
        full_name,
        email
      )
    `)
    .eq('tutor_user_id', user.id)
    .order('start_at', { ascending: false });

  // Deduplicate students
  const studentMap = new Map<string, {
    id: string;
    name: string;
    email: string;
    grade: number | null;
    courseTrack: string | null;
    goals: string | null;
    sessionCount: number;
    lastSession: string | null;
  }>();

  bookings?.forEach((booking) => {
    const studentId = booking.student_user_id;
    if (!studentMap.has(studentId)) {
      const profileData = Array.isArray(booking.users_profile) ? booking.users_profile[0] : booking.users_profile;
      const profile = profileData as { full_name: string; email: string } | null;
      const studentProfileData = Array.isArray(booking.students_profile) ? booking.students_profile[0] : booking.students_profile;
      const studentProfile = studentProfileData as { grade: number; course_track: string; goals: string } | null;

      studentMap.set(studentId, {
        id: studentId,
        name: profile?.full_name || 'Unknown',
        email: profile?.email || '',
        grade: studentProfile?.grade || null,
        courseTrack: studentProfile?.course_track || null,
        goals: studentProfile?.goals || null,
        sessionCount: 1,
        lastSession: null,
      });
    } else {
      const existing = studentMap.get(studentId)!;
      existing.sessionCount++;
    }
  });

  const students = Array.from(studentMap.values());

  // Get eligibility profiles for all students
  const studentIds = students.map(s => s.id);
  const { data: eligibilityProfiles } = await supabase
    .from('student_eligibility_profiles')
    .select('student_id, total_score, assessment_date')
    .in('student_id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000']);

  const eligibilityMap = new Map(
    eligibilityProfiles?.map(e => [e.student_id, e]) || []
  );

  const getTierInfo = (score: number | null) => {
    if (!score) return { tier: 'Not Assessed', color: 'bg-slate-100 text-slate-600' };
    if (score >= 23) return { tier: 'Accelerator', color: 'bg-amber-100 text-amber-800' };
    if (score >= 20) return { tier: 'Developer', color: 'bg-purple-100 text-purple-800' };
    if (score >= 16) return { tier: 'Explorer', color: 'bg-blue-100 text-blue-800' };
    return { tier: 'Not Eligible', color: 'bg-slate-100 text-slate-600' };
  };

  const courseTrackLabels: Record<string, string> = {
    'math_1': 'Math 1',
    'math_2': 'Math 2',
    'math_3': 'Math 3',
    'precalculus': 'Pre-Calculus',
    'calculus': 'Calculus',
    'competition': 'Competition',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Students</h1>
          <p className="text-slate-600">Students you have tutored</p>
        </div>
        <div className="text-sm text-slate-500">
          {students.length} student{students.length !== 1 ? 's' : ''}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Students Yet</h3>
          <p className="text-slate-500">Students will appear here once you have booked sessions.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => {
            const eligibility = eligibilityMap.get(student.id);
            const tierInfo = getTierInfo(eligibility?.total_score || null);

            return (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{student.name}</h3>
                      <p className="text-sm text-slate-500">{student.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {student.grade && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            Grade {student.grade}
                          </span>
                        )}
                        {student.courseTrack && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                            {courseTrackLabels[student.courseTrack] || student.courseTrack}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${tierInfo.color}`}>
                          {tierInfo.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold text-slate-900">{student.sessionCount}</p>
                      <p className="text-xs text-slate-500">sessions</p>
                    </div>
                    <Link
                      href={`/tutor/students/${student.id}/assess`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {eligibility ? 'Update Assessment' : 'Assess'}
                    </Link>
                  </div>
                </div>

                {student.goals && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Goals:</span> {student.goals}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
