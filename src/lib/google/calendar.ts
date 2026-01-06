/**
 * Google Calendar Integration for MathPivot TutorOS
 * Syncs tutoring sessions with Google Calendar
 */
import { google, calendar_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const config: GoogleCalendarConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
};

export function isGoogleCalendarConfigured(): boolean {
  return !!(config.clientId && config.clientSecret);
}

/**
 * Create OAuth2 client
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

/**
 * Generate OAuth URL for user authorization
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiryDate: number } | null> {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) return null;

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiryDate: tokens.expiry_date || Date.now() + 3600000,
    };
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error);
    return null;
  }
}

/**
 * Create authenticated calendar client
 */
export function createCalendarClient(
  accessToken: string,
  refreshToken?: string
): calendar_v3.Calendar {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event for a booking
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    videoLink?: string;
    attendees?: string[];
  }
): Promise<{ eventId: string; htmlLink: string } | null> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);

    const calendarEvent: calendar_v3.Schema$Event = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'UTC',
      },
      location: event.videoLink || event.location,
      attendees: event.attendees?.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours
          { method: 'popup', minutes: 60 }, // 1 hour
          { method: 'popup', minutes: 15 }, // 15 minutes
        ],
      },
      conferenceData: event.videoLink
        ? {
            entryPoints: [
              {
                entryPointType: 'video',
                uri: event.videoLink,
                label: 'Join Video Call',
              },
            ],
          }
        : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
      sendUpdates: 'all',
    });

    if (!response.data.id) return null;

    return {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink || '',
    };
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return null;
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  updates: {
    summary?: string;
    startTime?: Date;
    endTime?: Date;
    description?: string;
    location?: string;
  }
): Promise<boolean> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);

    const patch: calendar_v3.Schema$Event = {};
    if (updates.summary) patch.summary = updates.summary;
    if (updates.description) patch.description = updates.description;
    if (updates.location) patch.location = updates.location;
    if (updates.startTime) {
      patch.start = { dateTime: updates.startTime.toISOString(), timeZone: 'UTC' };
    }
    if (updates.endTime) {
      patch.end = { dateTime: updates.endTime.toISOString(), timeZone: 'UTC' };
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: patch,
      sendUpdates: 'all',
    });

    return true;
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    return false;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
): Promise<boolean> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });

    return true;
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
    return false;
  }
}

/**
 * List upcoming events
 */
export async function listUpcomingEvents(
  accessToken: string,
  refreshToken: string,
  maxResults: number = 10
): Promise<calendar_v3.Schema$Event[]> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Failed to list calendar events:', error);
    return [];
  }
}

/**
 * Sync booking to Google Calendar
 */
export async function syncBookingToCalendar(
  userTokens: { accessToken: string; refreshToken: string },
  booking: {
    id: string;
    student_name: string;
    tutor_name: string;
    start_at: string;
    end_at: string;
    video_link?: string;
    modality: string;
  }
): Promise<{ eventId: string } | null> {
  const result = await createCalendarEvent(
    userTokens.accessToken,
    userTokens.refreshToken,
    {
      summary: `Math Tutoring: ${booking.student_name}`,
      description: `MathPivot tutoring session\n\nStudent: ${booking.student_name}\nTutor: ${booking.tutor_name}\n\nBooking ID: ${booking.id}`,
      startTime: new Date(booking.start_at),
      endTime: new Date(booking.end_at),
      videoLink: booking.modality === 'online' ? booking.video_link : undefined,
      location: booking.modality === 'in_person' ? 'In Person' : undefined,
    }
  );

  return result ? { eventId: result.eventId } : null;
}
