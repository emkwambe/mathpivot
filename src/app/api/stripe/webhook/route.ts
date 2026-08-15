import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { constructWebhookEvent, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { emitEvent } from "@/lib/events";
import { sendPurchaseConfirmation } from "@/lib/notifications";

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
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const event = constructWebhookEvent(body, signature);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Claim the event before doing any work. The insert itself is the lock: a
  // SELECT-then-INSERT would race between concurrent deliveries, whereas the
  // unique constraint on stripe_event_id lets exactly one delivery win.
  // Without this, a Stripe retry re-enters handleCheckoutCompleted and adds
  // product.credits to families.credit_balance a second time.
  const { error: claimErr } = await supabaseAdmin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload_json: event.data.object as unknown as Record<string, unknown>,
    });

  if (claimErr) {
    // 23505 = unique_violation: this event.id was already claimed by a prior
    // delivery. Ack with 200 so Stripe stops retrying; do not re-run handlers.
    if (claimErr.code === "23505") {
      return NextResponse.json({ received: true, deduped: true });
    }
    // supabase-js resolves with { error } rather than throwing, so this call
    // previously failed silently and the audit trail simply had gaps.
    console.error("[webhook] could not claim event:", claimErr.message);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      case "checkout.session.expired": {
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      case "payment_intent.payment_failed": {
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    const { error: processedErr } = await supabaseAdmin
      .from("stripe_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    if (processedErr) {
      console.error(
        "[webhook] could not stamp processed_at:",
        processedErr.message,
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);

    // Record error. The event stays claimed with processed_at IS NULL and a
    // non-null error_message — that pair is the recovery signal for a handler
    // that died mid-way and needs a manual replay.
    const { error: recordErr } = await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("stripe_event_id", event.id);

    if (recordErr) {
      console.error(
        "[webhook] could not record error_message:",
        recordErr.message,
      );
    }

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Mirror guard: the subscription flow has its own endpoint and handler. If
  // this endpoint is ever subscribed to subscription events, ignore them here
  // rather than looking for a credits purchase that will never exist.
  if (
    session.mode === "subscription" ||
    session.metadata?.flow === "program_subscription"
  ) {
    return;
  }

  const { product_id, family_id, user_id } = session.metadata || {};

  if (!product_id || !family_id) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Find the pending purchase by Stripe session ID
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("*")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (!purchase) {
    console.error("Purchase not found for session:", session.id);
    return;
  }

  // Get product to know how many credits to add
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("credits")
    .eq("id", product_id)
    .single();

  if (!product) {
    console.error("Product not found:", product_id);
    return;
  }

  // Update purchase status
  await supabaseAdmin
    .from("purchases")
    .update({
      status: "completed",
      stripe_payment_intent_id: session.payment_intent as string,
      paid_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);

  // Add credits to family
  const { data: family } = await supabaseAdmin
    .from("families")
    .select("credit_balance")
    .eq("id", family_id)
    .single();

  const newBalance = (family?.credit_balance || 0) + product.credits;

  await supabaseAdmin
    .from("families")
    .update({ credit_balance: newBalance })
    .eq("id", family_id);

  // Create credit ledger entry
  await supabaseAdmin.from("credit_ledger").insert({
    family_id,
    transaction_type: "purchase",
    amount: product.credits,
    balance_after: newBalance,
    reference_type: "purchase",
    reference_id: purchase.id,
    description: `Purchased ${product.credits} credits`,
  });

  // Emit success event
  await emitEvent({
    type: "payment.succeeded.v1",
    actorUserId: user_id || null,
    subjectType: "purchase",
    subjectId: purchase.id,
    data: {
      purchase_id: purchase.id,
      family_id,
      product_id,
      credits_added: product.credits,
      amount_cents: session.amount_total,
      stripe_session_id: session.id,
    },
  });

  // Send purchase confirmation (fire and forget)
  sendPurchaseConfirmation(purchase.id).catch((err) =>
    console.error("[notifications] purchase:", err),
  );

  // Emit credits added event
  await emitEvent({
    type: "credits.added.v1",
    actorUserId: null,
    subjectType: "credit_ledger",
    subjectId: purchase.id,
    data: {
      family_id,
      credits: product.credits,
      new_balance: newBalance,
      source: "purchase",
    },
  });

  console.log(
    `Payment successful: ${product.credits} credits added to family ${family_id}`,
  );
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Find and update the pending purchase
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (purchase) {
    await supabaseAdmin
      .from("purchases")
      .update({ status: "failed" })
      .eq("id", purchase.id);

    await emitEvent({
      type: "payment.failed.v1",
      actorUserId: null,
      subjectType: "purchase",
      subjectId: purchase.id,
      data: {
        purchase_id: purchase.id,
        reason: "checkout_expired",
        stripe_session_id: session.id,
      },
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find purchase by payment intent
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .single();

  if (purchase) {
    await supabaseAdmin
      .from("purchases")
      .update({ status: "failed" })
      .eq("id", purchase.id);

    await emitEvent({
      type: "payment.failed.v1",
      actorUserId: null,
      subjectType: "purchase",
      subjectId: purchase.id,
      data: {
        purchase_id: purchase.id,
        reason: paymentIntent.last_payment_error?.message || "payment_failed",
        stripe_payment_intent_id: paymentIntent.id,
      },
    });
  }
}
