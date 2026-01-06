'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { emitEvent } from '@/lib/events';
import { z } from 'zod';

const startSessionSchema = z.object({
  bookingId: z.string().uuid(),
});

const endSessionSchema = z.object({
  sessionId: z.string().uuid(),
  tutorNotes: z.string().optional(),
  nextSteps: z.string().optional(),
  skillsCovered: z.array(z.string().uuid()).optional(),
});

const updateMasterySchema = z.object({
  studentUserId: z.string().uuid(),
  skillId: z.string().uuid(),
  level: z.enum(['not_started', 'developing', 'proficient', 'mastered']),
  notes: z.string().optional(),
});

export type SessionActionResult = {
  success: boolean;
  error?: string;
  sessionId?: string;
};

export async function startSession(
  bookingId: string
): Promise<SessionActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Get the booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Only the assigned tutor or admin can start
  if (booking.tutor_user_id !== user.id && user.role !== 'admin') {
    return { success: false, error: 'Only the assigned tutor can start this session' };
  }

  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Only confirmed bookings can be started' };
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      booking_id: bookingId,
      student_user_id: booking.student_user_id,
      tutor_user_id: booking.tutor_user_id,
      family_id: booking.family_id,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (sessionError) {
    console.error('Session error:', sessionError);
    return { success: false, error: 'Failed to start session' };
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({ status: 'in_progress' })
    .eq('id', bookingId);

  // Emit event
  await emitEvent({
    type: 'session.started.v1',
    actorUserId: user.id,
    subjectType: 'session',
    subjectId: session.id,
    data: {
      session_id: session.id,
      booking_id: bookingId,
      student_user_id: booking.student_user_id,
      tutor_user_id: booking.tutor_user_id,
    },
  });

  revalidatePath('/tutor');

  return { success: true, sessionId: session.id };
}

export async function endSession(
  formData: FormData
): Promise<SessionActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const rawData = {
    sessionId: formData.get('sessionId'),
    tutorNotes: formData.get('tutorNotes') || undefined,
    nextSteps: formData.get('nextSteps') || undefined,
    skillsCovered: formData.getAll('skillsCovered').filter(Boolean) as string[],
  };

  const result = endSessionSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { sessionId, tutorNotes, nextSteps, skillsCovered } = result.data;

  const supabase = await createClient();

  // Get session
  const { data: session } = await supabase
    .from('sessions')
    .select('*, booking_id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (session.tutor_user_id !== user.id && user.role !== 'admin') {
    return { success: false, error: 'Only the assigned tutor can end this session' };
  }

  if (session.ended_at) {
    return { success: false, error: 'Session has already ended' };
  }

  // Update session
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      ended_at: new Date().toISOString(),
      tutor_notes: tutorNotes || null,
      next_steps: nextSteps || null,
      skills_covered: skillsCovered && skillsCovered.length > 0 ? skillsCovered : null,
    })
    .eq('id', sessionId);

  if (updateError) {
    return { success: false, error: 'Failed to end session' };
  }

  // Update booking status to completed
  await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', session.booking_id);

  // Deduct credit from family
  await supabase.rpc('decrement_family_credits', {
    p_family_id: session.family_id,
    p_amount: 1,
  });

  // Emit event
  await emitEvent({
    type: 'session.completed.v1',
    actorUserId: user.id,
    subjectType: 'session',
    subjectId: sessionId,
    data: {
      session_id: sessionId,
      booking_id: session.booking_id,
      student_user_id: session.student_user_id,
      tutor_user_id: session.tutor_user_id,
      duration_minutes: Math.round(
        (new Date().getTime() - new Date(session.started_at).getTime()) / 60000
      ),
    },
  });

  revalidatePath('/tutor');
  revalidatePath('/parent');

  return { success: true, sessionId };
}

export async function updateStudentMastery(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'tutor' && user.role !== 'admin')) {
    return { success: false, error: 'Only tutors can update mastery' };
  }

  const rawData = {
    studentUserId: formData.get('studentUserId'),
    skillId: formData.get('skillId'),
    level: formData.get('level'),
    notes: formData.get('notes') || undefined,
  };

  const result = updateMasterySchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { studentUserId, skillId, level, notes } = result.data;

  const supabase = await createClient();

  // Upsert mastery record
  const { error } = await supabase
    .from('mastery')
    .upsert(
      {
        student_user_id: studentUserId,
        skill_id: skillId,
        current_level: level,
        last_assessed_at: new Date().toISOString(),
        last_assessed_by: user.id,
        notes: notes || null,
      },
      {
        onConflict: 'student_user_id,skill_id',
      }
    );

  if (error) {
    console.error('Mastery error:', error);
    return { success: false, error: 'Failed to update mastery' };
  }

  // Emit event
  await emitEvent({
    type: 'mastery.level_updated.v1',
    actorUserId: user.id,
    subjectType: 'student_skill_mastery',
    subjectId: `${studentUserId}:${skillId}`,
    data: {
      student_user_id: studentUserId,
      skill_id: skillId,
      level,
      assessed_by: user.id,
    },
  });

  revalidatePath('/tutor');
  revalidatePath(`/parent/students/${studentUserId}`);

  return { success: true };
}

export async function addSessionNote(
  sessionId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('tutor_user_id, tutor_notes')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (session.tutor_user_id !== user.id && user.role !== 'admin') {
    return { success: false, error: 'Only the assigned tutor can add notes' };
  }

  const updatedNotes = session.tutor_notes
    ? `${session.tutor_notes}\n\n${note}`
    : note;

  const { error } = await supabase
    .from('sessions')
    .update({ tutor_notes: updatedNotes })
    .eq('id', sessionId);

  if (error) {
    return { success: false, error: 'Failed to add note' };
  }

  revalidatePath(`/tutor/sessions/${sessionId}`);

  return { success: true };
}
