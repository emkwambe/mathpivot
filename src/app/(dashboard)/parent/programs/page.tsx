import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

type ProgramType = 'clinic' | 'workshop' | 'camp' | 'bootcamp' | 'competition' | 'hackathon';
type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'canceled';

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  clinic: 'Clinic',
  workshop: 'Workshop',
  camp: 'Camp',
  bootcamp: 'Bootcamp',
  competition: 'Competition',
  hackathon: 'Hackathon',
};

const STATUS_COLORS: Record<RegistrationStatus, 'secondary' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  confirmed: 'success',
  waitlisted: 'secondary',
  canceled: 'danger',
};

async function registerStudentAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return;

  const supabase = await createClient();

  // Get parent's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!familyMember) return;

  const programId = formData.get('programId') as string;
  const studentId = formData.get('studentId') as string;

  // Check if program is open for registration
  const { data: program } = await supabase
    .from('programs')
    .select('id, status, max_participants')
    .eq('id', programId)
    .single();

  if (!program || !['registration_open', 'published'].includes(program.status)) {
    return;
  }

  // Check if already registered
  const { data: existing } = await supabase
    .from('program_registrations')
    .select('id')
    .eq('program_id', programId)
    .eq('student_user_id', studentId)
    .single();

  if (existing) return;

  // Count current registrations
  const { count: currentCount } = await supabase
    .from('program_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId)
    .in('status', ['pending', 'confirmed']);

  // Determine status (confirmed or waitlisted)
  const status = program.max_participants && currentCount && currentCount >= program.max_participants
    ? 'waitlisted'
    : 'pending';

  const waitlistPosition = status === 'waitlisted'
    ? (currentCount || 0) - (program.max_participants || 0) + 1
    : null;

  // Create registration
  const { error } = await supabase
    .from('program_registrations')
    .insert({
      program_id: programId,
      student_user_id: studentId,
      parent_user_id: user.id,
      family_id: familyMember.family_id,
      status,
      waitlist_position: waitlistPosition,
    });

  if (error) {
    console.error('Failed to register:', error);
  }

  revalidatePath('/parent/programs');
}

async function cancelRegistrationAction(registrationId: string) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return;

  const supabase = await createClient();

  await supabase
    .from('program_registrations')
    .update({ status: 'canceled' })
    .eq('id', registrationId)
    .eq('parent_user_id', user.id);

  revalidatePath('/parent/programs');
}

