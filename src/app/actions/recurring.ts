'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export type RecurringResult = { success: boolean; error?: string; seriesId?: string };

// ============================================================
// GET RECURRING SERIES
// ============================================================
export async function getRecurringSeries() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recurring_series')
    .select(`
      *,
      tutor:tutor_user_id (full_name),
      student:student_user_id (full_name),
      room:room_id (name)
    `)
    .order('created_at', { ascending: false });

  if (error) return { series: [], error: error.message };
  return { series: data || [], error: null };
}

// ============================================================
// CREATE RECURRING SERIES (admin)
// ============================================================
const createSeriesSchema = z.object({
  tutorUserId: z.string().uuid(),
  studentUserId: z.string().uuid().optional(),
  familyId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  pattern: z.enum(['weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  modality: z.enum(['online', 'in_person']),
  isGroup: z.coerce.boolean().default(false),
  maxStudents: z.coerce.number().int().min(1).default(1),
  subject: z.string().optional(),
  title: z.string().optional(),
  startsOn: z.string(),
  endsOn: z.string().optional(),
});

export async function createRecurringSeries(formData: FormData): Promise<RecurringResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const parsed = createSeriesSchema.safeParse({
    tutorUserId: formData.get('tutorUserId'),
    studentUserId: formData.get('studentUserId') || undefined,
    familyId: formData.get('familyId') || undefined,
    roomId: formData.get('roomId') || undefined,
    pattern: formData.get('pattern'),
    dayOfWeek: formData.get('dayOfWeek'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    modality: formData.get('modality') || 'online',
    isGroup: formData.get('isGroup') === 'true',
    maxStudents: formData.get('maxStudents') || 1,
    subject: formData.get('subject') || undefined,
    title: formData.get('title') || undefined,
    startsOn: formData.get('startsOn'),
    endsOn: formData.get('endsOn') || undefined,
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from('recurring_series')
    .insert({
      tutor_user_id: parsed.data.tutorUserId,
      student_user_id: parsed.data.studentUserId || null,
      family_id: parsed.data.familyId || null,
      room_id: parsed.data.roomId || null,
      pattern: parsed.data.pattern,
      day_of_week: parsed.data.dayOfWeek,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      modality: parsed.data.modality,
      is_group: parsed.data.isGroup,
      max_students: parsed.data.maxStudents,
      subject: parsed.data.subject || null,
      title: parsed.data.title || null,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn || null,
      created_by: user?.id || null,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/calendar');
  return { success: true, seriesId: data?.id };
}

// ============================================================
// GENERATE BOOKINGS FROM SERIES (admin)
// ============================================================
export async function generateRecurringBookings(seriesId: string, weeksAhead = 4): Promise<RecurringResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('generate_recurring_bookings', {
    p_series_id: seriesId,
    p_weeks_ahead: weeksAhead,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/calendar');
  return { success: true, error: data === 0 ? 'No new bookings generated (slots may already exist)' : undefined };
}

// ============================================================
// PAUSE / RESUME SERIES
// ============================================================
export async function toggleRecurringSeries(seriesId: string, active: boolean): Promise<RecurringResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('recurring_series')
    .update({ is_active: active })
    .eq('id', seriesId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/calendar');
  return { success: true };
}

// ============================================================
// GET ROOMS
// ============================================================
export async function getRooms() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('name');

  if (error) return { rooms: [], error: error.message };
  return { rooms: data || [], error: null };
}

// ============================================================
// CREATE / UPDATE ROOM (admin)
// ============================================================
const roomSchema = z.object({
  name: z.string().min(1),
  roomType: z.enum(['classroom', 'lab', 'office', 'virtual']),
  capacity: z.coerce.number().int().min(1),
  location: z.string().optional(),
  floor: z.string().optional(),
  isVirtual: z.coerce.boolean().default(false),
  virtualLink: z.string().optional(),
  notes: z.string().optional(),
});

export async function createRoom(formData: FormData): Promise<RecurringResult> {
  const supabase = await createClient();

  const parsed = roomSchema.safeParse({
    name: formData.get('name'),
    roomType: formData.get('roomType'),
    capacity: formData.get('capacity'),
    location: formData.get('location') || undefined,
    floor: formData.get('floor') || undefined,
    isVirtual: formData.get('isVirtual') === 'true',
    virtualLink: formData.get('virtualLink') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from('rooms')
    .insert({
      name: parsed.data.name,
      room_type: parsed.data.roomType,
      capacity: parsed.data.capacity,
      location: parsed.data.location || null,
      floor: parsed.data.floor || null,
      is_virtual: parsed.data.isVirtual,
      virtual_link: parsed.data.virtualLink || null,
      notes: parsed.data.notes || null,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/rooms');
  return { success: true };
}

export async function toggleRoom(roomId: string, active: boolean): Promise<RecurringResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('rooms')
    .update({ is_active: active })
    .eq('id', roomId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/rooms');
  return { success: true };
}

// ============================================================
// GET CALENDAR EVENTS (bookings as calendar events)
// ============================================================
export async function getCalendarEvents(startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_at,
      end_at,
      status,
      modality,
      is_group_session,
      notes,
      room:room_id (name),
      tutor:tutor_user_id (full_name),
      student:student_user_id (full_name),
      parent:parent_user_id (full_name)
    `)
    .gte('start_at', startDate)
    .lte('start_at', endDate)
    .neq('status', 'canceled')
    .order('start_at', { ascending: true }) as { data: any[] | null; error: any };

  if (error) return { events: [], error: error.message };

  const events = (data || []).map((b: any) => ({
    id: b.id,
    title: b.is_group_session
      ? `Group: ${b.tutor?.full_name || 'TBD'}`
      : `${b.student?.full_name || 'Student'} — ${b.tutor?.full_name || 'Tutor'}`,
    start: b.start_at,
    end: b.end_at,
    status: b.status,
    modality: b.modality,
    isGroup: b.is_group_session,
    room: b.room?.name || null,
    tutorName: b.tutor?.full_name,
    studentName: b.student?.full_name,
  }));

  return { events, error: null };
}
