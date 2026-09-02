import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import {
  stripe,
  constructSubscriptionWebhookEvent,
  isStripeConfigured,
} from "@/lib/stripe";
import { isValidTier, PROGRAMS, type ProgramTier } from "@/lib/stripe/programs";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import {
  claimWebhookEvent,
  markWebhookEventProcessed,
  markWebhookEventFailed,
} from "@/lib/stripe/webhook-events";
import { sendEmail } from "@/lib/email";

// Force this to run in the Node runtime so we get the raw body.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Database admin not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const h = await headers();
  const signature = h.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const event = constructSubscriptionWebhookEvent(body, signature);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Claim the event before doing any work. Completion is tracked by
  // processed_at, not by the row's existence — a delivery whose handler died
  // leaves the row claimed but unprocessed, and the next Stripe retry re-runs
  // it. See claimWebhookEvent for why the row alone is not enough.
  const claim = await claimWebhookEvent(
    event.id,
    event.type,
    event.data.object as unknown as Record<string, unknown>,
  );

  if (claim.status === "duplicate") {
    return NextResponse.json({ received: true, deduped: true });
  }
  if (claim.status === "in_flight") {
    return NextResponse.json({ received: true, inFlight: true });
  }
  if (claim.status === "error") {
    console.error(
      "[subscription-webhook] could not claim event:",
      claim.message,
    );
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleSubscriptionCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.created":
        await syncSubscriptionState(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    await markWebhookEventProcessed(event.id, "[subscription-webhook]");
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[subscription-webhook] handler error:", err);
    // Leaves processed_at NULL, so Stripe's retry re-runs the handler rather
    // than being deduped away.
    await markWebhookEventFailed(event.id, err, "[subscription-webhook]");
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "subscription") return;
  if (session.metadata?.flow !== "program_subscription") return;

  const tierRaw = session.metadata?.program_tier;
  // Legacy Sprint 9 test-mode subscriptions carry program_tier: "elite" in
  // Stripe metadata. Those were already processed; if Stripe re-delivers such
  // an event we skip rather than 500. Live-mode events after the rename carry
  // "advanced" and pass the isValidTier check.
  if (tierRaw === "elite") {
    console.info(
      "[subscription-webhook] skipping legacy 'elite' tier event",
      session.id,
    );
    return;
  }
  if (!tierRaw || !isValidTier(tierRaw)) {
    console.error(
      "[subscription-webhook] invalid tier on session",
      session.id,
      tierRaw,
    );
    return;
  }
  const tier = tierRaw as ProgramTier;

  const stripeSubId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!stripeSubId) {
    console.error(
      "[subscription-webhook] no subscription on session",
      session.id,
    );
    return;
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  if (!stripeCustomerId) {
    console.error("[subscription-webhook] no customer on session", session.id);
    return;
  }

  const parentEmail =
    session.customer_details?.email ?? session.customer_email ?? "";
  const parentName = session.customer_details?.name ?? null;

  const custom = Object.fromEntries(
    (session.custom_fields ?? []).map((f) => [
      f.key,
      f.type === "dropdown"
        ? (f.dropdown?.value ?? "")
        : f.type === "text"
          ? (f.text?.value ?? "")
          : "",
    ]),
  );
  const studentName = (custom["student_name"] as string) || null;
  const studentGrade = custom["student_grade"]
    ? Number.parseInt(String(custom["student_grade"]), 10)
    : null;

  const priceCents = session.amount_total ?? 0;

  const sub = await stripe.subscriptions.retrieve(stripeSubId);
  const item = sub.items.data[0];
  const stripePriceId = item?.price?.id ?? "";
  const period = periodFrom(sub);

  // Provision the parent's auth user before writing the row so the new user id
  // can be stored as parent_user_id — without it the RLS policy in migration
  // 00049 has nothing to match on and the parent cannot see their own
  // subscription. Best-effort: a provisioning failure must not lose the paid
  // subscription, so we fall back to a null id and a plain login link.
  const provisioned = await provisionParentAccount(parentEmail, parentName);

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("program_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSubId)
    .maybeSingle();

  if (existingErr) {
    console.error(
      "[subscription-webhook] lookup failed for",
      stripeSubId,
      existingErr.message,
    );
    throw new Error(`program_subscriptions lookup: ${existingErr.message}`);
  }

  const record = {
    // Only written when provisioning succeeded, so a failed retry never blanks
    // an id that a previous delivery already stored.
    ...(provisioned.userId ? { parent_user_id: provisioned.userId } : {}),
    parent_email: parentEmail,
    parent_name: parentName,
    student_name: studentName,
    student_grade: studentGrade,
    program_tier: tier,
    price_monthly_cents: priceCents,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubId,
    stripe_price_id: stripePriceId,
    stripe_checkout_session_id: session.id,
    status: sub.status,
    current_period_start: period.start,
    current_period_end: period.end,
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: toIsoNullable(sub.canceled_at),
    metadata: session.metadata ?? {},
  };

  // These writes are the whole point of the webhook. supabase-js resolves with
  // an { error } instead of throwing, so an unchecked call would let a failed
  // write return 200 and Stripe would never retry. Throw to the outer catch.
  const { error: writeErr } = existing
    ? await supabaseAdmin
        .from("program_subscriptions")
        .update(record)
        .eq("id", existing.id)
    : await supabaseAdmin.from("program_subscriptions").insert(record);

  if (writeErr) {
    console.error(
      `[subscription-webhook] ${existing ? "update" : "insert"} failed for`,
      stripeSubId,
      writeErr.message,
    );
    throw new Error(
      `program_subscriptions ${existing ? "update" : "insert"}: ${writeErr.message}`,
    );
  }

  // Send a welcome email with an account-setup magic link (best-effort — the
  // subscription is already recorded, so a mail failure must not 500 and
  // trigger a Stripe retry of the whole handler).
  if (parentEmail) {
    try {
      const subject = `Welcome to MathPivot — set up your ${tier[0].toUpperCase() + tier.slice(1)} Coaching account`;
      const html = welcomeEmailHtml({
        parentName: parentName ?? "there",
        studentName: studentName ?? "your student",
        tier,
        magicLink: provisioned.magicLink ?? `${originFromWebhookHint()}/login`,
      });
      await sendEmail({
        to: parentEmail,
        subject,
        html,
        bcc: "mathpivot@mpingo.ai",
      });
    } catch (e) {
      console.error("[subscription-webhook] welcome email failed:", e);
    }
  }
}

/**
 * Make sure a parent paying for the first time ends up with a usable account.
 *
 * generateLink({ type: "magiclink" }) only works for an email that already has
 * an auth.users row — for a brand-new self-serve parent there is none, so the
 * link came back empty and the welcome email pointed at a login page for an
 * account that did not exist. Create the user first (auto-confirmed, since
 * they just completed payment), then generate the link.
 *
 * Never throws: a subscription that is paid for must be recorded even if
 * account provisioning is having a bad day.
 */
async function provisionParentAccount(
  parentEmail: string,
  parentName: string | null,
): Promise<{ userId: string | null; magicLink: string | null }> {
  if (!parentEmail) return { userId: null, magicLink: null };

  try {
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: parentEmail,
        email_confirm: true,
        user_metadata: {
          ...(parentName ? { full_name: parentName } : {}),
          source: "stripe_subscription_checkout",
        },
      });

    // A repeat customer (or a webhook retry) already has an account — that is
    // an expected outcome here, not a failure.
    const alreadyExists =
      !!createErr &&
      /already (been )?registered|already exists/i.test(createErr.message);
    if (createErr && !alreadyExists) {
      console.error(
        "[subscription-webhook] createUser failed:",
        createErr.message,
      );
    }

    const { data: link, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: parentEmail,
        options: { redirectTo: `${originFromWebhookHint()}/parent` },
      });

    if (linkErr) {
      console.error(
        "[subscription-webhook] generateLink failed:",
        linkErr.message,
      );
    }

    // generateLink echoes back the resolved user, which covers the
    // already-registered case without a second lookup.
    return {
      userId: link?.user?.id ?? created?.user?.id ?? null,
      magicLink: link?.properties?.action_link ?? null,
    };
  } catch (e) {
    console.error("[subscription-webhook] parent provisioning failed:", e);
    return { userId: null, magicLink: null };
  }
}

