'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, canAccessStudent, isAdminOrAbove } from '@/lib/auth';
import { emitEvent } from '@/lib/events';
import { sendBookingConfirmation } from '@/lib/notifications';
import { z } from 'zod';

const createBookingSchema = z.object({
  studentUserId: z.string().uuid(),
  tutorUserId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional(),
});

const rescheduleBookingSchema = z.object({
  bookingId: z.string().uuid(),
  newStartAt: z.string().datetime(),
  newEndAt: z.string().datetime(),
});

const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required'),
});

export type BookingActionResult = {
  success: boolean;
  error?: string;
  bookingId?: string;
};

export async function createBooking(
  formData: FormData
): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const rawData = {
    studentUserId: formData.get('studentUserId'),
    tutorUserId: formData.get('tutorUserId'),
    startAt: formData.get('startAt'),
    endAt: formData.get('endAt'),
    notes: formData.get('notes') || undefined,
  };

  const result = createBookingSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { studentUserId, tutorUserId, startAt, endAt, notes } = result.data;

  // Verify user can access this student
  const canAccess = await canAccessStudent(studentUserId);
  if (!canAccess) {
    return { success: false, error: 'You cannot book for this student' };
  }

  const supabase = await createClient();

  // Get family ID for the student
  const { data: student, error: studentError } = await supabase
    .from('students_profile')
    .select('family_id')
    .eq('user_id', studentUserId)
    .single();

  if (studentError || !student) {
    return { success: false, error: 'Student not found' };
  }

  // Check if family has credits
  const { data: family } = await supabase
    .from('families')
    .select('credit_balance')
    .eq('id', student.family_id)
    .single();

  if (!family || family.credit_balance < 1) {
    return { success: false, error: 'Insufficient credits' };
  }

  // Create booking (atomic - DB constraint prevents overlaps)
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      student_user_id: studentUserId,
      tutor_user_id: tutorUserId,
      family_id: student.family_id,
      start_at: startAt,
      end_at: endAt,
      status: 'pending',
      notes: notes || null,
    })
    .select('id')
    .single();

  if (bookingError) {
    if (bookingError.code === '23P01') {
      return { success: false, error: 'This time slot is no longer available' };
    }
    console.error('Booking error:', bookingError);
    return { success: false, error: 'Failed to create booking' };
  }

  // Emit event
  await emitEvent({
    type: 'booking.created.v1',
    actorUserId: user.id,
    subjectType: 'booking',
    subjectId: booking.id,
    data: {
      booking_id: booking.id,
      student_user_id: studentUserId,
      tutor_user_id: tutorUserId,
      family_id: student.family_id,
      start_at: startAt,
      end_at: endAt,
    },
  });

  // Send notification (fire and forget — don't block on email)
  sendBookingConfirmation({
    id: booking.id,
    student_user_id: studentUserId,
    tutor_user_id: tutorUserId,
    parent_user_id: user.id,
    family_id: student.family_id,
    start_at: startAt,
    end_at: endAt,
    modality: 'online',
  }).catch(err => console.error('[notifications] booking confirmation:', err));

  revalidatePath('/parent');
  revalidatePath('/tutor');

  return { success: true, bookingId: booking.id };
}

export async function confirmBooking(
  bookingId: string
): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Verify this is the assigned tutor
  const { data: booking } = await supabase
    .from('bookings')
    .select('tutor_user_id, student_user_id, family_id, start_at, end_at, status')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.tutor_user_id !== user.id && !isAdminOrAbove(user)) {
    return { success: false, error: 'Only the assigned tutor can confirm' };
  }

  if (booking.status !== 'pending') {
    return { success: false, error: 'Booking cannot be confirmed in its current state' };
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId);

  if (updateError) {
    return { success: false, error: 'Failed to confirm booking' };
  }

  await emitEvent({
    type: 'booking.confirmed.v1',
    actorUserId: user.id,
    subjectType: 'booking',
    subjectId: bookingId,
    data: {
      booking_id: bookingId,
      student_user_id: booking.student_user_id,
      tutor_user_id: booking.tutor_user_id,
      start_at: booking.start_at,
    },
  });

  revalidatePath('/parent');
  revalidatePath('/tutor');

  return { success: true, bookingId };
}

