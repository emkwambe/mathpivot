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
    subject: `${studentName}'s Diagnostic Results — MathPivot`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; background: #ffffff;">

        <!-- Header -->
        <div style="background: #1D4ED8; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <div style="display: inline-block; background: white; color: #1D4ED8; font-weight: bold; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; font-size: 20px;">M</div>
          <p style="color: white; font-weight: bold; font-size: 20px; margin: 10px 0 0;">MathPivot</p>
          <p style="color: #93c5fd; font-size: 12px; margin: 4px 0 0; letter-spacing: 0.5px;">Mathematics Coaching Academy</p>
        </div>

        <!-- Greeting -->
        <div style="padding: 32px 24px 0;">
          <p style="font-size: 16px; color: #1e293b; margin: 0;">Dear ${parentName},</p>
          <p style="font-size: 15px; color: #475569; margin: 12px 0 0; line-height: 1.6;">
            Thank you for completing the MathPivot diagnostic assessment with ${studentName}. This report summarizes where ${studentName} stands across key math domains and our recommendation for the best next step.
          </p>
        </div>

        <!-- Overall Score -->
        <div style="margin: 28px 24px; background: linear-gradient(135deg, #1D4ED8, #1e40af); border-radius: 12px; padding: 28px; text-align: center;">
          <p style="font-size: 42px; font-weight: bold; margin: 0; color: white;">${overallScore}%</p>
          <p style="margin: 6px 0 0; color: #bfdbfe; font-size: 14px;">Overall Score</p>
        </div>

        <!-- Strengths & Focus -->
        <div style="padding: 0 24px;">
          <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0;">
            <tr>
              <td style="width: 50%; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center; vertical-align: top;">
                <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin: 0;">Strongest Area</p>
                <p style="font-weight: bold; color: #15803d; margin: 8px 0 0; font-size: 15px; text-transform: capitalize;">${strongestDomain.replace(/_/g, " ")}</p>
              </td>
              <td style="width: 50%; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; text-align: center; vertical-align: top;">
                <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #d97706; margin: 0;">Focus Area</p>
                <p style="font-weight: bold; color: #b45309; margin: 8px 0 0; font-size: 15px; text-transform: capitalize;">${weakestDomain.replace(/_/g, " ")}</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Domain Breakdown -->
        <div style="padding: 28px 24px 0;">
          <p style="font-size: 16px; font-weight: bold; color: #1e293b; margin: 0 0 16px;">Domain Breakdown</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${domainScores
              .map(
                (d) => `
              <tr>
                <td style="padding: 12px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; text-transform: capitalize;">${d.domain.replace(/_/g, " ")}</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: ${d.percentage >= 60 ? "#16a34a" : d.percentage >= 40 ? "#d97706" : "#dc2626"};">${d.correct}/${d.total} (${d.percentage}%)</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </div>

        <!-- Recommendation -->
        <div style="margin: 28px 24px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px;">
          <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #1D4ED8; margin: 0;">Our Recommendation</p>
          <p style="font-size: 20px; font-weight: bold; color: #1e293b; margin: 10px 0 6px;">${recommendedProgram}</p>
          <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.5;">${programDescription}</p>
        </div>

        <!-- What Happens Next -->
        <div style="padding: 0 24px;">
          <p style="font-size: 16px; font-weight: bold; color: #1e293b; margin: 0 0 12px;">What happens next?</p>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #475569; vertical-align: top; width: 24px; font-weight: bold; color: #1D4ED8;">1.</td>
              <td style="padding: 6px 0; font-size: 14px; color: #475569;">We review ${studentName}'s results and identify the best coaching pathway.</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #475569; vertical-align: top; width: 24px; font-weight: bold; color: #1D4ED8;">2.</td>
              <td style="padding: 6px 0; font-size: 14px; color: #475569;">A MathPivot team member will follow up within 48 hours to discuss options.</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #475569; vertical-align: top; width: 24px; font-weight: bold; color: #1D4ED8;">3.</td>
              <td style="padding: 6px 0; font-size: 14px; color: #475569;">If you're ready now, explore our summer clinics or year-round programs below.</td>
            </tr>
          </table>
        </div>

        <!-- CTAs -->
        <div style="padding: 28px 24px; text-align: center;">
          <a href="https://mathpivot.com/summer" style="display: inline-block; background: #F97316; color: white; font-weight: bold; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-size: 15px;">Explore Summer Clinics</a>
          <br />
          <a href="https://mathpivot.com/pricing" style="display: inline-block; margin-top: 12px; border: 2px solid #e2e8f0; color: #334155; font-weight: 600; padding: 12px 36px; border-radius: 10px; text-decoration: none; font-size: 14px;">View Year-Round Programs</a>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="font-size: 13px; color: #64748b; margin: 0;">
            Questions? Reply to this email or visit <a href="https://mathpivot.com" style="color: #1D4ED8; text-decoration: none;">mathpivot.com</a>
          </p>
          <p style="font-size: 11px; color: #94a3b8; margin: 12px 0 0;">
            MathPivot Mathematics Coaching Academy<br>
            Build Confidence. Master Mathematics. Expand Opportunities.
          </p>
        </div>
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
