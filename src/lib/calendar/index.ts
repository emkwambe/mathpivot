/**
 * Calendar utilities for MathPivot TutorOS
 * Generates ICS files and Google Calendar links
 */
import ical, { ICalCalendarMethod, ICalEventStatus } from 'ical-generator';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  videoLink?: string;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

/**
 * Generate an ICS calendar file content
 */
export function generateICS(event: CalendarEvent): string {
  const calendar = ical({
    name: 'MathPivot Tutoring',
    method: ICalCalendarMethod.REQUEST,
  });

  const icalEvent = calendar.createEvent({
    id: event.id,
    start: event.startAt,
    end: event.endAt,
    summary: event.title,
    description: buildDescription(event),
    location: event.videoLink || event.location,
    status: ICalEventStatus.CONFIRMED,
    url: event.videoLink,
  });

  if (event.organizer) {
    icalEvent.organizer({
      name: event.organizer.name,
      email: event.organizer.email,
    });
  }

  if (event.attendees) {
    for (const attendee of event.attendees) {
      icalEvent.createAttendee({
        name: attendee.name,
        email: attendee.email,
      });
    }
  }

  return calendar.toString();
}

/**
 * Generate a Google Calendar link
 */
export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startAt)}/${formatDate(event.endAt)}`,
    details: buildDescription(event),
  });

  if (event.videoLink) {
    params.set('location', event.videoLink);
  } else if (event.location) {
    params.set('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook calendar link
 */
export function generateOutlookLink(event: CalendarEvent): string {
  const formatDate = (date: Date) => date.toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: formatDate(event.startAt),
    enddt: formatDate(event.endAt),
    body: buildDescription(event),
  });

  if (event.videoLink || event.location) {
    params.set('location', event.videoLink || event.location || '');
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Build event description with video link
 */
function buildDescription(event: CalendarEvent): string {
  let description = event.description || 'MathPivot Tutoring Session';

  if (event.videoLink) {
    description += `\n\nJoin video call: ${event.videoLink}`;
  }

  return description;
}

/**
 * Generate a unique video meeting link (stub for Zoom/Meet integration)
 * In production, this would integrate with Zoom API or Google Meet API
 */
export function generateVideoMeetingLink(bookingId: string): string {
  // For now, return a placeholder that could be replaced with actual Zoom/Meet integration
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mathpivot.com';
  return `${baseUrl}/session/${bookingId}/join`;
}

/**
 * Create calendar event data from booking
 */
export function createCalendarEventFromBooking(booking: {
  id: string;
  start_at: string;
  end_at: string;
  modality: string;
  video_link?: string | null;
  student_name: string;
  tutor_name: string;
  tutor_email: string;
  parent_email: string;
}): CalendarEvent {
  return {
    id: booking.id,
    title: `Math Tutoring: ${booking.student_name} with ${booking.tutor_name}`,
    description: `Tutoring session for ${booking.student_name} with ${booking.tutor_name}.`,
    startAt: new Date(booking.start_at),
    endAt: new Date(booking.end_at),
    location: booking.modality === 'in_person' ? 'In Person' : undefined,
    videoLink: booking.modality === 'online' ? (booking.video_link || undefined) : undefined,
    organizer: {
      name: booking.tutor_name,
      email: booking.tutor_email,
    },
    attendees: [
      { name: booking.student_name, email: booking.parent_email },
    ],
  };
}

/**
 * Get all calendar links for a booking
 */
export function getCalendarLinks(event: CalendarEvent): {
  google: string;
  outlook: string;
  ics: string;
} {
  return {
    google: generateGoogleCalendarLink(event),
    outlook: generateOutlookLink(event),
    ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(generateICS(event))}`,
  };
}
