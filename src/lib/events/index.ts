/**
 * Event system for MathPivot TutorOS
 * All important actions emit events to the events table
 */
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase/admin';
import type { EventType } from '@/types';

interface EmitEventParams {
  type: EventType;
  actorUserId: string | null;
  subjectType: string;
  subjectId: string;
  data?: Record<string, unknown>;
}

/**
 * Emit an event to the events table
 * Uses admin client to bypass RLS
 */
export async function emitEvent({
  type,
  actorUserId,
  subjectType,
  subjectId,
  data = {},
}: EmitEventParams): Promise<{ id: string } | null> {
  if (!isAdminConfigured()) {
    console.warn(`[Event] Would emit: ${type}`, { subjectType, subjectId, data });
    return { id: uuidv4() };
  }

  const eventId = uuidv4();
  const occurredAt = new Date().toISOString();

  const { error } = await supabaseAdmin.from('events').insert({
    id: eventId,
    type,
    actor_user_id: actorUserId,
    subject_type: subjectType,
    subject_id: subjectId,
    data,
    occurred_at: occurredAt,
  });

  if (error) {
    console.error(`[Event] Failed to emit ${type}:`, error);
    // Try to emit a system error event
    try {
      await supabaseAdmin.from('events').insert({
        id: uuidv4(),
        type: 'system.job_failed.v1',
        actor_user_id: null,
        subject_type: 'event',
        subject_id: eventId,
        data: {
          originalEvent: type,
          error: error.message,
        },
        occurred_at: new Date().toISOString(),
      });
    } catch {
      // Ignore
    }
    return null;
  }

  return { id: eventId };
}

// Convenience functions for common event types

export async function emitBookingCreated(
  actorUserId: string,
  bookingId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'booking.created.v1',
    actorUserId,
    subjectType: 'booking',
    subjectId: bookingId,
    data,
  });
}

export async function emitBookingConfirmed(
  actorUserId: string,
  bookingId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'booking.confirmed.v1',
    actorUserId,
    subjectType: 'booking',
    subjectId: bookingId,
    data,
  });
}

export async function emitBookingRescheduled(
  actorUserId: string,
  bookingId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'booking.rescheduled.v1',
    actorUserId,
    subjectType: 'booking',
    subjectId: bookingId,
    data,
  });
}

export async function emitBookingCanceled(
  actorUserId: string,
  bookingId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'booking.canceled.v1',
    actorUserId,
    subjectType: 'booking',
    subjectId: bookingId,
    data,
  });
}

export async function emitBookingReminderScheduled(
  bookingId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'booking.reminder_scheduled.v1',
    actorUserId: null,
    subjectType: 'booking',
    subjectId: bookingId,
    data,
  });
}

export async function emitBookingReminderSent(bookingId: string, data: Record<string, unknown>) {
  return emitEvent({
    type: 'booking.reminder_sent.v1',
    actorUserId: null,
    subjectType: 'booking',
    subjectId: bookingId,
    data,
  });
}

export async function emitBookingNoShowMarked(
  actorUserId: string,
  bookingId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'booking.no_show_marked.v1',
    actorUserId,
    subjectType: 'booking',
    subjectId: bookingId,
    data,
  });
}

export async function emitSessionStarted(
  actorUserId: string,
  sessionId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'session.started.v1',
    actorUserId,
    subjectType: 'session',
    subjectId: sessionId,
    data,
  });
}

export async function emitSessionCompleted(
  actorUserId: string,
  sessionId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'session.completed.v1',
    actorUserId,
    subjectType: 'session',
    subjectId: sessionId,
    data,
  });
}

export async function emitSessionNotesSaved(
  actorUserId: string,
  sessionId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'session.notes_saved.v1',
    actorUserId,
    subjectType: 'session',
    subjectId: sessionId,
    data,
  });
}

export async function emitSessionSummaryPublished(
  actorUserId: string,
  sessionId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'session.summary_published.v1',
    actorUserId,
    subjectType: 'session',
    subjectId: sessionId,
    data,
  });
}

export async function emitHomeworkAssigned(
  actorUserId: string,
  homeworkId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'session.homework_assigned.v1',
    actorUserId,
    subjectType: 'homework',
    subjectId: homeworkId,
    data,
  });
}

