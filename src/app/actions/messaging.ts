"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ============================================================
// SCHEMAS
// ============================================================
const sendMessageSchema = z.object({
  threadId: z.string().uuid(),
  body: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long"),
});

const createThreadSchema = z.object({
  recipientId: z.string().uuid(),
  studentUserId: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
  body: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long"),
});

export type MessagingResult = {
  success: boolean;
  error?: string;
  threadId?: string;
};

// ============================================================
// GET THREADS
// ============================================================
export async function getThreads() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { threads: [], error: "Not authenticated" };

  const { data: threads, error } = await supabase
    .from("message_threads")
    .select(
      `
      id,
      participant_a,
      participant_b,
      student_user_id,
      subject,
      status,
      last_message_at,
      created_at
    `,
    )
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .eq("status", "active")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[messaging] getThreads:", error.message);
    return { threads: [], error: "Failed to load conversations" };
  }

  // Get participant profiles
  const participantIds = new Set<string>();
  const studentIds = new Set<string>();
  for (const t of threads || []) {
    const otherId =
      t.participant_a === user.id ? t.participant_b : t.participant_a;
    participantIds.add(otherId);
    if (t.student_user_id) studentIds.add(t.student_user_id);
  }

  const allIds = [...participantIds, ...studentIds];
  const { data: profiles } =
    allIds.length > 0
      ? await supabase
          .from("users_profile")
          .select("id, full_name, role, avatar_url")
          .in("id", allIds)
      : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Get unread counts per thread
  const { data: unreadCounts } = await supabase
    .from("messages")
    .select("thread_id")
    .in(
      "thread_id",
      (threads || []).map((t) => t.id),
    )
    .neq("sender_id", user.id)
    .is("read_at", null);

  const unreadMap = new Map<string, number>();
  for (const msg of unreadCounts || []) {
    unreadMap.set(msg.thread_id, (unreadMap.get(msg.thread_id) || 0) + 1);
  }

  const enriched = (threads || []).map((t) => {
    const otherId =
      t.participant_a === user.id ? t.participant_b : t.participant_a;
    return {
      ...t,
      otherParticipant: profileMap.get(otherId) || null,
      studentProfile: t.student_user_id
        ? profileMap.get(t.student_user_id) || null
        : null,
      unreadCount: unreadMap.get(t.id) || 0,
    };
  });

  return { threads: enriched, error: null };
}

// ============================================================
// GET MESSAGEABLE CONTACTS
// Returns users the current user can message based on role:
// - Parents can message tutors assigned to their students
// - Tutors can message parents of their students
// - Admins can message anyone
// ============================================================
export async function getMessageableContacts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { contacts: [], students: [], error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  let contacts: { id: string; full_name: string; role: string }[] = [];
  let students: { id: string; full_name: string }[] = [];

  if (role === "parent") {
    // Get student IDs in this parent's family
    const { data: familyMember } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();

    if (familyMember) {
      // Get students in family
      const { data: familyStudents } = await supabase
        .from("family_members")
        .select("user_id, users_profile:user_id(full_name)")
        .eq("family_id", familyMember.family_id)
        .eq("member_role", "student");

      students = (familyStudents || []).map((s) => ({
        id: s.user_id,
        full_name:
          (s.users_profile as unknown as { full_name: string })?.full_name ||
          "Student",
      }));

      // Get tutors who have bookings with these students
      const studentIds = students.map((s) => s.id);
      if (studentIds.length > 0) {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("tutor_user_id")
          .in("student_user_id", studentIds)
          .neq("status", "canceled");

        const tutorIds = [
          ...new Set(bookings?.map((b) => b.tutor_user_id) || []),
        ];
        if (tutorIds.length > 0) {
          const { data: tutors } = await supabase
            .from("users_profile")
            .select("id, full_name, role")
            .in("id", tutorIds);
          contacts = tutors || [];
        }
      }
    }
  } else if (role === "tutor") {
    // Get parents of students the tutor has sessions with
    const { data: bookings } = await supabase
      .from("bookings")
      .select("student_user_id, family_id")
      .eq("tutor_user_id", user.id)
      .neq("status", "canceled");

    const familyIds = [
      ...new Set(bookings?.map((b) => b.family_id).filter(Boolean) || []),
    ];
    const studentIds = [
      ...new Set(bookings?.map((b) => b.student_user_id) || []),
    ];

    if (familyIds.length > 0) {
      const { data: parents } = await supabase
        .from("family_members")
        .select("user_id, users_profile:user_id(id, full_name, role)")
        .in("family_id", familyIds)
        .eq("member_role", "parent");

      contacts = (parents || []).map((p) => {
        const prof = p.users_profile as unknown as {
          id: string;
          full_name: string;
          role: string;
        };
        return {
          id: prof?.id || p.user_id,
          full_name: prof?.full_name || "Parent",
          role: "parent",
        };
      });
    }

    if (studentIds.length > 0) {
      const { data: studentProfiles } = await supabase
        .from("users_profile")
        .select("id, full_name")
        .in("id", studentIds);
      students = studentProfiles || [];
    }
  } else if (role === "admin" || role === "super_admin") {
    // Admins can message anyone
    const { data: allUsers } = await supabase
      .from("users_profile")
      .select("id, full_name, role")
      .neq("id", user.id)
      .order("full_name")
      .limit(100);
    contacts = allUsers || [];
  }

  return { contacts, students, error: null };
}

