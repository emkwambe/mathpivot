"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function sendMasteryLevelUpNotification(
  studentId: string,
  conceptTitle: string,
  newLevel: string,
) {
  if (newLevel !== "mastered" && newLevel !== "proficient") return;

  const supabase = createAdminClient();

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("parent_id, program_id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (!enrollment?.parent_id) return;

  const [{ data: parent }, { data: student }, { data: program }] =
    await Promise.all([
      supabase
        .from("users_profile")
        .select("full_name, email")
        .eq("id", enrollment.parent_id)
        .single(),
      supabase
        .from("users_profile")
        .select("full_name")
        .eq("id", studentId)
        .single(),
      supabase
        .from("coaching_programs")
        .select("name")
        .eq("id", enrollment.program_id)
        .single(),
    ]);

  if (!parent?.email) return;

  const { count: totalMastered } = await supabase
    .from("student_concept_mastery")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .in("mastery_level", ["mastered", "proficient"]);

  const levelEmoji = newLevel === "mastered" ? "&#11088;" : "&#9989;";
  const studentFirst = student?.full_name?.split(" ")[0] || "Your child";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="font-size: 36px; margin: 0;">${levelEmoji}</p>
        <h1 style="color: white; margin: 8px 0 0; font-size: 18px;">Concept ${newLevel === "mastered" ? "Mastered" : "Proficient"}!</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="color: #475569; font-size: 14px; margin: 0 0 12px;">
          ${studentFirst} just reached <strong>${newLevel}</strong> level in:
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; margin: 0 0 16px;">
          <p style="font-size: 16px; font-weight: 600; color: #166534; margin: 0;">${conceptTitle}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          ${totalMastered || 0} concepts mastered so far in ${program?.name || "their program"}.
        </p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent" style="display: inline-block; background: #059669; color: white; padding: 8px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500;">View Progress</a>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to: parent.email,
    subject: `${studentFirst} just ${newLevel === "mastered" ? "mastered" : "reached proficient in"} "${conceptTitle}"`,
    html,
  });
}