async function syncSubscriptionState(sub: Stripe.Subscription) {
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("program_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (existingErr) {
    console.error(
      "[subscription-webhook] lookup failed for",
      sub.id,
      existingErr.message,
    );
    throw new Error(`program_subscriptions lookup: ${existingErr.message}`);
  }

  // No row yet — checkout.session.completed has not landed. Nothing to sync.
  if (!existing) return;

  const period = periodFrom(sub);

  const { error: syncErr } = await supabaseAdmin
    .from("program_subscriptions")
    .update({
      status: sub.status,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: toIsoNullable(sub.canceled_at),
    })
    .eq("id", existing.id);

  if (syncErr) {
    console.error(
      "[subscription-webhook] state sync failed for",
      sub.id,
      syncErr.message,
    );
    throw new Error(`program_subscriptions sync: ${syncErr.message}`);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = subscriptionIdFromInvoice(invoice);
  if (!subId) return;

  const { error: pastDueErr } = await supabaseAdmin
    .from("program_subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subId);

  if (pastDueErr) {
    console.error(
      "[subscription-webhook] past_due update failed for",
      subId,
      pastDueErr.message,
    );
    throw new Error(`program_subscriptions past_due: ${pastDueErr.message}`);
  }
}

/**
 * Read the current billing period off a subscription.
 *
 * Verified against this account with `stripe subscriptions list --limit 1`:
 * under both the SDK's pinned 2025-12-15.clover and the account default
 * 2026-05-27.dahlia, `current_period_start` / `current_period_end` exist only
 * on `items.data[0]` — there is no field of either name at the subscription
 * root. Reading the root is what was writing null to both columns on every row.
 *
 * The root fallback is kept because webhook payloads render at the API version
 * configured on the endpoint, not at the SDK's pinned apiVersion, and those two
 * drift independently — an endpoint still pinned pre-Basil sends the old shape.
 */
function periodFrom(sub: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const item = sub.items?.data?.[0] as
    | {
        current_period_start?: number;
        current_period_end?: number;
      }
    | undefined;
  const legacy = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    start: toIsoNullable(
      item?.current_period_start ?? legacy.current_period_start,
    ),
    end: toIsoNullable(item?.current_period_end ?? legacy.current_period_end),
  };
}

/**
 * Read the subscription id off an invoice.
 *
 * Verified against this account with `stripe invoices list --limit 1`: the
 * invoice has no `subscription` property at the root at all — it lives at
 * `parent.subscription_details.subscription`. Reading the root returned
 * undefined, so handleInvoicePaymentFailed returned early every time and
 * `past_due` was never set: a failed payment left the row reading `active`
 * indefinitely. Root is kept as a fallback for older endpoint API versions.
 */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const withParent = invoice as unknown as {
    parent?: {
      subscription_details?: { subscription?: string | { id: string } };
    };
    subscription?: string | { id: string };
  };

  const raw =
    withParent.parent?.subscription_details?.subscription ??
    withParent.subscription;

  if (!raw) return null;
  return typeof raw === "string" ? raw : raw.id;
}

