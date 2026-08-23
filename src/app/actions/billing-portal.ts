"use server";

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/**
 * Statuses that still warrant portal access. A canceled or unpaid
 * subscription is deliberately included: a parent whose card failed needs the
 * portal more than anyone, and one who just canceled may want an invoice.
 * Only `incomplete_expired` is excluded — that customer never paid, so there
 * is nothing for them to manage.
 */
const PORTAL_ELIGIBLE_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
  "canceled",
  "incomplete",
];

/**
 * Open Stripe's hosted billing portal for the signed-in parent.
 *
 * The customer id is read through the *user-scoped* Supabase client, not
 * supabaseAdmin, so migration 00049's RLS policy is what authorises the
 * lookup: a parent can only ever resolve a `stripe_customer_id` on a row
 * where they are `parent_user_id` or share the `family_id`. Reaching for the
 * service-role client here would hand any signed-in user a portal session for
 * any customer id they could name.
 */
export async function openBillingPortalAction(): Promise<{
  url?: string;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to manage billing." };
  }

  // RLS alone is not a sufficient filter here. Migration 00049 also grants
  // admins FOR ALL on this table, so a policy-only query would happily return
  // some other family's row to an admin who opened /parent/billing — and hand
  // them a portal session for a customer that is not theirs. Scope the query
  // to this user explicitly and let RLS be the second line of defence.
  const { data: memberships } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id);

  const familyIds = (memberships ?? [])
    .map((m) => m.family_id)
    .filter((id): id is string => !!id);

  const ownedBy =
    familyIds.length > 0
      ? `parent_user_id.eq.${user.id},family_id.in.(${familyIds.join(",")})`
      : `parent_user_id.eq.${user.id}`;

  const { data: subscription, error: lookupErr } = await supabase
    .from("program_subscriptions")
    .select("stripe_customer_id, status")
    .or(ownedBy)
    .in("status", PORTAL_ELIGIBLE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupErr) {
    console.error("[billing-portal] subscription lookup:", lookupErr.message);
    return { error: "Could not load your subscription. Please try again." };
  }

  if (!subscription?.stripe_customer_id) {
    return {
      error: "No coaching subscription found on this account.",
    };
  }

  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "www.mathpivot.com";
  const proto = h.get("x-forwarded-proto") ?? "https";

  // This Stripe account also serves another brand, whose portal settings are
  // the account "Default" configuration. Omitting `configuration` silently
  // falls back to that Default, which would show MathPivot parents the wrong
  // company name and return them to the other brand's domain after cancelling.
  // The MathPivot Coaching configuration id must therefore be pinned here.
  const configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID;

  if (!configuration) {
    console.error(
      "[billing-portal] STRIPE_PORTAL_CONFIGURATION_ID is not set; refusing " +
        "to open a portal session that would fall back to the account default " +
        "configuration.",
    );
    return {
      error:
        "Billing portal is unavailable right now. Please contact mathpivot@mpingo.ai.",
    };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      configuration,
      return_url: `${proto}://${host}/parent/billing`,
    });

    return { url: session.url };
  } catch (err) {
    // The most common failure here is not a bug: Stripe returns
    // "No configuration provided" until the billing portal has been
    // configured once per mode in the Dashboard. Test-mode configuration
    // does NOT carry over to live mode.
    console.error("[billing-portal] session create failed:", err);
    return {
      error:
        "Billing portal is unavailable right now. Please contact mathpivot@mpingo.ai.",
    };
  }
}