export async function rescheduleBooking(
  formData: FormData
): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const rawData = {
    bookingId: formData.get('bookingId'),
    newStartAt: formData.get('newStartAt'),
    newEndAt: formData.get('newEndAt'),
  };

  const result = rescheduleBookingSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { bookingId, newStartAt, newEndAt } = result.data;

  const supabase = await createClient();

  // Get current booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Check permissions (parent in family or tutor assigned or admin)
  const canAccess = await canAccessStudent(booking.student_user_id);
  const isTutor = booking.tutor_user_id === user.id;
  const isAdmin = isAdminOrAbove(user);

  if (!canAccess && !isTutor && !isAdmin) {
    return { success: false, error: 'You cannot reschedule this booking' };
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return { success: false, error: 'This booking cannot be rescheduled' };
  }

  // Update to new time
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      start_at: newStartAt,
      end_at: newEndAt,
      status: 'pending', // Reset to pending for re-confirmation
    })
    .eq('id', bookingId);

  if (updateError) {
    if (updateError.code === '23P01') {
      return { success: false, error: 'This time slot is not available' };
    }
    return { success: false, error: 'Failed to reschedule booking' };
  }

  await emitEvent({
    type: 'booking.rescheduled.v1',
    actorUserId: user.id,
    subjectType: 'booking',
    subjectId: bookingId,
    data: {
      booking_id: bookingId,
      old_start_at: booking.start_at,
      old_end_at: booking.end_at,
      new_start_at: newStartAt,
      new_end_at: newEndAt,
      rescheduled_by: user.id,
    },
  });

  revalidatePath('/parent');
  revalidatePath('/tutor');

  return { success: true, bookingId };
}

export async function cancelBooking(
  formData: FormData
): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const rawData = {
    bookingId: formData.get('bookingId'),
    reason: formData.get('reason'),
  };

  const result = cancelBookingSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { bookingId, reason } = result.data;

  const supabase = await createClient();

  // Get booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Check permissions
  const canAccess = await canAccessStudent(booking.student_user_id);
  const isTutor = booking.tutor_user_id === user.id;
  const isAdmin = isAdminOrAbove(user);

  if (!canAccess && !isTutor && !isAdmin) {
    return { success: false, error: 'You cannot cancel this booking' };
  }

  if (['completed', 'canceled'].includes(booking.status)) {
    return { success: false, error: 'This booking cannot be canceled' };
  }

  // Calculate if within 24 hours (for late cancellation tracking)
  const startTime = new Date(booking.start_at).getTime();
  const now = Date.now();
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);
  const isLateCancellation = hoursUntilStart < 24;

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      canceled_by: user.id,
      cancel_reason: reason,
    })
    .eq('id', bookingId);

  if (updateError) {
    return { success: false, error: 'Failed to cancel booking' };
  }

  await emitEvent({
    type: 'booking.canceled.v1',
    actorUserId: user.id,
    subjectType: 'booking',
    subjectId: bookingId,
    data: {
      booking_id: bookingId,
      canceled_by: user.id,
      reason,
      is_late_cancellation: isLateCancellation,
      hours_until_start: hoursUntilStart,
    },
  });

  revalidatePath('/parent');
  revalidatePath('/tutor');

  return { success: true, bookingId };
}

export async function markNoShow(
  bookingId: string
): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Only tutor or admin can mark no-show
  const isTutor = booking.tutor_user_id === user.id;
  const isAdmin = isAdminOrAbove(user);

  if (!isTutor && !isAdmin) {
    return { success: false, error: 'Only the tutor can mark a no-show' };
  }

  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Only confirmed bookings can be marked as no-show' };
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'no_show' })
    .eq('id', bookingId);

  if (updateError) {
    return { success: false, error: 'Failed to update booking' };
  }

  await emitEvent({
    type: 'booking.no_show_marked.v1',
    actorUserId: user.id,
    subjectType: 'booking',
    subjectId: bookingId,
    data: {
      booking_id: bookingId,
      student_user_id: booking.student_user_id,
      tutor_user_id: booking.tutor_user_id,
      family_id: booking.family_id,
    },
  });

  revalidatePath('/parent');
  revalidatePath('/tutor');
  revalidatePath('/admin');

  return { success: true, bookingId };
}
