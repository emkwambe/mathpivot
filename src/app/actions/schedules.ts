"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ScheduleSlot {
  schedule_id: string;
  coach_id: string;
  program_slug: string;
  cohort_label: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  default_capacity: number;
  max_capacity: number;
  is_summer_clinic: boolean;
  is_active: boolean;
  enrolled_count: number;
  waitlisted_count: number;
  spots_remaining: number;
  fill_status: string;
}

export async function getCoachSchedules(coachId?: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const targetCoachId = coachId || user.id;

  const { data } = await supabase
    .from("coach_schedule_overview")
    .select("*")
    .eq("coach_id", targetCoachId)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  return (data || []) as ScheduleSlot[];
}

export async function getAllSchedules() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin"))
    return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("coach_schedule_overview")
    .select("*")
    .eq("is_active", true)
    .order("program_slug")
    .order("day_of_week")
    .order("start_time");

  return (data || []) as ScheduleSlot[];
}

export async function createSchedule(input: {
  coachId: string;
  programSlug: string;
  cohortLabel: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isSummerClinic?: boolean;
  clinicStartDate?: string;
  clinicEndDate?: string;
  location?: string;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const { data: existingSchedules } = await supabase
    .from("coaching_schedules")
    .select("id, program_slug")
    .eq("coach_id", input.coachId)
    .eq("is_active", true);

  const distinctPrograms = new Set(
    (existingSchedules || []).map((s) => s.program_slug),
  );
  distinctPrograms.add(input.programSlug);

  if (distinctPrograms.size > 3) {
    return {
      success: false,
      error: "Coach cannot exceed 3 different programs",
    };
  }

  const { data: conflicts } = await supabase
    .from("coaching_schedules")
    .select("id")
    .eq("coach_id", input.coachId)
    .eq("day_of_week", input.dayOfWeek)
    .eq("is_active", true)
    .or(`start_time.lt.${input.endTime},end_time.gt.${input.startTime}`);

  if (conflicts && conflicts.length > 0) {
    return { success: false, error: "Time conflict with existing schedule" };
  }

  const totalCohorts = (existingSchedules || []).length;
  if (totalCohorts >= 3) {
    return { success: false, error: "Coach already has 3 cohorts (maximum)" };
  }

  const { error } = await supabase.from("coaching_schedules").insert({
    coach_id: input.coachId,
    program_slug: input.programSlug,
    cohort_label: input.cohortLabel,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_summer_clinic: input.isSummerClinic || false,
    clinic_start_date: input.clinicStartDate || null,
    clinic_end_date: input.clinicEndDate || null,
    location: input.location || "online",
  });

  if (error) return { success: false, error: "Failed to create schedule" };

  revalidatePath("/admin/schedules");
  revalidatePath("/tutor");
  return { success: true };
}

export async function placeCohortStudent(input: {
  scheduleId: string;
  studentId: string;
  parentId?: string;
  enrollmentId?: string;
  placementMethod?: string;
  diagnosticScore?: Record<string, unknown>;
  clinicFeeCents?: number;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("coaching_schedules")
    .select("id, default_capacity, max_capacity")
    .eq("id", input.scheduleId)
    .single();

  if (!schedule) return { success: false, error: "Schedule not found" };

  const { count } = await supabase
    .from("cohort_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", input.scheduleId)
    .in("status", ["confirmed", "active"]);

  const currentCount = count || 0;

  let status: string;
  if (currentCount >= schedule.max_capacity) {
    status = "waitlisted";
  } else if (currentCount >= schedule.default_capacity) {
    status = "confirmed";
  } else {
    status = "confirmed";
  }

  const { error } = await supabase.from("cohort_enrollments").insert({
    schedule_id: input.scheduleId,
    student_id: input.studentId,
    parent_id: input.parentId || null,
    enrollment_id: input.enrollmentId || null,
    status,
    placement_method: input.placementMethod || "admin",
    diagnostic_score: input.diagnosticScore || null,
    clinic_fee_cents: input.clinicFeeCents || null,
    confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Student already in this cohort" };
    }
    return { success: false, error: "Failed to place student" };
  }

  revalidatePath("/admin/schedules");
  revalidatePath("/tutor/portfolio");
  return { success: true, status };
}

export async function getCohortStudents(scheduleId: string) {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("cohort_enrollments")
    .select(
      "id, student_id, status, placement_method, diagnostic_score, payment_status, enrolled_at, confirmed_at",
    )
    .eq("schedule_id", scheduleId)
    .order("enrolled_at");

  if (!enrollments || enrollments.length === 0) return [];

  const studentIds = enrollments.map((e) => e.student_id);
  const { data: students } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .in("id", studentIds);

  const nameMap = new Map((students || []).map((s) => [s.id, s.full_name]));

  return enrollments.map((e) => ({
    ...e,
    student_name: nameMap.get(e.student_id) || "Student",
  }));
}

export async function updateCohortStatus(
  cohortEnrollmentId: string,
  newStatus: string,
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false };
  }

  const supabase = await createClient();

  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "confirmed")
    updates.confirmed_at = new Date().toISOString();
  if (newStatus === "completed")
    updates.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("cohort_enrollments")
    .update(updates)
    .eq("id", cohortEnrollmentId);

  if (error) return { success: false };

  revalidatePath("/admin/schedules");
  return { success: true };
}

export async function getWaitlistLeads(source?: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin"))
    return [];

  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (source) {
    query = query.eq("source", source);
  }

  const { data } = await query;
  return data || [];
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
  assignedTo?: string,
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false };
  }

  const supabase = await createClient();

  const updates: Record<string, unknown> = { lead_status: status };
  if (assignedTo) updates.assigned_to = assignedTo;
  if (status === "contacted") updates.contacted_at = new Date().toISOString();

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId);

  if (error) return { success: false };

  revalidatePath("/admin/summer-waitlist");
  return { success: true };
}
