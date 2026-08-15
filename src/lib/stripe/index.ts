import "server-only";
import Stripe from "stripe";

// Fail at module load, not in front of a paying parent. A missing or malformed
// key used to warn and export null, which turned a configuration mistake into a
// runtime 500 at checkout — exactly how a publishable key reached production
// and broke POST /enroll/acceleration. Throwing here breaks the build instead.
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Stripe cannot be initialised.",
  );
}

if (!/^(sk|rk)_(test|live)_/.test(secretKey)) {
  throw new Error(
    `STRIPE_SECRET_KEY has an invalid prefix (got "${secretKey.slice(0, 3)}..."). ` +
      "Expected a secret (sk_) or restricted (rk_) key — a publishable (pk_) key will " +
      "be rejected by the Stripe API at request time.",
  );
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

/**
 * Retained as a no-op so existing call sites need not change. `stripe` is now
 * non-nullable — if the key were missing or malformed this module would have
 * thrown at import time and nothing downstream would run at all.
 */
export function isStripeConfigured(): boolean {
  return true;
}

// Each Stripe webhook endpoint gets its own signing secret from the dashboard.
// /api/stripe/webhook (one-time credit purchases) uses STRIPE_WEBHOOK_SECRET;
// /api/stripe/subscription-webhook uses STRIPE_SUBSCRIPTION_WEBHOOK_SECRET.
// Sharing one value between them means only one endpoint can ever verify.
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_SUBSCRIPTION_WEBHOOK_SECRET =
  process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

/**
 * Create a Stripe Checkout session for purchasing credits
 */
export async function createCheckoutSession({
  productId,
  familyId,
  userId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  productId: string;
  familyId: string;
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string } | null> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      product_id: productId,
      family_id: familyId,
      user_id: userId,
    },
    client_reference_id: familyId,
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Retrieve a Stripe Checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Create a Stripe product and price (for admin use)
 */
export async function createStripeProduct({
  name,
  description,
  priceCents,
  credits,
}: {
  name: string;
  description?: string;
  priceCents: number;
  credits: number;
}): Promise<{ productId: string; priceId: string }> {
  const product = await stripe.products.create({
    name,
    description: description || `${credits} tutoring credits`,
    metadata: {
      credits: credits.toString(),
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceCents,
    currency: "usd",
  });

  return {
    productId: product.id,
    priceId: price.id,
  };
}

function verifyWithSecret(
  payload: string | Buffer,
  signature: string,
  secret: string | undefined,
  label: string,
): Stripe.Event | null {
  if (!secret) {
    console.error(`${label}: signing secret env var is not set`);
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error(`${label}: signature verification failed:`, err);
    return null;
  }
}

/**
 * Construct a webhook event for the credit-purchase endpoint
 * (/api/stripe/webhook), verified with STRIPE_WEBHOOK_SECRET.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event | null {
  return verifyWithSecret(
    payload,
    signature,
    STRIPE_WEBHOOK_SECRET,
    "STRIPE_WEBHOOK_SECRET",
  );
}

/**
 * Construct a webhook event for the program-subscription endpoint
 * (/api/stripe/subscription-webhook), verified with
 * STRIPE_SUBSCRIPTION_WEBHOOK_SECRET.
 */
export function constructSubscriptionWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event | null {
  return verifyWithSecret(
    payload,
    signature,
    STRIPE_SUBSCRIPTION_WEBHOOK_SECRET,
    "STRIPE_SUBSCRIPTION_WEBHOOK_SECRET",
  );
}