export async function emitHomeworkSubmitted(
  actorUserId: string,
  homeworkId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'session.homework_submitted.v1',
    actorUserId,
    subjectType: 'homework',
    subjectId: homeworkId,
    data,
  });
}

export async function emitHomeworkReviewed(
  actorUserId: string,
  homeworkId: string,
  data: Record<string, unknown> = {}
) {
  return emitEvent({
    type: 'session.homework_reviewed.v1',
    actorUserId,
    subjectType: 'homework',
    subjectId: homeworkId,
    data,
  });
}

export async function emitMasterySkillTagged(
  actorUserId: string,
  sessionSkillId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'mastery.skill_tagged_in_session.v1',
    actorUserId,
    subjectType: 'session_skill',
    subjectId: sessionSkillId,
    data,
  });
}

export async function emitMasteryLevelUpdated(
  actorUserId: string,
  masteryId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'mastery.level_updated.v1',
    actorUserId,
    subjectType: 'student_skill_mastery',
    subjectId: masteryId,
    data,
  });
}

export async function emitDiagnosticCompleted(
  actorUserId: string,
  diagnosticId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'diagnostic.completed.v1',
    actorUserId,
    subjectType: 'diagnostic',
    subjectId: diagnosticId,
    data,
  });
}

export async function emitPaymentPurchaseInitiated(
  actorUserId: string,
  purchaseId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'payment.purchase_initiated.v1',
    actorUserId,
    subjectType: 'purchase',
    subjectId: purchaseId,
    data,
  });
}

export async function emitPaymentSucceeded(purchaseId: string, data: Record<string, unknown>) {
  return emitEvent({
    type: 'payment.succeeded.v1',
    actorUserId: null,
    subjectType: 'purchase',
    subjectId: purchaseId,
    data,
  });
}

export async function emitPaymentFailed(purchaseId: string, data: Record<string, unknown>) {
  return emitEvent({
    type: 'payment.failed.v1',
    actorUserId: null,
    subjectType: 'purchase',
    subjectId: purchaseId,
    data,
  });
}

export async function emitPaymentRefunded(
  actorUserId: string,
  purchaseId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'payment.refunded.v1',
    actorUserId,
    subjectType: 'purchase',
    subjectId: purchaseId,
    data,
  });
}

export async function emitCreditsAdded(ledgerEntryId: string, data: Record<string, unknown>) {
  return emitEvent({
    type: 'credits.added.v1',
    actorUserId: null,
    subjectType: 'credit_ledger',
    subjectId: ledgerEntryId,
    data,
  });
}

export async function emitCreditsDebited(
  actorUserId: string | null,
  ledgerEntryId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'credits.debited.v1',
    actorUserId,
    subjectType: 'credit_ledger',
    subjectId: ledgerEntryId,
    data,
  });
}

export async function emitSessionSummarySent(
  notificationId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'comm.session_summary_sent.v1',
    actorUserId: null,
    subjectType: 'notification',
    subjectId: notificationId,
    data,
  });
}

export async function emitWeeklyReportGenerated(
  reportId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'comm.weekly_report_generated.v1',
    actorUserId: null,
    subjectType: 'weekly_report',
    subjectId: reportId,
    data,
  });
}

export async function emitWeeklyReportSent(reportId: string, data: Record<string, unknown>) {
  return emitEvent({
    type: 'comm.weekly_report_sent.v1',
    actorUserId: null,
    subjectType: 'weekly_report',
    subjectId: reportId,
    data,
  });
}

export async function emitAtRiskAlertGenerated(
  studentUserId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'comm.at_risk_alert_generated.v1',
    actorUserId: null,
    subjectType: 'student',
    subjectId: studentUserId,
    data,
  });
}

export async function emitAtRiskAlertSent(
  notificationId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'comm.at_risk_alert_sent.v1',
    actorUserId: null,
    subjectType: 'notification',
    subjectId: notificationId,
    data,
  });
}

export async function emitSystemJobFailed(jobType: string, data: Record<string, unknown>) {
  return emitEvent({
    type: 'system.job_failed.v1',
    actorUserId: null,
    subjectType: 'job',
    subjectId: jobType,
    data,
  });
}

export async function emitSystemDeadLettered(
  originalEventId: string,
  data: Record<string, unknown>
) {
  return emitEvent({
    type: 'system.dead_lettered.v1',
    actorUserId: null,
    subjectType: 'event',
    subjectId: originalEventId,
    data,
  });
}
