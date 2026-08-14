import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import {
  stripe,
  constructWebhookEvent,
  isStripeConfigured,
} from "@/lib/stripe";
import { isValidTier, type ProgramTier } from "@/lib/stripe/programs";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

// Force this to run in the Node runtime so we get the raw body.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
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

  const event = constructWebhookEvent(body, signature);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Best-effort audit log; ignore failure if table doesn't exist.
  try {
    await supabaseAdmin.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload_json: event.data.object as unknown as Record<string, unknown>,
    });
  } catch (e) {
    console.warn("[subscription-webhook] audit log skipped:", e);
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

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[subscription-webhook] handler error:", err);
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
  if (!tierRaw || !isValidTier(tierRaw)) {
    console.error("[subscription-webhook] invalid tier on session", session.id);
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

  const sub = await stripe!.subscriptions.retrieve(stripeSubId);
  const item = sub.items.data[0];
  const stripePriceId = item?.price?.id ?? "";

  const { data: existing } = await supabaseAdmin
    .from("program_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSubId)
    .maybeSingle();

  const record = {
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
    current_period_start: toIsoNullable(
      (sub as unknown as { current_period_start?: number })
        .current_period_start,
    ),
    current_period_end: toIsoNullable(
      (sub as unknown as { current_period_end?: number }).current_period_end,
    ),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: toIsoNullable(sub.canceled_at),
    metadata: session.metadata ?? {},
  };

  if (existing) {
    await supabaseAdmin
      .from("program_subscriptions")
      .update(record)
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("program_subscriptions").insert(record);
  }

  // Send a welcome email with a password-setup magic link (best-effort).
  if (parentEmail) {
    try {
      const { data: link, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: parentEmail,
          options: {
            redirectTo: `${originFromWebhookHint()}/parent`,
          },
        });

      const magic = link?.properties?.action_link;
      const subject = `Welcome to MathPivot — set up your ${tier[0].toUpperCase() + tier.slice(1)} Coaching account`;
      const html = welcomeEmailHtml({
        parentName: parentName ?? "there",
        studentName: studentName ?? "your student",
        tier,
        magicLink: magic ?? `${originFromWebhookHint()}/login`,
      });
      await sendEmail({
        to: parentEmail,
        subject,
        html,
        bcc: "mathpivot@mpingo.ai",
      });
      if (linkErr) console.warn("[subscription-webhook] magic link:", linkErr);
    } catch (e) {
      console.error("[subscription-webhook] welcome email failed:", e);
    }
  }
}

async function syncSubscriptionState(sub: Stripe.Subscription) {
  const { data: existing } = await supabaseAdmin
    .from("program_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (!existing) return;

  await supabaseAdmin
    .from("program_subscriptions")
    .update({
      status: sub.status,
      current_period_start: toIsoNullable(
        (sub as unknown as { current_period_start?: number })
          .current_period_start,
      ),
      current_period_end: toIsoNullable(
        (sub as unknown as { current_period_end?: number }).current_period_end,
      ),
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: toIsoNullable(sub.canceled_at),
    })
    .eq("id", existing.id);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = (invoice as unknown as { subscription?: string }).subscription;
  if (!subId) return;
  await supabaseAdmin
    .from("program_subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subId);
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
  const tierName =
    args.tier === "foundation"
      ? "Foundation Coaching"
      : args.tier === "acceleration"
        ? "Acceleration Coaching"
        : "Elite Coaching";
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
