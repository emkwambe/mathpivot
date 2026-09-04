"use server";

import { headers } from "next/headers";
import { createSubscriptionCheckout } from "@/lib/stripe/subscription-checkout";
import {
  isValidBillingPlan,
  isValidTier,
  PROGRAMS,
  type BillingPlan,
  type ProgramTier,
} from "@/lib/stripe/programs";

function absoluteBaseUrl(host: string, proto: string): string {
  return `${proto}://${host}`;
}

export async function startEnrollmentAction(
  tier: string,
  opts?: { parentEmail?: string; plan?: string },
): Promise<{ url?: string; error?: string }> {
  if (!isValidTier(tier)) {
    return { error: "Unknown coaching program." };
  }
  const plan: BillingPlan = isValidBillingPlan(opts?.plan)
    ? opts.plan
    : "monthly";

  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "www.mathpivot.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = absoluteBaseUrl(host, proto);

  const program = PROGRAMS[tier as ProgramTier];
  const priceCents =
    plan === "quarterly"
      ? String(program.quarterly.priceUpfrontCents)
      : String(program.priceMonthlyCents);

  const result = await createSubscriptionCheckout({
    tier: tier as ProgramTier,
    plan,
    successUrl: `${base}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/enroll/${tier}?canceled=1`,
    parentEmail: opts?.parentEmail,
    metadata: {
      program_name: program.name,
      billing_plan: plan,
      price_cents_at_enrollment: priceCents,
    },
  });

  if ("error" in result) return { error: result.error };
  return { url: result.url };
}
