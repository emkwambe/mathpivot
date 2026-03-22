import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import {
  generateICS,
  generateGoogleCalendarLink,
  generateOutlookLink,
  createCalendarEventFromBooking,
} from '@/lib/calendar';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get booking with related data
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      student:users_profile!student_user_id(full_name),
      tutor:users_profile!tutor_user_id(full_name, email),
      parent:users_profile!parent_user_id(email)
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Verify access
  const hasAccess =
    user.id === booking.student_user_id ||
    user.id === booking.tutor_user_id ||
    user.id === booking.parent_user_id ||
    user.role === 'admin' ||
    user.role === 'super_admin';

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const student = booking.student as { full_name: string };
  const tutor = booking.tutor as { full_name: string; email: string };
  const parent = booking.parent as { email: string };

  const calendarEvent = createCalendarEventFromBooking({
    id: booking.id,
    start_at: booking.start_at,
    end_at: booking.end_at,
    modality: booking.modality,
    video_link: booking.video_link,
    student_name: student.full_name,
    tutor_name: tutor.full_name,
    tutor_email: tutor.email,
    parent_email: parent.email,
  });

  // Check format parameter
  const format = request.nextUrl.searchParams.get('format');

  if (format === 'ics') {
    // Return ICS file download
    const ics = generateICS(calendarEvent);
    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="tutoring-session-${bookingId}.ics"`,
      },
    });
  }

  // Return all calendar links
  return NextResponse.json({
    google: generateGoogleCalendarLink(calendarEvent),
    outlook: generateOutlookLink(calendarEvent),
    icsDownload: `/api/bookings/${bookingId}/calendar?format=ics`,
    event: {
      title: calendarEvent.title,
      startAt: calendarEvent.startAt.toISOString(),
      endAt: calendarEvent.endAt.toISOString(),
      videoLink: calendarEvent.videoLink,
    },
  });
}
