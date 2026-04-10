'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export type FamilyResult = { success: boolean; error?: string };

const addStudentSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  grade: z.coerce.number().int().min(1).max(12),
  courseTrack: z.enum(['math_1', 'math_2', 'math_3', 'pre_calc', 'ap_calc_ab', 'ap_calc_bc', 'ap_stats']).default('math_1'),
  goals: z.string().optional(),
});

// ============================================================
// ADD STUDENT TO FAMILY (parent self-service)
// ============================================================
export async function addStudentToFamily(formData: FormData): Promise<FamilyResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const parsed = addStudentSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    grade: formData.get('grade'),
    courseTrack: formData.get('courseTrack') || 'math_1',
    goals: formData.get('goals') || undefined,
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Get parent's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('member_role', 'parent')
    .single();

  if (!membership) return { success: false, error: 'No family found. Please contact support.' };

  const admin = createAdminClient();

  // Create auth user for student
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: 'Welcome123!',
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.fullName,
      role: 'student',
    },
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return { success: false, error: 'This email is already registered. Contact support if this is your student.' };
    }
    return { success: false, error: authError.message };
  }

  // Profile should be auto-created by trigger, but ensure it
  await admin.from('users_profile').upsert({
    id: newUser.user.id,
    email: parsed.data.email,
    role: 'student',
    full_name: parsed.data.fullName,
  }, { onConflict: 'id' });

  // Create student profile
  await admin.from('students_profile').upsert({
    user_id: newUser.user.id,
    family_id: membership.family_id,
    grade: parsed.data.grade,
    course_track: parsed.data.courseTrack,
    goals: parsed.data.goals || null,
  }, { onConflict: 'user_id' });

  // Add to family
  await admin.from('family_members').upsert({
    family_id: membership.family_id,
    user_id: newUser.user.id,
    member_role: 'student',
  }, { onConflict: 'family_id,user_id' });

  revalidatePath('/parent');
  return { success: true };
}

// ============================================================
// GET FAMILY STUDENTS (parent)
// ============================================================
export async function getFamilyStudents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { students: [], error: 'Not authenticated' };

  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('member_role', 'parent')
    .single();

  if (!membership) return { students: [], error: null };

  const { data, error } = await supabase
    .from('family_members')
    .select(`
      user_id,
      users_profile:user_id (full_name, email),
      students_profile:user_id (grade, course_track, goals)
    `)
    .eq('family_id', membership.family_id)
    .eq('member_role', 'student');

  if (error) return { students: [], error: error.message };
  return { students: data || [], error: null };
}
