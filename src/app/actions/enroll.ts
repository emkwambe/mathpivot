"use server";

import { headers } from "next/headers";
import { createSubscriptionCheckout } from "@/lib/stripe/subscription-checkout";
import { isValidTier, PROGRAMS, type ProgramTier } from "@/lib/stripe/programs";

function absoluteBaseUrl(host: string, proto: string): string {
  return `${proto}://${host}`;
}

export async function startEnrollmentAction(
  tier: string,
  opts?: { parentEmail?: string },
): Promise<{ url?: string; error?: string }> {
  if (!isValidTier(tier)) {
    return { error: "Unknown coaching program." };
  }

  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "www.mathpivot.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = absoluteBaseUrl(host, proto);

  const program = PROGRAMS[tier as ProgramTier];

  const result = await createSubscriptionCheckout({
    tier: tier as ProgramTier,
    successUrl: `${base}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/enroll/${tier}?canceled=1`,
    parentEmail: opts?.parentEmail,
    metadata: {
      program_name: program.name,
      price_monthly_cents: String(program.priceMonthlyCents),
    },
  });

  if ("error" in result) return { error: result.error };
  return { url: result.url };
}
