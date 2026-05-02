"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function sendWeeklyParentDigests() {
  const supabase = createAdminClient();

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, coach_id, program_id, parent_id")
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) return { sent: 0 };

  const parentStudentMap = new Map<
    string,
    {
      studentId: string;
      coachId: string;
      programId: string;
      enrollmentId: string;
    }[]
  >();

  enrollments.forEach((e) => {
    if (!e.parent_id) return;
    const existing = parentStudentMap.get(e.parent_id) || [];
    existing.push({
      studentId: e.student_id,
      coachId: e.coach_id,
      programId: e.program_id,
      enrollmentId: e.id,
    });
    parentStudentMap.set(e.parent_id, existing);
  });

  const allUserIds = [
    ...new Set([
      ...enrollments.map((e) => e.student_id),
      ...enrollments.map((e) => e.coach_id),
      ...enrollments.filter((e) => e.parent_id).map((e) => e.parent_id!),
    ]),
  ];

  const { data: profiles } = await supabase
    .from("users_profile")
    .select("id, full_name, email")
    .in("id", allUserIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const programIds = [...new Set(enrollments.map((e) => e.program_id))];
  const { data: programs } = await supabase
    .from("coaching_programs")
    .select("id, name, track_level")
    .in("id", programIds);

  const programMap = new Map((programs || []).map((p) => [p.id, p]));

  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  let sentCount = 0;

  for (const [parentId, students] of parentStudentMap) {
    const parent = profileMap.get(parentId);
    if (!parent?.email) continue;

    let digestHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Weekly Progress Report</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">MathPivot Coaching</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <p style="color: #475569; font-size: 14px;">Hi ${parent.full_name?.split(" ")[0] || "there"},</p>
          <p style="color: #475569; font-size: 14px;">Here's what your child accomplished this week:</p>
    `;

    for (const student of students) {
      const studentProfile = profileMap.get(student.studentId);
      const coachProfile = profileMap.get(student.coachId);
      const program = programMap.get(student.programId);

      const { data: recentMastery } = await supabase
        .from("student_concept_mastery")
        .select("mastery_level, assessed_at, concept_id")
        .eq("student_id", student.studentId)
        .gte("assessed_at", oneWeekAgo);

      const { data: totalMastery } = await supabase
        .from("student_concept_mastery")
        .select("mastery_level")
        .eq("student_id", student.studentId);

      const conceptIds = (recentMastery || []).map((m) => m.concept_id);
      const { data: concepts } =
        conceptIds.length > 0
          ? await supabase
              .from("atomic_concepts")
              .select("id, title")
              .in("id", conceptIds)
          : { data: [] };

      const conceptMap = new Map((concepts || []).map((c) => [c.id, c.title]));

      const weekMastered = (recentMastery || []).filter(
        (m) =>
          m.mastery_level === "mastered" || m.mastery_level === "proficient",
      ).length;
      const weekTotal = (recentMastery || []).length;
      const overallMastered = (totalMastery || []).filter(
        (m) =>
          m.mastery_level === "mastered" || m.mastery_level === "proficient",
      ).length;
      const overallTotal = (totalMastery || []).length;
      const overallPct =
        overallTotal > 0
          ? Math.round((overallMastered / overallTotal) * 100)
          : 0;

      const trackColor =
        program?.track_level === "foundation"
          ? "#2563eb"
          : program?.track_level === "acceleration"
            ? "#d97706"
            : "#7c3aed";

      digestHtml += `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <h3 style="margin: 0; color: #0f172a; font-size: 16px;">${studentProfile?.full_name || "Student"}</h3>
              <span style="display: inline-block; background: ${trackColor}20; color: ${trackColor}; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-top: 4px;">${program?.name || "Program"}</span>
              <span style="color: #94a3b8; font-size: 12px; margin-left: 8px;">Coach: ${coachProfile?.full_name || "Coach"}</span>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a;">${overallPct}%</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">overall mastery</p>
            </div>
          </div>
      `;

      if (weekTotal > 0) {
        digestHtml += `
          <p style="color: #475569; font-size: 13px; margin: 8px 0 4px;">
            <strong>${weekMastered} concept${weekMastered !== 1 ? "s" : ""} mastered</strong> this week (${weekTotal} worked on):
          </p>
          <ul style="margin: 4px 0; padding-left: 20px;">
        `;
        (recentMastery || []).slice(0, 5).forEach((m) => {
          const levelEmoji =
            m.mastery_level === "mastered"
              ? "&#9989;"
              : m.mastery_level === "proficient"
                ? "&#128994;"
                : m.mastery_level === "developing"
                  ? "&#128992;"
                  : "&#128309;";
          digestHtml += `<li style="color: #475569; font-size: 13px; margin: 2px 0;">${levelEmoji} ${conceptMap.get(m.concept_id) || "Concept"} — ${m.mastery_level}</li>`;
        });
        if ((recentMastery || []).length > 5) {
          digestHtml += `<li style="color: #94a3b8; font-size: 12px;">...and ${(recentMastery || []).length - 5} more</li>`;
        }
        digestHtml += `</ul>`;
      } else {
        digestHtml += `
          <p style="color: #ef4444; font-size: 13px; margin: 8px 0;">
            No concepts were worked on this week. Please check in with the coach.
          </p>
        `;
      }

      digestHtml += `</div>`;
    }

    digestHtml += `
          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">View Full Dashboard</a>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">MathPivot Coaching — Selling mastery, not hours.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: parent.email,
      subject: `Weekly Progress: ${students.map((s) => profileMap.get(s.studentId)?.full_name || "Student").join(", ")}`,
      html: digestHtml,
    });

    sentCount++;
  }

  return { sent: sentCount };
}
