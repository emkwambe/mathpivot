"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function calculateMonthlyEarnings(
  monthDate?: string,
): Promise<{ success: boolean; calculated: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, calculated: 0, error: "Admin only" };
  }

  const supabase = createAdminClient();
  const targetDate = monthDate ? new Date(monthDate) : new Date();
  const periodStart = startOfMonth(targetDate);
  const periodEnd = endOfMonth(targetDate);
  const periodStartStr = format(periodStart, "yyyy-MM-dd");
  const periodEndStr = format(periodEnd, "yyyy-MM-dd");

  const { data: coaches } = await supabase
    .from("tutors_profile")
    .select("user_id")
    .eq("is_active", true);

  if (!coaches || coaches.length === 0) {
    return { success: true, calculated: 0 };
  }

  let calculated = 0;

  for (const coach of coaches) {
    const { data: enrollments } = await supabase
      .from("program_enrollments")
      .select("id, program_id, enrolled_at, cancelled_at, status")
      .eq("coach_id", coach.user_id)
      .or(
        `status.eq.active,and(status.eq.cancelled,cancelled_at.gte.${periodStartStr})`,
      );

    const activeThisMonth = (enrollments || []).filter((e) => {
      const enrolledDate = new Date(e.enrolled_at);
      if (enrolledDate > periodEnd) return false;
      if (e.status === "cancelled" && e.cancelled_at) {
        const cancelDate = new Date(e.cancelled_at);
        if (cancelDate < periodStart) return false;
      }
      return true;
    });

    if (activeThisMonth.length === 0) continue;

    const programIds = [...new Set(activeThisMonth.map((e) => e.program_id))];
    const { data: programs } = await supabase
      .from("coaching_programs")
      .select("id, monthly_price_cents")
      .in("id", programIds);

    const priceMap = new Map(
      (programs || []).map((p) => [p.id, p.monthly_price_cents]),
    );

    const totalRevenue = activeThisMonth.reduce((sum, e) => {
      return sum + (priceMap.get(e.program_id) || 0);
    }, 0);

    const { count: sessionsDelivered } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", periodStart.toISOString())
      .lte("completed_at", periodEnd.toISOString());

    const coachSharePercent = 60;
    const coachEarnings = Math.round(totalRevenue * (coachSharePercent / 100));

    await supabase.from("coach_earnings").upsert(
      {
        coach_id: coach.user_id,
        period_start: periodStartStr,
        period_end: periodEndStr,
        total_revenue_cents: totalRevenue,
        coach_share_percent: coachSharePercent,
        coach_earnings_cents: coachEarnings,
        active_students: activeThisMonth.length,
        sessions_delivered: sessionsDelivered || 0,
        status: "pending",
      },
      { onConflict: "coach_id,period_start" },
    );

    calculated++;
  }

  revalidatePath("/admin/payroll");
  revalidatePath("/tutor/earnings");

  return { success: true, calculated };
}

export async function approveEarnings(
  earningsId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin only" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("coach_earnings")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", earningsId)
    .eq("status", "pending");

  if (error) return { success: false, error: "Failed to approve" };

  revalidatePath("/admin/payroll");
  return { success: true };
}

export async function markEarningsPaid(
  earningsId: string,
  payoutReference: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin only" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("coach_earnings")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payout_reference: payoutReference || null,
    })
    .eq("id", earningsId)
    .eq("status", "approved");

  if (error) return { success: false, error: "Failed to mark paid" };

  revalidatePath("/admin/payroll");
  revalidatePath("/tutor/earnings");
  return { success: true };
}
