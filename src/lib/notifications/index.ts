/**
 * Notification service for MathPivot TutorOS
 * Sends notifications based on domain events
 */
import { sendEmail, emailTemplates } from "@/lib/email";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";

interface BookingDetails {
  id: string;
  student_user_id: string;
  tutor_user_id: string;
  parent_user_id: string;
  family_id: string;
  start_at: string;
  end_at: string;
  modality: string;
}

/**
 * Send booking confirmation notification
 */
export async function sendBookingConfirmation(booking: BookingDetails) {
  if (!isAdminConfigured()) {
    console.warn("Admin not configured - skipping notification");
    return;
  }

  // Get related users
  const [studentResult, tutorResult, parentResult] = await Promise.all([
    supabaseAdmin
      .from("users_profile")
      .select("full_name, email")
      .eq("id", booking.student_user_id)
      .single(),
    supabaseAdmin
      .from("users_profile")
      .select("full_name, email")
      .eq("id", booking.tutor_user_id)
      .single(),
    supabaseAdmin
      .from("users_profile")
      .select("full_name, email")
      .eq("id", booking.parent_user_id)
      .single(),
  ]);

  const student = studentResult.data;
  const tutor = tutorResult.data;
  const parent = parentResult.data;

  if (!student || !tutor || !parent) {
    console.error("Missing user data for booking notification");
    return;
  }

  const dateTime = new Date(booking.start_at).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const template = emailTemplates.bookingConfirmation({
    studentName: student.full_name,
    tutorName: tutor.full_name,
    dateTime,
    modality: booking.modality,
  });

  // Send to parent
  await sendEmail({
    to: parent.email,
    subject: template.subject,
    html: template.html,
  });

  // Send to tutor
  await sendEmail({
    to: tutor.email,
    subject: `New Booking: ${student.full_name} on ${dateTime}`,
    html: template.html,
  });

  // Log notification
  await logNotification(parent.email, "booking_confirmation", booking.id);
  await logNotification(tutor.email, "booking_confirmation", booking.id);
}

/**
 * Send booking reminder notification
 */
