/**
 * Zoom API Integration for MathPivot TutorOS
 * Creates and manages Zoom meetings for online tutoring sessions
 */

interface ZoomConfig {
  accountId: string;
  clientId: string;
  clientSecret: string;
}

interface ZoomMeeting {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  start_url: string;
  join_url: string;
  password: string;
  duration: number;
  start_time: string;
}

interface CreateMeetingParams {
  topic: string;
  startTime: Date;
  durationMinutes: number;
  hostEmail?: string;
  agenda?: string;
}

// Zoom OAuth token cache
let accessToken: string | null = null;
let tokenExpiry: number = 0;

const config: ZoomConfig = {
  accountId: process.env.ZOOM_ACCOUNT_ID || '',
  clientId: process.env.ZOOM_CLIENT_ID || '',
  clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
};

export function isZoomConfigured(): boolean {
  return !!(config.accountId && config.clientId && config.clientSecret);
}

/**
 * Get OAuth access token using Server-to-Server OAuth
 */
async function getAccessToken(): Promise<string | null> {
  if (!isZoomConfigured()) {
    console.warn('Zoom not configured');
    return null;
  }

  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry - 60000) {
    return accessToken;
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: config.accountId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Zoom OAuth error:', error);
      return null;
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;

    return accessToken;
  } catch (error) {
    console.error('Failed to get Zoom access token:', error);
    return null;
  }
}

/**
 * Create a Zoom meeting for a tutoring session
 */
export async function createZoomMeeting(params: CreateMeetingParams): Promise<ZoomMeeting | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const meetingData = {
    topic: params.topic,
    type: 2, // Scheduled meeting
    start_time: params.startTime.toISOString(),
    duration: params.durationMinutes,
    timezone: 'UTC',
    agenda: params.agenda || 'MathPivot Tutoring Session',
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: false,
      waiting_room: true,
      auto_recording: 'none',
      meeting_authentication: false,
    },
  };

  try {
    // Use 'me' as user ID to create meeting under the account
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Zoom create meeting error:', error);
      return null;
    }

    const meeting = await response.json();
    return meeting as ZoomMeeting;
  } catch (error) {
    console.error('Failed to create Zoom meeting:', error);
    return null;
  }
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(meetingId: string | number): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok || response.status === 204;
  } catch (error) {
    console.error('Failed to delete Zoom meeting:', error);
    return false;
  }
}

/**
 * Get meeting details
 */
export async function getZoomMeeting(meetingId: string | number): Promise<ZoomMeeting | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    return (await response.json()) as ZoomMeeting;
  } catch (error) {
    console.error('Failed to get Zoom meeting:', error);
    return null;
  }
}

/**
 * Update meeting time
 */
export async function updateZoomMeeting(
  meetingId: string | number,
  updates: { start_time?: string; duration?: number; topic?: string }
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    return response.ok || response.status === 204;
  } catch (error) {
    console.error('Failed to update Zoom meeting:', error);
    return false;
  }
}

/**
 * Create meeting for a booking
 */
export async function createMeetingForBooking(booking: {
  id: string;
  student_name: string;
  tutor_name: string;
  start_at: string;
  end_at: string;
}): Promise<{ join_url: string; start_url: string; meeting_id: string } | null> {
  if (!isZoomConfigured()) {
    // Return placeholder for development
    console.warn('Zoom not configured - returning placeholder URL');
    return {
      join_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mathpivot.com'}/session/${booking.id}/join`,
      start_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mathpivot.com'}/session/${booking.id}/start`,
      meeting_id: `dev-${booking.id}`,
    };
  }

  const startTime = new Date(booking.start_at);
  const endTime = new Date(booking.end_at);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const meeting = await createZoomMeeting({
    topic: `Math Tutoring: ${booking.student_name} with ${booking.tutor_name}`,
    startTime,
    durationMinutes,
    agenda: `MathPivot tutoring session\nStudent: ${booking.student_name}\nTutor: ${booking.tutor_name}`,
  });

  if (!meeting) return null;

  return {
    join_url: meeting.join_url,
    start_url: meeting.start_url,
    meeting_id: meeting.id.toString(),
  };
}
