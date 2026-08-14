import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "STRIPE_SECRET_KEY not set - Stripe functionality will be disabled",
  );
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    })
  : null;

export function isStripeConfigured(): boolean {
  return !!stripe;
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
  if (!stripe) {
    console.warn("Stripe not configured");
    return null;
  }

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
  if (!stripe) return null;
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
}): Promise<{ productId: string; priceId: string } | null> {
  if (!stripe) return null;

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
  if (!stripe) return null;
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