function toIsoNullable(epochSeconds: number | null | undefined): string | null {
  if (!epochSeconds) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

function originFromWebhookHint(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.SITE_URL ??
    "https://www.mathpivot.com"
  );
}

function welcomeEmailHtml(args: {
  parentName: string;
  studentName: string;
  tier: ProgramTier;
  magicLink: string;
}): string {
  // Derived from PROGRAMS so a tier rename cannot leave this email announcing
  // a tier that no longer exists. The hardcoded ternary this replaces had no
  // branch for "advanced" and fell through to "Elite Coaching", so every
  // Advanced parent was welcomed to a program the product no longer sells.
  const tierName = PROGRAMS[args.tier].displayName;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#334155;background:#fff;">
      <div style="background:#1D4ED8;padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
        <div style="display:inline-block;background:#fff;color:#1D4ED8;font-weight:bold;width:44px;height:44px;line-height:44px;border-radius:10px;font-size:20px;">M</div>
        <p style="color:#fff;font-weight:bold;font-size:20px;margin:10px 0 0;">MathPivot</p>
        <p style="color:#bfdbfe;font-size:12px;margin:4px 0 0;letter-spacing:.5px;">Mathematics Coaching Academy</p>
      </div>
      <div style="padding:28px 24px;">
        <p style="font-size:16px;color:#1e293b;margin:0;">Hi ${args.parentName},</p>
        <p style="font-size:15px;color:#475569;margin:12px 0 0;line-height:1.6;">
          Welcome to MathPivot. Your enrollment in <strong>${tierName}</strong> for
          ${args.studentName} is confirmed. We're excited to get started.
        </p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${args.magicLink}" style="display:inline-block;background:#1D4ED8;color:#fff;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
            Set Up Your Parent Account
          </a>
          <p style="font-size:12px;color:#64748b;margin:10px 0 0;">This link is single-use. If it expires, request a new one at mathpivot.com/login.</p>
        </div>
        <p style="font-size:15px;color:#1e293b;margin:24px 0 8px;font-weight:bold;">What happens next</p>
        <ol style="font-size:14px;color:#475569;padding-left:20px;margin:0;line-height:1.7;">
          <li>Our team reviews ${args.studentName}'s intake and matches a dedicated math coach.</li>
          <li>You'll receive a scheduling link within 1 business day to book the first coaching meeting.</li>
          <li>${args.studentName} joins a micro-cohort (5-6 students target) with a shared coach.</li>
        </ol>
        <p style="font-size:13px;color:#64748b;margin:24px 0 0;">
          Billing note: Your monthly billing has started. Manage or cancel anytime from your parent dashboard.
        </p>
      </div>
      <div style="background:#f8fafc;padding:16px 24px;border-radius:0 0 12px 12px;text-align:center;">
        <p style="font-size:12px;color:#94a3b8;margin:0;">Questions? Reply to this email or contact mathpivot@mpingo.ai</p>
      </div>
    </div>
  `;
}
