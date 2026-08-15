import { stripe } from "./index";
import { priceIdForTier, type ProgramTier } from "./programs";

export interface CreateSubscriptionCheckoutOptions {
  tier: ProgramTier;
  successUrl: string;
  cancelUrl: string;
  parentEmail?: string;
  metadata?: Record<string, string>;
}

export async function createSubscriptionCheckout({
  tier,
  successUrl,
  cancelUrl,
  parentEmail,
  metadata,
}: CreateSubscriptionCheckoutOptions): Promise<
  { url: string; sessionId: string } | { error: string }
> {
  const priceId = priceIdForTier(tier);
  if (!priceId) {
    return {
      error: `Missing STRIPE_PRICE_ID for ${tier}. Set it in Vercel env vars.`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: "required",
    customer_email: parentEmail,
    customer_creation: parentEmail ? undefined : "always",
    success_url: successUrl,
    cancel_url: cancelUrl,
    custom_fields: [
      {
        key: "student_name",
        label: { type: "custom", custom: "Student's full name" },
        type: "text",
        text: { minimum_length: 1, maximum_length: 120 },
      },
      {
        key: "student_grade",
        label: { type: "custom", custom: "Student's grade" },
        type: "dropdown",
        dropdown: {
          options: [
            { label: "Grade 6", value: "6" },
            { label: "Grade 7", value: "7" },
            { label: "Grade 8", value: "8" },
            { label: "Grade 9", value: "9" },
            { label: "Grade 10", value: "10" },
            { label: "Grade 11", value: "11" },
            { label: "Grade 12", value: "12" },
          ],
        },
      },
    ],
    subscription_data: {
      metadata: {
        program_tier: tier,
        ...(metadata ?? {}),
      },
    },
    metadata: {
      program_tier: tier,
      flow: "program_subscription",
      ...(metadata ?? {}),
    },
  });

  if (!session.url) return { error: "Stripe returned no checkout URL" };

  return { url: session.url, sessionId: session.id };
}
