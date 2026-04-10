'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export type DropInResult = { success: boolean; error?: string };

// ============================================================
// GET DROP-IN SLOTS
// ============================================================
export async function getDropInSlots() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('drop_in_slots')
    .select(`
      *,
      tutor:tutor_user_id (full_name),
      room:room_id (name, capacity)
    `)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true });

  if (error) return { slots: [], error: error.message };
  return { slots: data || [], error: null };
}

// ============================================================
// CREATE DROP-IN SLOT (admin)
// ============================================================
const slotSchema = z.object({
  tutorUserId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  title: z.string().min(1),
  subject: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  maxConcurrent: z.coerce.number().int().min(1).default(5),
  modality: z.enum(['online', 'in_person']).default('in_person'),
});

export async function createDropInSlot(formData: FormData): Promise<DropInResult> {
  const supabase = await createClient();

  const parsed = slotSchema.safeParse({
    tutorUserId: formData.get('tutorUserId'),
    roomId: formData.get('roomId') || undefined,
    title: formData.get('title'),
    subject: formData.get('subject') || undefined,
    dayOfWeek: formData.get('dayOfWeek'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    maxConcurrent: formData.get('maxConcurrent') || 5,
    modality: formData.get('modality') || 'in_person',
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from('drop_in_slots')
    .insert({
      tutor_user_id: parsed.data.tutorUserId,
      room_id: parsed.data.roomId || null,
      title: parsed.data.title,
      subject: parsed.data.subject || null,
      day_of_week: parsed.data.dayOfWeek,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      max_concurrent: parsed.data.maxConcurrent,
      modality: parsed.data.modality,
    });

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/drop-in');
  return { success: true };
}

// ============================================================
// CHECK IN STUDENT (student self-service or admin)
// ============================================================
export async function checkInStudent(slotId: string): Promise<DropInResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get student's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  // Check capacity
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('drop_in_attendance')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slotId)
    .gte('check_in_at', today)
    .is('check_out_at', null);

  const { data: slot } = await supabase
    .from('drop_in_slots')
    .select('max_concurrent')
    .eq('id', slotId)
    .single();

  if (slot && count !== null && count >= slot.max_concurrent) {
    return { success: false, error: 'This session is at full capacity' };
  }

  const { error } = await supabase
    .from('drop_in_attendance')
    .insert({
      slot_id: slotId,
      student_user_id: user.id,
      family_id: membership?.family_id || null,
    });

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/drop-in');
  return { success: true };
}

// ============================================================
// CHECK OUT STUDENT
// ============================================================
export async function checkOutStudent(attendanceId: string, notes?: string): Promise<DropInResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('drop_in_attendance')
    .update({
      check_out_at: new Date().toISOString(),
      tutor_notes: notes || null,
    })
    .eq('id', attendanceId)
    .is('check_out_at', null);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/drop-in');
  return { success: true };
}

// ============================================================
// GET TODAY'S DROP-IN ATTENDANCE (for tutor/admin view)
// ============================================================
export async function getTodayDropInAttendance(slotId?: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('drop_in_attendance')
    .select(`
      *,
      student:student_user_id (full_name, email),
      slot:slot_id (title, subject)
    `)
    .gte('check_in_at', today)
    .order('check_in_at', { ascending: false });

  if (slotId) query = query.eq('slot_id', slotId);

  const { data, error } = await query;
  if (error) return { attendance: [], error: error.message };
  return { attendance: data || [], error: null };
}
