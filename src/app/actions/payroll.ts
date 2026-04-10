"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export type PayrollResult = {
  success: boolean;
  error?: string;
};

// ============================================================
// GET PAYOUT PERIODS
// ============================================================
export async function getPayoutPeriods() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { periods: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("payout_periods")
    .select("*")
    .order("period_start", { ascending: false })
    .limit(24);

  if (error) return { periods: [], error: error.message };
  return { periods: data || [], error: null };
}

// ============================================================
// GET TUTOR PAYOUTS (admin view — all tutors for a period)
// ============================================================
export async function getPayoutsForPeriod(periodId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tutor_payouts")
    .select(
      `
      *,
      tutor:tutor_user_id (
        full_name,
        email
      )
    `,
    )
    .eq("period_id", periodId)
    .order("total_amount_cents", { ascending: false });

  if (error) return { payouts: [], error: error.message };
  return { payouts: data || [], error: null };
}

// ============================================================
// GET TUTOR'S OWN EARNINGS
// ============================================================
export async function getMyEarnings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { payouts: [], rates: [], error: "Not authenticated" };

  const [payoutsResult, ratesResult] = await Promise.all([
    supabase
      .from("tutor_payouts")
      .select(
        `
        *,
        period:period_id (
          period_start,
          period_end,
          period_type
        )
      `,
      )
      .eq("tutor_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("tutor_pay_rates")
      .select("*")
      .eq("tutor_user_id", user.id)
      .order("effective_from", { ascending: false }),
  ]);

  return {
    payouts: payoutsResult.data || [],
    rates: ratesResult.data || [],
    error: payoutsResult.error?.message || ratesResult.error?.message || null,
  };
}

// ============================================================
// GET PAYOUT DETAIL (line items)
// ============================================================
export async function getPayoutDetail(payoutId: string) {
  const supabase = await createClient();

  const [payoutResult, itemsResult] = await Promise.all([
    supabase
      .from("tutor_payouts")
      .select(
        `
        *,
        period:period_id (period_start, period_end, period_type),
        tutor:tutor_user_id (full_name, email)
      `,
      )
      .eq("id", payoutId)
      .single(),
    supabase
      .from("payout_line_items")
      .select("*")
      .eq("payout_id", payoutId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    payout: payoutResult.data,
    lineItems: itemsResult.data || [],
    error: payoutResult.error?.message || itemsResult.error?.message || null,
  };
}

// ============================================================
// CREATE PAYOUT PERIOD (admin)
// ============================================================
const createPeriodSchema = z.object({
  periodType: z.enum(["weekly", "biweekly", "monthly"]),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export async function createPayoutPeriod(
  formData: FormData,
): Promise<PayrollResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const supabase = await createClient();

  const parsed = createPeriodSchema.safeParse({
    periodType: formData.get("periodType"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
  });

  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from("payout_periods").insert({
    period_type: parsed.data.periodType,
    period_start: parsed.data.periodStart,
    period_end: parsed.data.periodEnd,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/payroll");
  return { success: true };
}

// ============================================================
// GENERATE PAYOUTS FOR A PERIOD (admin)
// Uses the calculate_tutor_payout SQL function
// ============================================================
export async function generatePayoutsForPeriod(
  periodId: string,
): Promise<PayrollResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const admin = createAdminClient();

  // Get period dates
  const { data: period, error: periodError } = await admin
    .from("payout_periods")
    .select("*")
    .eq("id", periodId)
    .single();

  if (periodError || !period)
    return { success: false, error: "Period not found" };
  if (period.is_locked)
    return { success: false, error: "Period is already locked" };

  // Get all active tutors
  const { data: tutors } = await admin
    .from("tutors_profile")
    .select("user_id, hourly_rate")
    .eq("is_active", true);

  if (!tutors || tutors.length === 0)
    return { success: false, error: "No active tutors found" };

  let generated = 0;

  for (const tutor of tutors) {
    // Calculate earnings using RPC
    const { data: calc, error: calcError } = await admin.rpc(
      "calculate_tutor_payout",
      {
        p_tutor_user_id: tutor.user_id,
        p_period_start: period.period_start,
        p_period_end: period.period_end,
      },
    );

    if (calcError) {
      console.error(
        `[payroll] calc error for ${tutor.user_id}:`,
        calcError.message,
      );
      continue;
    }

    const row = Array.isArray(calc) ? calc[0] : calc;
    if (!row || row.sessions_count === 0) continue;

    // Upsert payout
    const { data: payout, error: upsertError } = await admin
      .from("tutor_payouts")
      .upsert(
        {
          tutor_user_id: tutor.user_id,
          period_id: periodId,
          status: "draft",
          sessions_count: row.sessions_count,
          total_hours: row.total_hours,
          base_amount_cents: row.total_cents,
          total_amount_cents: row.total_cents,
        },
        { onConflict: "tutor_user_id,period_id" },
      )
      .select("id")
      .single();

    if (upsertError) {
      console.error(
        `[payroll] upsert error for ${tutor.user_id}:`,
        upsertError.message,
      );
      continue;
    }

    generated++;
  }

  revalidatePath("/admin/payroll");
  return {
    success: true,
    error:
      generated === 0
        ? "No sessions found for any tutor in this period"
        : undefined,
  };
}

// ============================================================
// APPROVE PAYOUT (admin)
// ============================================================
export async function approvePayout(payoutId: string): Promise<PayrollResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("tutor_payouts")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .in("status", ["draft", "pending_approval"]);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/payroll");
  return { success: true };
}

// ============================================================
// MARK PAYOUT AS PAID (admin)
// ============================================================
export async function markPayoutPaid(payoutId: string): Promise<PayrollResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tutor_payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .eq("status", "approved");

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/payroll");
  return { success: true };
}

// ============================================================
// SET TUTOR PAY RATE (admin)
// ============================================================
const setRateSchema = z.object({
  tutorUserId: z.string().uuid(),
  label: z.string().min(1),
  rateCents: z.coerce.number().int().positive(),
  rateType: z.enum(["per_hour", "per_session", "flat"]),
  isDefault: z.coerce.boolean().default(false),
});

export async function setTutorPayRate(
  formData: FormData,
): Promise<PayrollResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "Admin access required" };
  }

  const supabase = await createClient();

  const parsed = setRateSchema.safeParse({
    tutorUserId: formData.get("tutorUserId"),
    label: formData.get("label"),
    rateCents: formData.get("rateCents"),
    rateType: formData.get("rateType"),
    isDefault: formData.get("isDefault") === "true",
  });

  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  // If setting as default, unset other defaults for this tutor
  if (parsed.data.isDefault) {
    await supabase
      .from("tutor_pay_rates")
      .update({ is_default: false })
      .eq("tutor_user_id", parsed.data.tutorUserId)
      .eq("is_default", true);
  }

  const { error } = await supabase.from("tutor_pay_rates").insert({
    tutor_user_id: parsed.data.tutorUserId,
    label: parsed.data.label,
    rate_cents: parsed.data.rateCents,
    rate_type: parsed.data.rateType,
    is_default: parsed.data.isDefault,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/payroll");
  return { success: true };
}
