import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

async function endSessionAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user) return;

  const sessionId = formData.get('sessionId') as string;
  const tutorNotes = formData.get('tutorNotes') as string;
  const nextSteps = formData.get('nextSteps') as string;

  const supabase = await createClient();

  // Get session
  const { data: session } = await supabase
    .from('sessions')
    .select('*, booking_id')
    .eq('id', sessionId)
    .single();

  if (!session || session.tutor_user_id !== user.id) return;

  // Update session
  await supabase
    .from('sessions')
    .update({
      ended_at: new Date().toISOString(),
      tutor_notes: tutorNotes || null,
      next_steps: nextSteps || null,
    })
    .eq('id', sessionId);

  // Update booking status to completed
  await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', session.booking_id);

  revalidatePath('/tutor');
  revalidatePath('/parent');
}

async function updateMasteryAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || (user.role !== 'tutor' && user.role !== 'admin')) return;

  const studentUserId = formData.get('studentUserId') as string;
  const skillId = formData.get('skillId') as string;
  const level = formData.get('level') as string;

  const supabase = await createClient();

  await supabase
    .from('mastery')
    .upsert(
      {
        student_user_id: studentUserId,
        skill_id: skillId,
        current_level: level,
        last_assessed_at: new Date().toISOString(),
        last_assessed_by: user.id,
      },
      {
        onConflict: 'student_user_id,skill_id',
      }
    );

  revalidatePath('/tutor');
}

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireRole(['tutor', 'admin']);
  const supabase = await createClient();

  // Get session details
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      booking:bookings(
        start_at,
        end_at,
        notes,
        status
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    notFound();
  }

  // Verify tutor owns this session
  if (session.tutor_user_id !== user.id && user.role !== 'admin') {
    redirect('/tutor');
  }

  // Get student profile
  const { data: studentProfile } = await supabase
    .from('users_profile')
    .select('full_name')
    .eq('id', session.student_user_id)
    .single();

  // Get student's grade level
  const { data: studentDetails } = await supabase
    .from('students_profile')
    .select('grade_level, goals')
    .eq('user_id', session.student_user_id)
    .single();

  // Get skills for the student's grade level
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('is_active', true)
    .lte('min_grade', studentDetails?.grade_level || 9)
    .gte('max_grade', studentDetails?.grade_level || 9)
    .order('category')
    .order('name');

  // Get current mastery levels
  const { data: masteryLevels } = await supabase
    .from('mastery')
    .select('skill_id, current_level')
    .eq('student_user_id', session.student_user_id);

  const masteryMap = new Map(
    masteryLevels?.map((m) => [m.skill_id, m.current_level]) || []
  );

  // Group skills by category
  type Skill = NonNullable<typeof skills>[number];
  const skillsByCategory: Record<string, Skill[]> = {};
  for (const skill of skills || []) {
    if (!skillsByCategory[skill.category]) {
      skillsByCategory[skill.category] = [];
    }
    skillsByCategory[skill.category].push(skill);
  }

  const isActive = session.started_at && !session.ended_at;
  const isCompleted = !!session.ended_at;
  const booking = session.booking as { start_at: string; end_at: string; notes: string | null; status: string };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Session with {studentProfile?.full_name || 'Student'}
          </h1>
          <p className="text-slate-600">
            {formatDate(booking.start_at, 'EEEE, MMMM d, yyyy')} at{' '}
            {formatDate(booking.start_at, 'h:mm a')}
          </p>
        </div>
        <Badge
          variant={
            isCompleted ? 'success' : isActive ? 'warning' : 'secondary'
          }
        >
          {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Scheduled'}
        </Badge>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-600">Student</dt>
              <dd className="font-medium text-slate-900">
                {studentProfile?.full_name}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Grade Level</dt>
              <dd className="font-medium text-slate-900">
                Grade {studentDetails?.grade_level}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Scheduled Time</dt>
              <dd className="font-medium text-slate-900">
                {formatDate(booking.start_at, 'h:mm a')} -{' '}
                {formatDate(booking.end_at, 'h:mm a')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">
                {isCompleted ? 'Actual Duration' : 'Duration'}
              </dt>
              <dd className="font-medium text-slate-900">
                {isCompleted && session.ended_at
                  ? `${Math.round(
                      (new Date(session.ended_at).getTime() -
                        new Date(session.started_at).getTime()) /
                        60000
                    )} minutes`
                  : '60 minutes'}
              </dd>
            </div>
          </dl>

          {booking.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm text-slate-600 mb-1">Parent Notes</h4>
              <p className="text-sm text-slate-900">{booking.notes}</p>
            </div>
          )}

          {studentDetails?.goals && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm text-slate-600 mb-1">Student Goals</h4>
              <p className="text-sm text-slate-900">{studentDetails.goals}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills & Mastery */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Update Mastery Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                  <h4 className="font-medium text-slate-900 mb-3">{category}</h4>
                  <div className="space-y-2">
                    {categorySkills?.map((skill) => (
                      <MasteryRow
                        key={skill.id}
                        skill={skill}
                        studentUserId={session.student_user_id}
                        currentLevel={masteryMap.get(skill.id) || 'not_started'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* End Session Form */}
      {isActive && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">End Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={endSessionAction} className="space-y-4">
              <input type="hidden" name="sessionId" value={session.id} />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Notes
                </label>
                <textarea
                  name="tutorNotes"
                  placeholder="What did you cover? How did the student do?"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Next Steps / Homework
                </label>
                <textarea
                  name="nextSteps"
                  placeholder="What should the student work on before the next session?"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Complete Session
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Session Summary (if completed) */}
      {isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session.tutor_notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">
                    Session Notes
                  </h4>
                  <p className="text-slate-900 whitespace-pre-wrap">
                    {session.tutor_notes}
                  </p>
                </div>
              )}

              {session.next_steps && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">
                    Next Steps
                  </h4>
                  <p className="text-slate-900 whitespace-pre-wrap">
                    {session.next_steps}
                  </p>
                </div>
              )}

              {!session.tutor_notes && !session.next_steps && (
                <p className="text-slate-500 text-center py-4">
                  No session notes were recorded.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MasteryRow({
  skill,
  studentUserId,
  currentLevel,
}: {
  skill: { id: string; name: string; description: string | null };
  studentUserId: string;
  currentLevel: string;
}) {
  const levels = [
    { value: 'not_started', label: 'Not Started', color: 'bg-slate-200' },
    { value: 'developing', label: 'Developing', color: 'bg-amber-400' },
    { value: 'proficient', label: 'Proficient', color: 'bg-sky-400' },
    { value: 'mastered', label: 'Mastered', color: 'bg-green-400' },
  ];

  return (
    <form action={updateMasteryAction} className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg">
      <input type="hidden" name="studentUserId" value={studentUserId} />
      <input type="hidden" name="skillId" value={skill.id} />

      <div className="flex-1">
        <p className="font-medium text-slate-900 text-sm">{skill.name}</p>
        {skill.description && (
          <p className="text-xs text-slate-500">{skill.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {levels.map((level) => (
          <button
            key={level.value}
            type="submit"
            name="level"
            value={level.value}
            className={`w-8 h-8 rounded-full ${level.color} ${
              currentLevel === level.value
                ? 'ring-2 ring-offset-2 ring-slate-900'
                : 'opacity-40 hover:opacity-70'
            }`}
            title={level.label}
          />
        ))}
      </div>
    </form>
  );
}
