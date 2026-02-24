import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { revalidatePath } from 'next/cache';

// Eligibility tier calculation
function calculateTier(score: number): { tier: string; name: string; color: string } {
  if (score >= 23) return { tier: 'TIER_3_ACCELERATOR', name: 'Accelerator', color: 'bg-amber-100 text-amber-800' };
  if (score >= 20) return { tier: 'TIER_2_DEVELOPER', name: 'Developer', color: 'bg-purple-100 text-purple-800' };
  if (score >= 16) return { tier: 'TIER_1_EXPLORER', name: 'Explorer', color: 'bg-blue-100 text-blue-800' };
  return { tier: 'NOT_ELIGIBLE', name: 'Not Yet Eligible', color: 'bg-slate-100 text-slate-800' };
}

async function submitAssessmentAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || (user.role !== 'tutor' && user.role !== 'admin')) {
    return;
  }

  const studentId = formData.get('studentId') as string;
  const academicPerformance = parseInt(formData.get('academicPerformance') as string, 10);
  const mathPassion = parseInt(formData.get('mathPassion') as string, 10);
  const achievementLevel = parseInt(formData.get('achievementLevel') as string, 10);
  const careerDirection = parseInt(formData.get('careerDirection') as string, 10);
  const personalQualities = parseInt(formData.get('personalQualities') as string, 10);
  const notes = formData.get('notes') as string;

  const supabase = await createClient();

  // Upsert eligibility profile
  await supabase
    .from('student_eligibility_profiles')
    .upsert({
      student_id: studentId,
      assessment_date: new Date().toISOString().split('T')[0],
      academic_performance: academicPerformance,
      math_passion: mathPassion,
      achievement_level: achievementLevel,
      career_direction: careerDirection,
      personal_qualities: personalQualities,
      notes: notes || null,
      assessed_by: user.id,
      next_assessment_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }, {
      onConflict: 'student_id',
    });

  revalidatePath('/tutor');
  revalidatePath(`/parent/students/${studentId}`);
  redirect(`/tutor/students/${studentId}/assess?success=true`);
}

interface PageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function StudentAssessmentPage({ params, searchParams }: PageProps) {
  const { studentId } = await params;
  const { success } = await searchParams;
  const user = await requireRole(['tutor', 'admin']);
  const supabase = await createClient();

  // Get student profile
  const { data: student } = await supabase
    .from('students_profile')
    .select(`
      user_id,
      grade,
      course_track,
      goals,
      users_profile!inner(full_name)
    `)
    .eq('user_id', studentId)
    .single();

  if (!student) {
    notFound();
  }

  // Get existing eligibility profile
  const { data: eligibility } = await supabase
    .from('student_eligibility_profiles')
    .select('*')
    .eq('student_id', studentId)
    .single();

  const studentName = (student.users_profile as unknown as { full_name: string }).full_name;
  const existingScore = eligibility?.total_score || 0;
  const tierInfo = calculateTier(existingScore);

