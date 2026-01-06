/**
 * Twilio SMS Integration for MathPivot TutorOS
 * Sends SMS notifications for session reminders and alerts
 */
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export function isTwilioConfigured(): boolean {
  return !!(client && fromNumber);
}

export interface SendSMSParams {
  to: string;
  body: string;
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If it starts with 1 and is 11 digits, it's US/Canada
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If it's 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Otherwise, assume it already has country code
  return `+${digits}`;
}

/**
 * Send an SMS message
 */
export async function sendSMS(params: SendSMSParams): Promise<SendSMSResult> {
  const { to, body } = params;

  if (!isTwilioConfigured()) {
    console.log('=== SMS (DEV MODE) ===');
    console.log('To:', to);
    console.log('Body:', body);
    console.log('======================');
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  try {
    const message = await client!.messages.create({
      body,
      from: fromNumber,
      to: formatPhoneNumber(to),
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Twilio SMS error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  messages: SendSMSParams[]
): Promise<SendSMSResult[]> {
  return Promise.all(messages.map(sendSMS));
}

// SMS Templates
export const smsTemplates = {
  /**
   * Session reminder (24 hours before)
   */
  sessionReminder24h: ({
    studentName,
    tutorName,
    dateTime,
  }: {
    studentName: string;
    tutorName: string;
    dateTime: string;
  }) =>
    `MathPivot Reminder: ${studentName}'s tutoring session with ${tutorName} is tomorrow at ${dateTime}. Reply HELP for assistance.`,

  /**
   * Session reminder (2 hours before)
   */
  sessionReminder2h: ({
    studentName,
    tutorName,
    time,
    videoLink,
  }: {
    studentName: string;
    tutorName: string;
    time: string;
    videoLink?: string;
  }) =>
    `MathPivot: ${studentName}'s session with ${tutorName} starts in 2 hours at ${time}.${videoLink ? ` Join: ${videoLink}` : ''} Reply HELP for assistance.`,

  /**
   * Session starting now
   */
  sessionStarting: ({
    studentName,
    videoLink,
  }: {
    studentName: string;
    videoLink?: string;
  }) =>
    `MathPivot: ${studentName}'s tutoring session is starting now!${videoLink ? ` Join: ${videoLink}` : ''} Reply HELP for assistance.`,

  /**
   * Session cancellation
   */
  sessionCanceled: ({
    studentName,
    tutorName,
    dateTime,
    reason,
  }: {
    studentName: string;
    tutorName: string;
    dateTime: string;
    reason?: string;
  }) =>
    `MathPivot: ${studentName}'s session with ${tutorName} on ${dateTime} has been canceled.${reason ? ` Reason: ${reason}` : ''} Reply HELP for assistance.`,

  /**
   * Session rescheduled
   */
  sessionRescheduled: ({
    studentName,
    oldDateTime,
    newDateTime,
  }: {
    studentName: string;
    oldDateTime: string;
    newDateTime: string;
  }) =>
    `MathPivot: ${studentName}'s session has been rescheduled from ${oldDateTime} to ${newDateTime}. Reply HELP for assistance.`,

  /**
   * Low credits warning
   */
  lowCredits: ({
    familyName,
    creditsRemaining,
  }: {
    familyName: string;
    creditsRemaining: number;
  }) =>
    `MathPivot: Hi ${familyName}! You have ${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining. Purchase more at mathpivot.com/parent/purchase. Reply HELP for assistance.`,

  /**
   * Purchase confirmation
   */
  purchaseConfirmation: ({
    credits,
    amount,
  }: {
    credits: number;
    amount: string;
  }) =>
    `MathPivot: Thank you! ${credits} credits (${amount}) have been added to your account. Book sessions at mathpivot.com. Reply HELP for assistance.`,

  /**
   * At-risk student alert (to admin)
   */
  atRiskAlert: ({
    studentName,
    reason,
  }: {
    studentName: string;
    reason: string;
  }) => `MathPivot Alert: ${studentName} flagged at-risk. Reason: ${reason}. Review in admin dashboard.`,
};

/**
 * Send session reminder SMS
 */
export async function sendSessionReminderSMS(
  phone: string,
  params: {
    studentName: string;
    tutorName: string;
    dateTime: string;
    hoursUntil: number;
    videoLink?: string;
  }
): Promise<SendSMSResult> {
  let body: string;

  if (params.hoursUntil <= 2) {
    body = smsTemplates.sessionReminder2h({
      studentName: params.studentName,
      tutorName: params.tutorName,
      time: params.dateTime,
      videoLink: params.videoLink,
    });
  } else {
    body = smsTemplates.sessionReminder24h({
      studentName: params.studentName,
      tutorName: params.tutorName,
      dateTime: params.dateTime,
    });
  }

  return sendSMS({ to: phone, body });
}

/**
 * Send session cancellation SMS
 */
export async function sendSessionCanceledSMS(
  phone: string,
  params: {
    studentName: string;
    tutorName: string;
    dateTime: string;
    reason?: string;
  }
): Promise<SendSMSResult> {
  return sendSMS({
    to: phone,
    body: smsTemplates.sessionCanceled(params),
  });
}
