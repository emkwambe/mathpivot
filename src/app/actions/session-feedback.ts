"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitSessionFeedback(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const sessionId = formData.get("sessionId") as string;
  const studentId = formData.get("studentId") as string;
  const attendanceConfirmed = formData.get("attendance") === "yes";
  const reflection = (formData.get("reflection") as string) || null;
  const parentConcern = (formData.get("parentConcern") as string) || null;

  if (!sessionId || !studentId) {
    return { success: false, error: "Missing session or student" };
  }

  if (user.role === "parent") {
    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from("program_enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("parent_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!enrollment) {
      return { success: false, error: "Not authorized for this student" };
    }
  } else if (user.role === "student") {
    if (user.id !== studentId) {
      return { success: false, error: "Can only submit for yourself" };
    }
  } else {
    return { success: false, error: "Only students and parents can submit" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("session_feedback").upsert(
    {
      session_id: sessionId,
      student_id: studentId,
      attendance_confirmed: attendanceConfirmed,
      reflection,
      parent_concern: parentConcern,
      submitted_by: user.id,
    },
    { onConflict: "session_id,student_id" },
  );

  if (error) {
    return { success: false, error: "Failed to submit feedback" };
  }

  revalidatePath("/student");
  revalidatePath("/parent");

  return { success: true };
}

export async function getPendingFeedback(userId: string, role: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  let studentIds: string[] = [];

  if (role === "student") {
    studentIds = [userId];
  } else if (role === "parent") {
    const { data: enrollments } = await supabase
      .from("program_enrollments")
      .select("student_id")
      .eq("parent_id", userId)
      .eq("status", "active");

    studentIds = (enrollments || []).map((e) => e.student_id);
  }

  if (studentIds.length === 0) return [];

  const { data: completedSessions } = await supabase
    .from("sessions")
    .select(
      "id, completed_at, booking:bookings!inner(student_user_id, tutor_user_id)",
    )
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  if (!completedSessions || completedSessions.length === 0) return [];

  const relevantSessions = completedSessions.filter((s) => {
    const booking = s.booking as unknown as {
      student_user_id: string;
      tutor_user_id: string;
    };
    return studentIds.includes(booking.student_user_id);
  });

  const sessionIds = relevantSessions.map((s) => s.id);
  const { data: existingFeedback } =
    sessionIds.length > 0
      ? await supabase
          .from("session_feedback")
          .select("session_id")
          .in("session_id", sessionIds)
      : { data: [] };

  const feedbackSessionIds = new Set(
    (existingFeedback || []).map((f) => f.session_id),
  );

  const coachIds = [
    ...new Set(
      relevantSessions.map((s) => {
        const booking = s.booking as unknown as { tutor_user_id: string };
        return booking.tutor_user_id;
      }),
    ),
  ];
  const { data: coachProfiles } =
    coachIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name")
          .in("id", coachIds)
      : { data: [] };

  const coachNameMap = new Map(
    (coachProfiles || []).map((p) => [p.id, p.full_name]),
  );

  return relevantSessions
    .filter((s) => !feedbackSessionIds.has(s.id))
    .map((s) => {
      const booking = s.booking as unknown as {
        student_user_id: string;
        tutor_user_id: string;
      };
      return {
        sessionId: s.id,
        completedAt: s.completed_at,
        studentId: booking.student_user_id,
        coachName: coachNameMap.get(booking.tutor_user_id) || "Coach",
      };
    });
}