  const factors = [
    {
      name: 'academicPerformance',
      label: 'Academic Performance',
      description: 'Current grades and academic standing in math courses',
      levels: ['Below Average (1)', 'Average (2)', 'Above Average (3)', 'Excellent (4)', 'Outstanding (5)'],
      value: eligibility?.academic_performance,
    },
    {
      name: 'mathPassion',
      label: 'Math Passion & Interest',
      description: 'Enthusiasm for math, curiosity, engagement in learning',
      levels: ['Low (1)', 'Some Interest (2)', 'Engaged (3)', 'Very Interested (4)', 'Passionate (5)'],
      value: eligibility?.math_passion,
    },
    {
      name: 'achievementLevel',
      label: 'Achievement & Competition History',
      description: 'Past achievements, awards, competition participation',
      levels: ['None (1)', 'Local (2)', 'Regional (3)', 'State (4)', 'National/Intl (5)'],
      value: eligibility?.achievement_level,
    },
    {
      name: 'careerDirection',
      label: 'Career Direction & Goals',
      description: 'Clarity of career goals related to math/STEM',
      levels: ['Unclear (1)', 'Exploring (2)', 'Some Direction (3)', 'Clear Goals (4)', 'Defined Path (5)'],
      value: eligibility?.career_direction,
    },
    {
      name: 'personalQualities',
      label: 'Personal Qualities',
      description: 'Work ethic, persistence, openness to feedback, growth mindset',
      levels: ['Needs Work (1)', 'Developing (2)', 'Good (3)', 'Strong (4)', 'Exceptional (5)'],
      value: eligibility?.personal_qualities,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Link */}
      <Link
        href="/tutor/sessions"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Sessions
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Eligibility Assessment</h1>
        <p className="text-slate-600 mt-1">
          Assess {studentName}&apos;s eligibility for tiered programs
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-green-800">Assessment saved successfully!</p>
          </div>
        </div>
      )}

      {/* Student Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">{studentName.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{studentName}</p>
                <p className="text-sm text-slate-500">
                  Grade {student.grade} • {student.course_track?.replace('_', ' ')}
                </p>
              </div>
            </div>
            {eligibility && (
              <div className="text-right">
                <p className="text-sm text-slate-600">Current Tier</p>
                <Badge className={tierInfo.color}>{tierInfo.name}</Badge>
                <p className="text-xs text-slate-500 mt-1">Score: {existingScore}/25</p>
              </div>
            )}
          </div>
          {student.goals && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Goals:</span> {student.goals}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Form */}
      <Card>
        <CardHeader>
          <CardTitle>5-Factor Assessment</CardTitle>
          <p className="text-sm text-slate-500">
            Rate each factor from 1-5. Total score determines eligibility tier:
            <span className="ml-2">
              <Badge variant="secondary" className="mr-1">16-19: Explorer</Badge>
              <Badge variant="secondary" className="mr-1">20-22: Developer</Badge>
              <Badge variant="secondary">23-25: Accelerator</Badge>
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <form action={submitAssessmentAction} className="space-y-6">
            <input type="hidden" name="studentId" value={studentId} />

            {factors.map((factor) => (
              <div key={factor.name} className="space-y-2">
                <label className="block">
                  <span className="font-medium text-slate-900">{factor.label}</span>
                  <span className="text-sm text-slate-500 block">{factor.description}</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <label
                      key={score}
                      className="flex-1 min-w-[80px] cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={factor.name}
                        value={score}
                        defaultChecked={factor.value === score}
                        required
                        className="sr-only peer"
                      />
                      <div className="p-3 text-center border-2 rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-slate-50 transition-colors">
                        <span className="text-2xl font-bold text-slate-700 peer-checked:text-blue-600">{score}</span>
                        <p className="text-xs text-slate-500 mt-1">{factor.levels[score - 1]?.split(' (')[0]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <label className="block">
                <span className="font-medium text-slate-900">Assessment Notes</span>
                <span className="text-sm text-slate-500 block">Additional observations or recommendations</span>
              </label>
              <textarea
                name="notes"
                defaultValue={eligibility?.notes || ''}
                rows={3}
                className="mt-2 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Optional notes about this assessment..."
              />
            </div>

            {/* Tier Preview */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">Tier Requirements:</p>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="p-2 rounded bg-blue-50">
                  <p className="font-medium text-blue-800">Explorer</p>
                  <p className="text-blue-600">16-19 pts</p>
                  <p className="text-xs text-blue-500">Guide I</p>
                </div>
                <div className="p-2 rounded bg-purple-50">
                  <p className="font-medium text-purple-800">Developer</p>
                  <p className="text-purple-600">20-22 pts</p>
                  <p className="text-xs text-purple-500">Guide II</p>
                </div>
                <div className="p-2 rounded bg-amber-50">
                  <p className="font-medium text-amber-800">Accelerator</p>
                  <p className="text-amber-600">23-25 pts</p>
                  <p className="text-xs text-amber-500">Guide III</p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              {eligibility ? 'Update Assessment' : 'Submit Assessment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Assessment Info */}
      {eligibility && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Assessed On</p>
                <p className="font-medium">{eligibility.assessment_date}</p>
              </div>
              <div>
                <p className="text-slate-600">Next Assessment</p>
                <p className="font-medium">{eligibility.next_assessment_date || 'Not scheduled'}</p>
              </div>
            </div>
            {eligibility.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-slate-600 text-sm">Previous Notes:</p>
                <p className="text-slate-900 mt-1">{eligibility.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