export async function sendBookingReminder(
  bookingId: string,
  hoursUntil: number,
) {
  if (!isAdminConfigured()) return;

  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      *,
      student:users_profile!student_user_id(full_name, email),
      tutor:users_profile!tutor_user_id(full_name, email),
      parent:users_profile!parent_user_id(full_name, email)
    `,
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return;

  const student = booking.student as { full_name: string; email: string };
  const tutor = booking.tutor as { full_name: string; email: string };
  const parent = booking.parent as { full_name: string; email: string };

  const dateTime = new Date(booking.start_at).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const template = emailTemplates.bookingReminder({
    studentName: student.full_name,
    tutorName: tutor.full_name,
    dateTime,
    hoursUntil,
  });

  // Send to parent and tutor
  await Promise.all([
    sendEmail({ to: parent.email, ...template }),
    sendEmail({ to: tutor.email, ...template }),
  ]);

  await logNotification(parent.email, "booking_reminder", bookingId);
  await logNotification(tutor.email, "booking_reminder", bookingId);
}

/**
 * Send session summary notification to parent
 */
export async function sendSessionSummary(sessionId: string) {
  if (!isAdminConfigured()) return;

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select(
      `
      *,
      booking:bookings(
        *,
        student_user_id,
        student:users_profile!student_user_id(full_name),
        tutor:users_profile!tutor_user_id(full_name),
        parent:users_profile!parent_user_id(email)
      )
    `,
    )
    .eq("id", sessionId)
    .single();

  if (!session?.booking) return;

  const booking = session.booking as {
    student: { full_name: string };
    tutor: { full_name: string };
    parent: { email: string };
    start_at: string;
    student_user_id: string;
  };

  // Fetch mastery updates from this session
  let masteryUpdates: string[] = [];
  if (session.started_at) {
    const { data: updates } = await supabaseAdmin
      .from("student_concept_mastery")
      .select("concept_id, mastery_level")
      .eq("student_id", booking.student_user_id)
      .gte("assessed_at", session.started_at);

    if (updates && updates.length > 0) {
      const conceptIds = updates.map((u) => u.concept_id);
      const { data: concepts } = await supabaseAdmin
        .from("atomic_concepts")
        .select("id, title")
        .in("id", conceptIds);

      const conceptMap = new Map((concepts || []).map((c) => [c.id, c.title]));
      masteryUpdates = updates.map(
        (u) =>
          `${conceptMap.get(u.concept_id) || "Concept"}: ${u.mastery_level}`,
      );
    }
  }

  const date = new Date(booking.start_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const template = emailTemplates.sessionSummary({
    studentName: booking.student.full_name,
    tutorName: booking.tutor.full_name,
    date,
    summary: session.internal_notes || "No summary provided.",
    nextSteps: session.next_steps || undefined,
    skillsWorkedOn: masteryUpdates.length > 0 ? masteryUpdates : undefined,
  });

  await sendEmail({ to: booking.parent.email, ...template });
  await logNotification(booking.parent.email, "session_summary", sessionId);
}

/**
 * Send purchase confirmation
 */
export async function sendPurchaseConfirmation(purchaseId: string) {
  if (!isAdminConfigured()) return;

  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select(
      `
      *,
      product:products(name, credits),
      user:users_profile!user_id(email)
    `,
    )
    .eq("id", purchaseId)
    .single();

  if (!purchase?.product || !purchase?.user) return;

  const product = purchase.product as { name: string; credits: number };
  const user = purchase.user as { email: string };

  const template = emailTemplates.purchaseConfirmation({
    productName: product.name,
    credits: product.credits,
    amountPaid: `$${(purchase.amount_cents / 100).toFixed(2)}`,
  });

  await sendEmail({ to: user.email, ...template });
  await logNotification(user.email, "purchase_confirmation", purchaseId);
}

/**
 * Send weekly progress report
 */
export async function sendWeeklyReport(reportId: string) {
  if (!isAdminConfigured()) return;

  const { data: report } = await supabaseAdmin
    .from("weekly_reports")
    .select(
      `
      *,
      student:users_profile!student_user_id(full_name)
    `,
    )
    .eq("id", reportId)
    .single();

  if (!report) return;

  // Get parent emails for the family
  const { data: parents } = await supabaseAdmin
    .from("family_members")
    .select("user:users_profile!user_id(email)")
    .eq("family_id", report.family_id)
    .eq("role", "parent");

  if (!parents || parents.length === 0) return;

  const student = report.student as { full_name: string };

  const template = emailTemplates.weeklyReport({
    studentName: student.full_name,
    weekStart: new Date(report.week_start).toLocaleDateString(),
    weekEnd: new Date(report.week_end).toLocaleDateString(),
    sessionsCount: report.sessions_count,
    attendanceRate: report.attendance_rate || 1,
    skillsSummary: report.skills_practiced || [],
    masteryUpdates:
      (report.mastery_changes as {
        skill: string;
        from: string;
        to: string;
      }[]) || [],
    recommendations: report.recommendations || undefined,
    isAtRisk: report.is_at_risk,
    atRiskReasons: report.at_risk_reasons || undefined,
  });

  for (const parent of parents) {
    const user = parent.user as unknown as { email: string };
    if (!user?.email) continue;
    await sendEmail({ to: user.email, ...template });
    await logNotification(user.email, "weekly_report", reportId);
  }

  // Mark report as sent
  await supabaseAdmin
    .from("weekly_reports")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", reportId);
}

/**
 * Send at-risk alert to admin
 */
export async function sendAtRiskAlert(
  studentUserId: string,
  reasons: string[],
) {
  if (!isAdminConfigured()) return;

  const { data: student } = await supabaseAdmin
    .from("users_profile")
    .select("full_name")
    .eq("id", studentUserId)
    .single();

  if (!student) return;

  // Get admin emails
  const { data: admins } = await supabaseAdmin
    .from("users_profile")
    .select("email")
    .eq("role", "admin");

  if (!admins || admins.length === 0) return;

  const template = emailTemplates.atRiskAlert({
    studentName: student.full_name,
    reasons,
    recommendations:
      "Please review the student's progress and consider reaching out to the family.",
  });

  for (const admin of admins) {
    await sendEmail({ to: admin.email, ...template });
    await logNotification(admin.email, "at_risk_alert", studentUserId);
  }
}

/**
 * Log notification to database
 */
async function logNotification(
  email: string,
  type: string,
  referenceId: string,
) {
  if (!isAdminConfigured()) return;

  await supabaseAdmin.from("notifications").insert({
    user_id: null, // We're logging by email for simplicity
    channel: "email",
    template_key: type,
    payload_json: { email, reference_id: referenceId },
    status: "sent",
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });
}
