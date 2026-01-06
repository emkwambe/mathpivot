import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set - Stripe functionality will be disabled');
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

export function isStripeConfigured(): boolean {
  return !!stripe;
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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
    console.warn('Stripe not configured');
    return null;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
    currency: 'usd',
  });

  return {
    productId: product.id,
    priceId: price.id,
  };
}

/**
 * Construct webhook event from raw body and signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return null;

  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
}
