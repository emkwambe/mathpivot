"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import type { LeadRecord } from "@/types/views";

export type LeadResult = {
  success: boolean;
  error?: string;
  leadId?: string;
};

const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "trial_scheduled",
  "trial_completed",
  "converted",
  "lost",
] as const;
const LEAD_SOURCES = [
  "website",
  "referral",
  "social_media",
  "google_ads",
  "facebook_ads",
  "walk_in",
  "phone",
  "email",
  "partner",
  "event",
  "other",
] as const;

// ============================================================
// PUBLIC: Submit lead capture form (no auth required)
// ============================================================
const captureLeadSchema = z.object({
  parentName: z.string().min(2, "Name is required"),
  parentEmail: z.string().email("Valid email required"),
  parentPhone: z.string().optional(),
  studentName: z.string().optional(),
  studentGrade: z.coerce.number().int().min(1).max(12).optional(),
  subjectsInterested: z.string().optional(),
  goals: z.string().optional(),
  preferredModality: z.enum(["online", "in_person", "either"]).optional(),
  source: z.enum(LEAD_SOURCES).default("website"),
  sourceDetail: z.string().optional(),
});

export async function captureLeadAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const parsed = captureLeadSchema.safeParse({
    parentName: formData.get("parentName"),
    parentEmail: formData.get("parentEmail"),
    parentPhone: formData.get("parentPhone") || undefined,
    studentName: formData.get("studentName") || undefined,
    studentGrade: formData.get("studentGrade") || undefined,
    subjectsInterested: formData.get("subjectsInterested") || undefined,
    goals: formData.get("goals") || undefined,
    preferredModality: formData.get("preferredModality") || undefined,
    source: formData.get("source") || "website",
    sourceDetail: formData.get("sourceDetail") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const admin = createAdminClient();
  const subjects = parsed.data.subjectsInterested
    ? parsed.data.subjectsInterested
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const { error } = await admin.from("leads").insert({
    parent_name: parsed.data.parentName,
    parent_email: parsed.data.parentEmail,
    parent_phone: parsed.data.parentPhone || null,
    student_name: parsed.data.studentName || null,
    student_grade: parsed.data.studentGrade || null,
    subjects_interested: subjects,
    goals: parsed.data.goals || null,
    preferred_modality: parsed.data.preferredModality || null,
    source: parsed.data.source,
    source_detail: parsed.data.sourceDetail || null,
  });

  if (error) {
    console.error("[leads] capture:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}

// ============================================================
// GET ALL LEADS (admin)
// ============================================================
export async function getLeads(filters?: { status?: string; source?: string }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { leads: [], error: "Admin access required" };
  }

  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(
      `
      *,
      assigned_user:assigned_to (full_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.source) query = query.eq("source", filters.source);

  const { data, error } = await query;
  if (error) return { leads: [], error: error.message };
  return { leads: data || [], error: null };
}

// ============================================================
// GET LEADS GROUPED BY STATUS (for kanban)
// ============================================================
export async function getLeadsByStatus() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { columns: {}, error: "Admin access required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      assigned_user:assigned_to (full_name)
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) return { columns: {}, error: error.message };

  const columns: Record<string, LeadRecord[]> = {};
  for (const status of LEAD_STATUSES) {
    columns[status] = [];
  }
  for (const lead of (data || []) as unknown as LeadRecord[]) {
    if (columns[lead.status]) {
      columns[lead.status].push(lead);
    }
  }

  return { columns, error: null };
}

// ============================================================
// UPDATE LEAD STATUS (admin — drag in kanban)
// ============================================================
export async function updateLeadStatus(
  leadId: string,
  newStatus: string,
): Promise<LeadResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const supabase = await createClient();

  const updates: Record<string, string | null> = { status: newStatus };
  if (newStatus === "converted")
    updates.converted_at = new Date().toISOString();
  if (newStatus === "contacted")
    updates.last_contacted_at = new Date().toISOString();

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/leads");
  return { success: true, leadId };
}

// ============================================================
// UPDATE LEAD DETAILS (admin)
// ============================================================
export async function updateLead(
  leadId: string,
  formData: FormData,
): Promise<LeadResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const supabase = await createClient();

  const updates: Record<string, string | number | null> = {};
  const fields = [
    "parent_name",
    "parent_email",
    "parent_phone",
    "student_name",
    "goals",
    "notes",
    "budget_range",
    "preferred_schedule",
    "lost_reason",
  ];
  for (const field of fields) {
    const val = formData.get(field) as string | null;
    if (val !== null) updates[field] = val || null;
  }

  const grade = formData.get("student_grade") as string | null;
  if (grade) updates.student_grade = parseInt(grade);

  const assignedTo = formData.get("assigned_to") as string | null;
  if (assignedTo !== null) updates.assigned_to = assignedTo || null;

  const nextFollowUp = formData.get("next_follow_up_at") as string | null;
  if (nextFollowUp !== null) updates.next_follow_up_at = nextFollowUp || null;

  const score = formData.get("score");
  if (score) updates.score = parseInt(score as string);

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/leads");
  return { success: true, leadId };
}

// ============================================================
// ADD NOTE TO LEAD (admin)
// ============================================================
export async function addLeadNote(
  leadId: string,
  note: string,
): Promise<LeadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "note_added",
    description: note,
    created_by: user?.id || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/leads");
  return { success: true, leadId };
}

// ============================================================
// GET LEAD DETAIL + ACTIVITIES
// ============================================================
export async function getLeadDetail(leadId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return {
      lead: null,
      activities: [],
      trials: [],
      error: "Admin access required",
    };
  }

  const supabase = await createClient();

  const [leadResult, activitiesResult, trialsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*, assigned_user:assigned_to (full_name, email)")
      .eq("id", leadId)
      .single(),
    supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("trial_lessons")
      .select("*")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: false }),
  ]);

  return {
    lead: leadResult.data,
    activities: activitiesResult.data || [],
    trials: trialsResult.data || [],
    error: leadResult.error?.message || null,
  };
}

// ============================================================
// SCHEDULE TRIAL LESSON
// ============================================================
const trialSchema = z.object({
  leadId: z.string().uuid(),
  tutorUserId: z.string().uuid(),
  studentName: z.string().min(1),
  studentGrade: z.coerce.number().int().min(1).max(12),
  subject: z.string().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.coerce.number().int().default(30),
  modality: z.enum(["online", "in_person"]).default("online"),
});

export async function scheduleTrialLesson(
  formData: FormData,
): Promise<LeadResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const supabase = await createClient();

  const parsed = trialSchema.safeParse({
    leadId: formData.get("leadId"),
    tutorUserId: formData.get("tutorUserId"),
    studentName: formData.get("studentName"),
    studentGrade: formData.get("studentGrade"),
    subject: formData.get("subject") || undefined,
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: formData.get("durationMinutes") || 30,
    modality: formData.get("modality") || "online",
  });

  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  // Create trial lesson
  const { error: trialError } = await supabase.from("trial_lessons").insert({
    lead_id: parsed.data.leadId,
    tutor_user_id: parsed.data.tutorUserId,
    student_name: parsed.data.studentName,
    student_grade: parsed.data.studentGrade,
    subject: parsed.data.subject || null,
    scheduled_at: parsed.data.scheduledAt,
    duration_minutes: parsed.data.durationMinutes,
    modality: parsed.data.modality,
  });

  if (trialError) return { success: false, error: trialError.message };

  // Update lead status
  await supabase
    .from("leads")
    .update({ status: "trial_scheduled" })
    .eq("id", parsed.data.leadId);

  // Log activity
  await supabase.from("lead_activities").insert({
    lead_id: parsed.data.leadId,
    activity_type: "trial_scheduled",
    description: `Trial lesson scheduled for ${parsed.data.studentName}`,
  });

  revalidatePath("/admin/leads");
  return { success: true, leadId: parsed.data.leadId };
}

// ============================================================
// COMPLETE TRIAL LESSON
// ============================================================
export async function completeTrialLesson(
  trialId: string,
  formData: FormData,
): Promise<LeadResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const supabase = await createClient();

  const { data: trial } = await supabase
    .from("trial_lessons")
    .select("lead_id")
    .eq("id", trialId)
    .single();

  if (!trial) return { success: false, error: "Trial not found" };

  const { error } = await supabase
    .from("trial_lessons")
    .update({
      status: "completed",
      tutor_notes: (formData.get("tutorNotes") as string) || null,
      tutor_rating: formData.get("tutorRating")
        ? parseInt(formData.get("tutorRating") as string)
        : null,
      recommended_track: (formData.get("recommendedTrack") as string) || null,
      recommended_package:
        (formData.get("recommendedPackage") as string) || null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", trialId);

  if (error) return { success: false, error: error.message };

  // Update lead status
  await supabase
    .from("leads")
    .update({ status: "trial_completed" })
    .eq("id", trial.lead_id);

  revalidatePath("/admin/leads");
  return { success: true };
}

// ============================================================
// GET LEAD SOURCE ANALYTICS
// ============================================================
export async function getLeadAnalytics() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return {
      stats: [],
      funnelData: [],
      summary: { total: 0, newThisWeek: 0, convertedThisMonth: 0, avgScore: 0 },
      error: "Admin access required",
    };
  }

  const supabase = await createClient();

  // Get summary counts by source
  const { data: leads } = await supabase
    .from("leads")
    .select("id, status, source, created_at, converted_at");

  if (!leads) return { stats: [], funnelData: [], error: null };

  // Build source stats
  const sourceMap = new Map<
    string,
    { total: number; qualified: number; trials: number; converted: number }
  >();
  for (const lead of leads) {
    const s = sourceMap.get(lead.source) || {
      total: 0,
      qualified: 0,
      trials: 0,
      converted: 0,
    };
    s.total++;
    if (lead.status !== "new" && lead.status !== "lost") s.qualified++;
    if (
      ["trial_scheduled", "trial_completed", "converted"].includes(lead.status)
    )
      s.trials++;
    if (lead.status === "converted") s.converted++;
    sourceMap.set(lead.source, s);
  }

  const stats = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      ...data,
      conversionRate:
        data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.total - a.total);

  // Build funnel data
  const funnel = LEAD_STATUSES.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  return { stats, funnelData: funnel, error: null };
}