export default async function ParentProgramsPage() {
  const user = await requireRole('parent');
  const supabase = await createClient();

  // Get parent's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  const familyId = familyMember?.family_id;

  // Get children in family
  const { data: children } = await supabase
    .from('students_profile')
    .select(`
      user_id,
      grade,
      users_profile!inner (
        id,
        full_name
      )
    `)
    .eq('family_id', familyId || '');

  // Get existing registrations
  const childIds = children?.map(c => c.user_id) || [];
  const { data: registrations } = await supabase
    .from('program_registrations')
    .select(`
      *,
      program:programs(id, name, program_type, start_date, end_date, status, price_cents),
      student:users_profile!program_registrations_student_user_id_fkey(id, full_name)
    `)
    .eq('family_id', familyId || '')
    .in('status', ['pending', 'confirmed', 'waitlisted'])
    .order('created_at', { ascending: false });

  // Get available programs for registration
  const { data: availablePrograms } = await supabase
    .from('programs')
    .select(`
      *,
      career_pathways(name),
      registrations:program_registrations(count)
    `)
    .in('status', ['published', 'registration_open'])
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true });

  // Get registered program IDs for each child
  const registeredByChild = new Map<string, Set<string>>();
  registrations?.forEach(r => {
    if (!registeredByChild.has(r.student_user_id)) {
      registeredByChild.set(r.student_user_id, new Set());
    }
    registeredByChild.get(r.student_user_id)?.add(r.program_id);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Programs & Camps</h1>
        <p className="text-slate-600">Register your children for camps, workshops, and competitions</p>
      </div>

      {/* Current Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations && registrations.length > 0 ? (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const program = reg.program as {
                  id: string;
                  name: string;
                  program_type: ProgramType;
                  start_date: string;
                  end_date: string;
                  status: string;
                  price_cents: number;
                } | null;
                const student = reg.student as { id: string; full_name: string } | null;

                return (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-900">{program?.name}</h4>
                        <Badge variant={STATUS_COLORS[reg.status as RegistrationStatus]}>
                          {reg.status === 'waitlisted' && reg.waitlist_position
                            ? `Waitlisted (#${reg.waitlist_position})`
                            : reg.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Student: {student?.full_name}</span>
                        {program?.program_type && (
                          <Badge variant="secondary">
                            {PROGRAM_TYPE_LABELS[program.program_type]}
                          </Badge>
                        )}
                        {program?.start_date && (
                          <span>{formatDate(program.start_date)}</span>
                        )}
                      </div>
                    </div>
                    {reg.status !== 'canceled' && (
                      <form action={cancelRegistrationAction.bind(null, reg.id)}>
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">
              No active registrations. Browse programs below to register your children.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Available Programs</CardTitle>
        </CardHeader>
        <CardContent>
          {availablePrograms && availablePrograms.length > 0 ? (
            <div className="space-y-6">
              {availablePrograms.map((program) => {
                const pathway = program.career_pathways as { name: string } | null;
                const regCount = (program.registrations as unknown as { count: number }[])?.[0]?.count || 0;
                const spotsLeft = program.max_participants
                  ? program.max_participants - regCount
                  : null;
                const isFull = spotsLeft !== null && spotsLeft <= 0;

                return (
                  <div
                    key={program.id}
                    className="p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{program.name}</h3>
                          {program.featured && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                          <Badge variant="secondary">
                            {PROGRAM_TYPE_LABELS[program.program_type as ProgramType]}
                          </Badge>
                          {pathway && <span>{pathway.name}</span>}
                        </div>

                        {program.description && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {program.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          {program.start_date && (
                            <span className="text-slate-600">
                              {formatDate(program.start_date)}
                              {program.end_date && program.end_date !== program.start_date && (
                                <> - {formatDate(program.end_date)}</>
                              )}
                            </span>
                          )}
                          {program.price_cents > 0 && (
                            <span className="font-medium text-slate-900">
                              {formatCurrency(program.price_cents)}
                            </span>
                          )}
                          {spotsLeft !== null && (
                            <span className={spotsLeft <= 5 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full (Waitlist)'}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant={program.status === 'registration_open' ? 'success' : 'info'}
                      >
                        {program.status === 'registration_open' ? 'Open' : 'Coming Soon'}
                      </Badge>
                    </div>

                    {/* Registration Forms for Each Child */}
                    {children && children.length > 0 && program.status === 'registration_open' && (
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-sm font-medium text-slate-700 mb-3">
                          Register a student:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {children.map((child) => {
                            const profileData = child.users_profile as unknown;
                            const profile = Array.isArray(profileData) ? profileData[0] : profileData as { id: string; full_name: string };
                            const isRegistered = registeredByChild.get(child.user_id)?.has(program.id);

                            if (isRegistered) {
                              return (
                                <span
                                  key={child.user_id}
                                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm"
                                >
                                  {profile.full_name} - Registered
                                </span>
                              );
                            }

                            return (
                              <form key={child.user_id} action={registerStudentAction}>
                                <input type="hidden" name="programId" value={program.id} />
                                <input type="hidden" name="studentId" value={child.user_id} />
                                <button
                                  type="submit"
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isFull
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {profile.full_name} ({isFull ? 'Join Waitlist' : 'Register'})
                                </button>
                              </form>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(!children || children.length === 0) && (
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-500">
                          No students in your family to register.{' '}
                          <Link href="/parent" className="text-blue-600 hover:underline">
                            Add a student first
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Programs Available</h3>
              <p className="text-slate-500">Check back soon for upcoming camps and workshops!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Types Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl mb-2">🏕️</div>
            <h4 className="font-medium text-slate-900">Camps</h4>
            <p className="text-xs text-slate-500">Multi-day immersive programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl mb-2">🔧</div>
            <h4 className="font-medium text-slate-900">Workshops</h4>
            <p className="text-xs text-slate-500">Focused skill-building sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl mb-2">🏆</div>
            <h4 className="font-medium text-slate-900">Competitions</h4>
            <p className="text-xs text-slate-500">Math challenges and contests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
