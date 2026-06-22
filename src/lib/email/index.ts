/**
 * Email service for MathPivot
 * Uses Resend if configured, falls back to console logging in dev
 */
import { Resend } from "resend";
import { isDev } from "@/lib/utils";

// Initialize Resend if API key is available
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default from address
const FROM_EMAIL =
  process.env.EMAIL_FROM || "MathPivot <noreply@mathpivot.com>";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend, or log to console in dev/without API key
 */
export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const { to, subject, html, text, replyTo, bcc } = params;

  // If Resend is not configured, log to console
  if (!resend) {
    if (isDev()) {
      console.log("=== EMAIL (DEV MODE) ===");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("HTML:", html.substring(0, 500) + "...");
      console.log("========================");
    } else {
      console.warn("Email not sent (Resend not configured):", subject);
    }
    return { success: true, id: `dev-${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || htmlToText(html),
      replyTo: replyTo,
      ...(bcc ? { bcc: Array.isArray(bcc) ? bcc : [bcc] } : {}),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Email send error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Simple HTML to text converter
 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(resend);
}

// Email templates
export const emailTemplates = {
  /**
   * Booking confirmation email
   */
  bookingConfirmation: ({
    studentName,
    tutorName,
    dateTime,
    modality,
  }: {
    studentName: string;
    tutorName: string;
    dateTime: string;
    modality: string;
  }) => ({
    subject: `Booking Confirmed: ${studentName} with ${tutorName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmed!</h2>
        <p>Your coaching session has been confirmed.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Tutor:</strong> ${tutorName}</p>
          <p><strong>Date & Time:</strong> ${dateTime}</p>
          <p><strong>Format:</strong> ${modality === "online" ? "Online" : "In Person"}</p>
        </div>
        <p>You'll receive a reminder 24 hours and 2 hours before the session.</p>
        <p>Best,<br>MathPivot Team</p>
      </div>
    `,
  }),

  /**
   * Booking reminder email
   */
  bookingReminder: ({
    studentName,
    tutorName,
    dateTime,
    hoursUntil,
  }: {
    studentName: string;
    tutorName: string;
    dateTime: string;
    hoursUntil: number;
  }) => ({
    subject: `Reminder: Session in ${hoursUntil} hours`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Session Reminder</h2>
        <p>Your coaching session is coming up in ${hoursUntil} hours!</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Tutor:</strong> ${tutorName}</p>
          <p><strong>Date & Time:</strong> ${dateTime}</p>
        </div>
        <p>Best,<br>MathPivot Team</p>
      </div>
    `,
  }),

  /**
   * Session summary email
   */
  sessionSummary: ({
    studentName,
    tutorName,
    date,
    summary,
    nextSteps,
    skillsWorkedOn,
  }: {
    studentName: string;
    tutorName: string;
    date: string;
    summary: string;
    nextSteps?: string;
    skillsWorkedOn?: string[];
  }) => ({
    subject: `Session Summary: ${studentName} - ${date}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Session Summary</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Tutor:</strong> ${tutorName}</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>
        <h3>What We Covered</h3>
        <p>${summary}</p>
        ${
          skillsWorkedOn && skillsWorkedOn.length > 0
            ? `
          <h3>Skills Worked On</h3>
          <ul>${skillsWorkedOn.map((s) => `<li>${s}</li>`).join("")}</ul>
        `
            : ""
        }
        ${
          nextSteps
            ? `
          <h3>Next Steps</h3>
          <p>${nextSteps}</p>
        `
            : ""
        }
        <p>Best,<br>MathPivot Team</p>
      </div>
    `,
  }),

  /**
   * Weekly progress report email
   */
  weeklyReport: ({
    studentName,
    weekStart,
    weekEnd,
    sessionsCount,
    attendanceRate,
    skillsSummary,
    masteryUpdates,
    recommendations,
    isAtRisk,
    atRiskReasons,
  }: {
    studentName: string;
    weekStart: string;
    weekEnd: string;
    sessionsCount: number;
    attendanceRate: number;
    skillsSummary: string[];
    masteryUpdates: { skill: string; from: string; to: string }[];
    recommendations?: string;
    isAtRisk: boolean;
    atRiskReasons?: string[];
  }) => ({
    subject: `Weekly Progress Report: ${studentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Weekly Progress Report</h2>
        <p><strong>${studentName}</strong> | ${weekStart} - ${weekEnd}</p>

        ${
          isAtRisk
            ? `
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <strong style="color: #dc2626;">⚠️ Attention Needed</strong>
            <ul>${atRiskReasons?.map((r) => `<li>${r}</li>`).join("") || ""}</ul>
          </div>
        `
            : ""
        }

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Overview</h3>
          <p><strong>Sessions:</strong> ${sessionsCount}</p>
          <p><strong>Attendance:</strong> ${Math.round(attendanceRate * 100)}%</p>
        </div>

        ${
          skillsSummary.length > 0
            ? `
          <h3>Skills Practiced</h3>
          <ul>${skillsSummary.map((s) => `<li>${s}</li>`).join("")}</ul>
        `
            : ""
        }

        ${
          masteryUpdates.length > 0
            ? `
          <h3>Mastery Progress</h3>
          <ul>${masteryUpdates.map((m) => `<li><strong>${m.skill}:</strong> ${m.from} → ${m.to}</li>`).join("")}</ul>
        `
            : ""
        }

        ${
          recommendations
            ? `
          <h3>Recommendations</h3>
          <p>${recommendations}</p>
        `
            : ""
        }

        <p>Best,<br>MathPivot Team</p>
      </div>
    `,
  }),

  /**
   * At-risk alert email (to admin/parent)
   */
  atRiskAlert: ({
    studentName,
    reasons,
    recommendations,
  }: {
    studentName: string;
    reasons: string[];
    recommendations: string;
  }) => ({
    subject: `⚠️ At-Risk Alert: ${studentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ At-Risk Alert</h2>
        <p><strong>${studentName}</strong> has been flagged for attention.</p>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">Reasons</h3>
          <ul>${reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
        </div>

        <h3>Recommended Actions</h3>
        <p>${recommendations}</p>

        <p>Best,<br>MathPivot Team</p>
      </div>
    `,
  }),

  /**
   * Diagnostic results email (sent to parent after public diagnostic)
   */
  diagnosticResults: ({
    parentName,
    studentName,
    overallScore,
    domainScores,
    recommendedProgram,
    programDescription,
    strongestDomain,
    weakestDomain,
  }: {
    parentName: string;
    studentName: string;
    overallScore: number;
    domainScores: {
      domain: string;
      correct: number;
      total: number;
      percentage: number;
    }[];
    recommendedProgram: string;
    programDescription: string;
    strongestDomain: string;
    weakestDomain: string;
  }) => ({
    subject: `${studentName}'s MathPivot Diagnostic Results`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <div style="text-align: center; padding: 30px 0 20px;">
          <div style="display: inline-block; background: #1D4ED8; color: white; font-weight: bold; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; font-size: 18px;">M</div>
          <p style="font-weight: bold; font-size: 18px; margin: 8px 0 0; color: #1e293b;">MathPivot</p>
        </div>

        <h2 style="color: #1e293b; text-align: center;">Diagnostic Results for ${studentName}</h2>
        <p style="text-align: center; color: #64748b;">Hi ${parentName}, here are your child's assessment results.</p>

        <div style="background: #1D4ED8; color: white; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="font-size: 36px; font-weight: bold; margin: 0;">${overallScore}%</p>
          <p style="margin: 4px 0 0; opacity: 0.9;">Overall Score</p>
        </div>

        <div style="display: flex; gap: 12px; margin: 20px 0;">
          <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="font-size: 12px; color: #16a34a; margin: 0;">Strongest</p>
            <p style="font-weight: bold; color: #15803d; margin: 6px 0 0;">${strongestDomain.replace(/_/g, " ")}</p>
          </div>
          <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="font-size: 12px; color: #d97706; margin: 0;">Focus Area</p>
            <p style="font-weight: bold; color: #b45309; margin: 6px 0 0;">${weakestDomain.replace(/_/g, " ")}</p>
          </div>
        </div>

        <h3 style="color: #1e293b; margin-top: 28px;">Domain Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
          ${domainScores
            .map(
              (d) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; font-size: 14px;">${d.domain.replace(/_/g, " ")}</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: ${d.percentage >= 60 ? "#16a34a" : "#d97706"};">${d.correct}/${d.total} (${d.percentage}%)</td>
            </tr>
          `,
            )
            .join("")}
        </table>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1D4ED8; margin: 0;">Recommended Program</p>
          <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 8px 0 4px;">${recommendedProgram}</p>
          <p style="font-size: 14px; color: #64748b; margin: 0;">${programDescription}</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://mathpivot.com/summer" style="display: inline-block; background: #F97316; color: white; font-weight: bold; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 16px;">Explore Summer Clinics</a>
        </div>
        <div style="text-align: center; margin: 0 0 32px;">
          <a href="https://mathpivot.com/pricing" style="display: inline-block; border: 1px solid #e2e8f0; color: #334155; font-weight: 600; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-size: 14px;">View Year-Round Programs</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          MathPivot — The Travel Ball of Math<br>
          <a href="https://mathpivot.com" style="color: #1D4ED8;">mathpivot.com</a>
        </p>
      </div>
    `,
  }),

  /**
   * Purchase confirmation email
   */
  purchaseConfirmation: ({
    productName,
    credits,
    amountPaid,
  }: {
    productName: string;
    credits: number;
    amountPaid: string;
  }) => ({
    subject: `Purchase Confirmed: ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Purchase Confirmed!</h2>
        <p>Thank you for your purchase.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Credits:</strong> ${credits}</p>
          <p><strong>Amount:</strong> ${amountPaid}</p>
        </div>
        <p>Your credits have been added to your account.</p>
        <p>Best,<br>MathPivot Team</p>
      </div>
    `,
  }),
};
