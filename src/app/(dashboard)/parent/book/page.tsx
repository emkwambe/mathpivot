import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { BookingForm } from './BookingForm';

export default async function BookPage() {
  const user = await requireRole(['parent', 'student']);
  const supabase = await createClient();

  // Get user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!familyMember) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">
              You are not associated with a family. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get family's students
  const { data: students } = await supabase
    .from('students_profile')
    .select(`
      user_id,
      grade_level,
      users_profile!inner(full_name)
    `)
    .eq('family_id', familyMember.family_id);

  // Get family's credit balance
  const { data: family } = await supabase
    .from('families')
    .select('credit_balance')
    .eq('id', familyMember.family_id)
    .single();

  // Get active tutors
  const { data: tutors } = await supabase
    .from('tutors_profile')
    .select(`
      user_id,
      bio,
      hourly_rate_cents,
      users_profile!inner(full_name)
    `)
    .eq('is_active', true);

  const formattedStudents = students?.map((s) => ({
    id: s.user_id,
    name: (s.users_profile as unknown as { full_name: string }).full_name,
    gradeLevel: s.grade_level,
  })) || [];

  const formattedTutors = tutors?.map((t) => ({
    id: t.user_id,
    name: (t.users_profile as unknown as { full_name: string }).full_name,
    bio: t.bio,
    hourlyRateCents: t.hourly_rate_cents,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Session</h1>
        <p className="text-slate-600">Schedule a tutoring session for your student</p>
      </div>

      {/* Credit Balance Alert */}
      {family && family.credit_balance < 1 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-amber-900">No Credits Available</p>
                <p className="text-sm text-amber-700">
                  You need credits to book sessions. Please purchase a package first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          {formattedStudents.length === 0 ? (
            <p className="text-center text-slate-600 py-6">
              No students found in your family. Please add a student first.
            </p>
          ) : formattedTutors.length === 0 ? (
            <p className="text-center text-slate-600 py-6">
              No tutors are currently available. Please check back later.
            </p>
          ) : (
            <BookingForm
              students={formattedStudents}
              tutors={formattedTutors}
              creditBalance={family?.credit_balance || 0}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
