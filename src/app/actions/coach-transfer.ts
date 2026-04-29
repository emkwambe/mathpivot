"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";

export async function transferStudentToCoach(
  enrollmentId: string,
  newCoachId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Only admins can transfer students" };
  }

  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("id, student_id, coach_id, program_id")
    .eq("id", enrollmentId)
    .single();

  if (!enrollment) {
    return { success: false, error: "Enrollment not found" };
  }

  if (enrollment.coach_id === newCoachId) {
    return { success: false, error: "Student is already with this coach" };
  }

  const { data: program } = await supabase
    .from("coaching_programs")
    .select("max_students_per_coach")
    .eq("id", enrollment.program_id)
    .single();

  const { count: newCoachLoad } = await supabase
    .from("program_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", newCoachId)
    .eq("status", "active");

  if (
    program &&
    newCoachLoad !== null &&
    newCoachLoad >= program.max_students_per_coach
  ) {
    return {
      success: false,
      error: `New coach is at capacity (${newCoachLoad}/${program.max_students_per_coach})`,
    };
  }

  const previousCoachId = enrollment.coach_id;

  const { error } = await supabase
    .from("program_enrollments")
    .update({
      coach_id: newCoachId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  if (error) {
    return { success: false, error: "Failed to transfer student" };
  }

  logAuditEvent({
    actorUserId: user.id,
    action: "update",
    resourceType: "program_enrollment",
    resourceId: enrollmentId,
    description: `Coach transfer: ${previousCoachId} → ${newCoachId}. Reason: ${reason}`,
  }).catch(() => {});

  revalidatePath("/admin");
  revalidatePath("/tutor/portfolio");

  return { success: true };
}

export async function bulkTransferCoachPortfolio(
  fromCoachId: string,
  toCoachId: string,
  reason: string,
): Promise<{ success: boolean; transferred: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return {
      success: false,
      transferred: 0,
      error: "Only admins can transfer",
    };
  }

  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("program_enrollments")
    .select("id, student_id, program_id")
    .eq("coach_id", fromCoachId)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) {
    return { success: true, transferred: 0 };
  }

  const { count: targetLoad } = await supabase
    .from("program_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", toCoachId)
    .eq("status", "active");

  const totalAfter = (targetLoad || 0) + enrollments.length;
  if (totalAfter > 15) {
    return {
      success: false,
      transferred: 0,
      error: `Transfer would exceed capacity: ${targetLoad || 0} current + ${enrollments.length} incoming = ${totalAfter} (max 15)`,
    };
  }

  const { error } = await supabase
    .from("program_enrollments")
    .update({
      coach_id: toCoachId,
      updated_at: new Date().toISOString(),
    })
    .eq("coach_id", fromCoachId)
    .eq("status", "active");

  if (error) {
    return { success: false, transferred: 0, error: "Transfer failed" };
  }

  logAuditEvent({
    actorUserId: user.id,
    action: "update",
    resourceType: "coach_portfolio",
    resourceId: fromCoachId,
    description: `Bulk transfer: ${enrollments.length} students from ${fromCoachId} to ${toCoachId}. Reason: ${reason}`,
  }).catch(() => {});

  revalidatePath("/admin");
  revalidatePath("/tutor/portfolio");

  return { success: true, transferred: enrollments.length };
}