// ============================================================
// GET TOTAL UNREAD COUNT (for sidebar badge)
// ============================================================
export async function getTotalUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get all thread IDs the user participates in
  const { data: threads } = await supabase
    .from("message_threads")
    .select("id")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .eq("status", "active");

  if (!threads || threads.length === 0) return 0;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in(
      "thread_id",
      threads.map((t) => t.id),
    )
    .neq("sender_id", user.id)
    .is("read_at", null);

  return count || 0;
}

// ============================================================
// GET MESSAGES FOR A THREAD
// ============================================================
export async function getMessages(threadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { messages: [], error: "Not authenticated" };

  // Verify user is a participant of this thread
  const { data: thread } = await supabase
    .from("message_threads")
    .select("id")
    .eq("id", threadId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .maybeSingle();

  if (!thread)
    return { messages: [], error: "Thread not found or access denied" };

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_id, body, read_at, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[messaging] getMessages:", error.message);
    return { messages: [], error: "Failed to load messages" };
  }

  // Mark unread messages as read
  const unreadIds = (messages || [])
    .filter((m) => m.sender_id !== user.id && !m.read_at)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  return { messages: messages || [], error: null };
}

// ============================================================
// SEND MESSAGE
// ============================================================
export async function sendMessage(
  formData: FormData,
): Promise<MessagingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const raw = {
    threadId: formData.get("threadId") as string,
    body: (formData.get("body") as string)?.trim(),
  };

  const parsed = sendMessageSchema.safeParse(raw);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const { threadId, body } = parsed.data;

  // Verify user is a participant of this thread
  const { data: thread } = await supabase
    .from("message_threads")
    .select("id")
    .eq("id", threadId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .maybeSingle();

  if (!thread)
    return { success: false, error: "Thread not found or access denied" };

  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body,
  });

  if (error) {
    console.error("[messaging] sendMessage:", error.message);
    return { success: false, error: "Failed to send message" };
  }

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
  return { success: true, threadId };
}

// ============================================================
// CREATE THREAD + FIRST MESSAGE
// ============================================================
export async function createThread(
  formData: FormData,
): Promise<MessagingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const raw = {
    recipientId: formData.get("recipientId") as string,
    studentUserId: (formData.get("studentUserId") as string) || undefined,
    subject: (formData.get("subject") as string) || undefined,
    body: (formData.get("body") as string)?.trim(),
  };

  const parsed = createThreadSchema.safeParse(raw);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const { recipientId, studentUserId, subject, body } = parsed.data;

  // Ensure participant_a < participant_b for the constraint
  const [participantA, participantB] =
    user.id < recipientId ? [user.id, recipientId] : [recipientId, user.id];

  // Check for existing thread
  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("participant_a", participantA)
    .eq("participant_b", participantB)
    .eq("student_user_id", studentUserId || "")
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    // Send to existing thread instead
    const fd = new FormData();
    fd.set("threadId", existing.id);
    fd.set("body", body);
    return sendMessage(fd);
  }

  // Create thread
  const { data: thread, error: threadError } = await supabase
    .from("message_threads")
    .insert({
      participant_a: participantA,
      participant_b: participantB,
      student_user_id: studentUserId || null,
      subject,
    })
    .select("id")
    .single();

  if (threadError || !thread) {
    console.error("[messaging] createThread:", threadError?.message);
    return { success: false, error: "Failed to create conversation" };
  }

  // Send first message
  const { error: msgError } = await supabase.from("messages").insert({
    thread_id: thread.id,
    sender_id: user.id,
    body,
  });

  if (msgError) {
    console.error("[messaging] firstMessage:", msgError.message);
    return {
      success: false,
      error: "Thread created but failed to send message",
    };
  }

  revalidatePath("/messages");
  return { success: true, threadId: thread.id };
}

// ============================================================
// ARCHIVE THREAD
// ============================================================
export async function archiveThread(
  threadId: string,
): Promise<MessagingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Only archive threads the user participates in
  const { error } = await supabase
    .from("message_threads")
    .update({ status: "archived" })
    .eq("id", threadId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

  if (error) {
    console.error("[messaging] archiveThread:", error.message);
    return { success: false, error: "Failed to archive conversation" };
  }

  revalidatePath("/messages");
  return { success: true };
}
