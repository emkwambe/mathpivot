# Sprint MP-S1 — Stripe Single-Writer Refactor

**Product:** MathPivot (mathpivot.com)
**Status:** Ready for execution
**Owner:** Eddy Mkwambe
**Workflow:** Claude Chat (this doc) → Claude Code (execution) → Eddy (verify + deploy)

---

## Intention

Checkout is the highest-stakes surface MathPivot has. A parent decides to pay, and in the next eight seconds either the platform earns trust or loses it permanently. Right now that surface is fragile in a way that blocks forward motion on curriculum work — which is the actual cost, larger than the bug itself.

This sprint does not add features. It removes the structural reason Stripe integration keeps consuming attention, so that the next tier, the next coupon, the next annual plan costs one line instead of one weekend.

## Context

Three tiers (Foundation / Acceleration / Elite) on Stripe subscriptions. The current integration writes subscription state from multiple call sites — the checkout success redirect, the webhook handler, and client-side refresh paths. Those writers disagree because:

1. **Stripe does not guarantee webhook delivery order.** A `customer.subscription.updated` can land before `checkout.session.completed`. Order-dependent handlers corrupt state when this happens, and it happens more under load, not less.
2. **Per-event branching scales multiplicatively.** Each event type × each tier × each transition (new / upgrade / downgrade / cancel / past_due) is a distinct code path. Three tiers already means the handler is holding ~18 combinations.
3. **API version drift on period fields.** As of API version `2025-03-31.basil`, `current_period_start` and `current_period_end` moved from the Subscription object onto **subscription items**. Any code reading `subscription.current_period_end` now silently receives `undefined`, writes null, and breaks entitlement checks downstream. This is the likely origin of the previously observed null period fields.
4. **Edge runtime tax.** The Stripe SDK assumes Node `http` and Node `crypto`. On Edge, signature verification requires the async variant plus an explicitly supplied SubtleCrypto provider. Edge buys nothing on a route whose latency is dominated by a round trip to Stripe.

## Architectural decision (ADR-MP-003)

**Decision:** All Stripe-derived subscription state in MathPivot is written by exactly one function, `syncStripeSubscription(customerId)`. No other code path writes to the subscription table.

**Mechanism:** The function ignores the webhook payload entirely. It takes only a Stripe customer ID, re-fetches authoritative state from the Stripe API, and upserts one row. Because it re-reads truth rather than applying a delta, it is idempotent and order-independent.

**Consequences:**
- Webhook handlers become: verify signature → extract customer ID → call sync → return 200.
- Out-of-order and duplicate webhook deliveries become harmless by construction.
- Adding a tier is one entry in `tierFromPriceId`. Nothing else changes.
- Cost: one extra Stripe API read per webhook. Negligible, and it is the price of correctness.

**Rejected alternative:** Trusting webhook payload bodies and applying deltas per event type. Faster, but reintroduces order-dependence and the multiplicative branching that caused this sprint.

**Supersedes:** any prior implicit contract that the success redirect writes subscription state independently.

---

## Action

### Task 1 — Pin runtime to Node on all Stripe routes

Add to the top of the checkout-session route, the webhook route, and the portal route:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

This eliminates the entire Edge crypto/http compatibility category. Do not skip this because "it currently works" — it works until it doesn't, non-deterministically.

### Task 2 — Create the Stripe customer at signup, not at checkout

Creating the customer at checkout time means a double-click or retry produces two Stripe customers for one MathPivot user, after which entitlement lookups are a coin flip.

On user creation, create the Stripe customer immediately and persist `stripeCustomerId` on the user row. At checkout, pass `customer: user.stripeCustomerId` — never `customer_email`.

If existing users lack a `stripeCustomerId`, write a one-time backfill script that reconciles by email and reports collisions rather than guessing.

### Task 3 — Implement the single writer

`lib/stripe/sync.ts`:

```ts
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const TIER_BY_PRICE: Record<string, 'foundation' | 'acceleration' | 'elite'> = {
  [process.env.STRIPE_PRICE_FOUNDATION!]: 'foundation',
  [process.env.STRIPE_PRICE_ACCELERATION!]: 'acceleration',
  [process.env.STRIPE_PRICE_ELITE!]: 'elite',
};

function tierFromPriceId(priceId: string) {
  const tier = TIER_BY_PRICE[priceId];
  if (!tier) {
    console.error('[stripe] unmapped price id', priceId);
    return 'free' as const;
  }
  return tier;
}

// Entitlement is granted for these statuses only.
const ENTITLED = new Set(['active', 'trialing']);

export async function syncStripeSubscription(customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 1,
  });

  if (subs.data.length === 0) {
    const none = {
      subscriptionId: null,
      status: 'none',
      priceId: null,
      tier: 'free' as const,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      entitled: false,
    };
    return db.subscription.upsert({
      where: { stripeCustomerId: customerId },
      create: { stripeCustomerId: customerId, ...none },
      update: none,
    });
  }

  const sub = subs.data[0];
  const item = sub.items.data[0];

  // API >= 2025-03-31.basil: period fields live on the ITEM, not the subscription.
  const periodEnd = item.current_period_end;

  const state = {
    subscriptionId: sub.id,
    status: sub.status,
    priceId: item.price.id,
    tier: ENTITLED.has(sub.status) ? tierFromPriceId(item.price.id) : ('free' as const),
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    entitled: ENTITLED.has(sub.status),
  };

  return db.subscription.upsert({
    where: { stripeCustomerId: customerId },
    create: { stripeCustomerId: customerId, ...state },
    update: state,
  });
}
```

Note the deliberate choice: tier is derived, and downgraded to `free` whenever status is not entitled. Entitlement checks elsewhere in MathPivot read `tier` and never re-derive from status. One source of truth, one read.

### Task 4 — Reduce the webhook handler to a router

`app/api/stripe/webhook/route.ts`:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { syncStripeSubscription } from '@/lib/stripe/sync';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const RELEVANT = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.paid',
  'invoice.payment_failed',
]);

export async function POST(req: Request) {
  const raw = await req.text(); // MUST be raw. Never req.json() on this route.
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[stripe] signature verification failed', err);
    return new Response('invalid signature', { status: 400 });
  }

  if (!RELEVANT.has(event.type)) {
    return new Response(null, { status: 200 });
  }

  const customerId = (event.data.object as any).customer as string | undefined;
  if (!customerId) {
    console.error('[stripe] event without customer', event.type, event.id);
    return new Response(null, { status: 200 }); // ack, do not retry-loop
  }

  try {
    await syncStripeSubscription(customerId);
  } catch (err) {
    console.error('[stripe] sync failed', event.id, err);
    return new Response('sync failed', { status: 500 }); // let Stripe retry
  }

  return new Response(null, { status: 200 });
}
```

Two rules that are easy to get wrong: return **200 on events you cannot act on** so Stripe does not retry forever, and return **500 only on transient failures** you actually want retried.

### Task 5 — Close the post-checkout perception gap

The success page calls the same sync function server-side before rendering — not as a second writer, as the same writer invoked from a second place.

```ts
// app/checkout/success/page.tsx  (server component)
export const dynamic = 'force-dynamic';

export default async function SuccessPage() {
  const user = await getCurrentUser();
  if (user?.stripeCustomerId) {
    await syncStripeSubscription(user.stripeCustomerId);
  }
  // render entitled state from DB
}
```

This removes the window where a parent pays, lands back on MathPivot, and sees the free tier because the webhook is three seconds behind. That moment is what makes checkout *feel* broken even when the backend is correct.

### Task 6 — Hosted Customer Portal for everything post-purchase

Do not build upgrade, downgrade, cancel, or payment-method UI. One route:

```ts
const session = await stripe.billingPortal.sessions.create({
  customer: user.stripeCustomerId,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
});
return Response.redirect(session.url, 303);
```

Configure allowed plan switches inside the Stripe Dashboard portal settings. Every hour spent building subscription management UI is an hour not spent on the Math Fundamentals spine.

### Task 7 — Local dev loop

Stop testing against production. Two PowerShell terminals:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET` — this is a **different secret** from the production endpoint's. Mixing them produces exactly the intermittent signature failures that feel haunted.

```powershell
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

Test cards: `4242 4242 4242 4242` for the happy path, `4000 0025 0000 3155` to exercise 3DS authentication, `4000 0000 0000 0341` to force a post-attach payment failure.

### Task 8 — Smoke test in the DoD

Add `npm run smoke:stripe` driving, against test mode: signup → customer exists in Stripe → Foundation checkout → entitlement is `foundation` within 5s → portal upgrade to Elite → entitlement is `elite` → cancel → entitlement is `free` after period end simulation. Assert on the DB row, not the UI.

---

## Definition of Done

- [ ] `runtime = 'nodejs'` on checkout, webhook, and portal routes
- [ ] Stripe customer created at signup; `stripeCustomerId` persisted on user
- [ ] Backfill script run; collision report reviewed and resolved
- [ ] `syncStripeSubscription` is the **only** function writing the subscription table (verified by grep for other write call sites)
- [ ] Period fields read from `subscription.items.data[0]`, not the subscription object
- [ ] Webhook handler contains zero per-tier branching
- [ ] Webhook route reads `req.text()`; no JSON parsing anywhere upstream of it
- [ ] Success page calls the sync before render
- [ ] Customer Portal live; no custom subscription-management UI remains
- [ ] Stripe CLI local loop documented in repo README
- [ ] `npm run smoke:stripe` passes against test mode
- [ ] Production webhook endpoint URL confirmed **not** behind Vercel Deployment Protection (a protected URL returns 401 and Stripe will auto-disable the endpoint)
- [ ] `STRIPE_WEBHOOK_SECRET` in Vercel production env confirmed to be the production endpoint secret, not the CLI secret
- [ ] All three price IDs present as env vars in Vercel production
- [ ] `vercel deploy --prod`
- [ ] `npm run smoke` green post-deploy
- [ ] One real card transaction on Foundation, verified end to end, then refunded

## Results (fill on completion)

- Webhook handler LOC before / after:
- Distinct subscription-table write sites before / after:
- Time to add a hypothetical fourth tier:
- Observed post-checkout entitlement latency:

---

## Claude Code execution prompt

```
Refactor MathPivot's Stripe integration to a single-writer architecture per
ADR-MP-003. Read the full sprint doc at
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-STRIPE-SINGLE-WRITER.md first.

Do not begin editing until you have completed a discovery pass and reported:
  1. Every file that currently writes subscription/entitlement state to the DB.
  2. Every route with Edge runtime that touches Stripe.
  3. Every read of `current_period_end` or `current_period_start` and whether
     it reads from the subscription object (WRONG) or the item (CORRECT).
  4. The current Stripe apiVersion pinned in the codebase.
  5. Where the Stripe customer is currently created.

Then execute Tasks 1-8 in order. After each task, stop and report what changed.

Constraints:
- Windows PowerShell only. Absolute paths in all commands. No `cd` prerequisites.
- BOM-free UTF-8 writes: use [System.IO.File]::WriteAllText().
- TypeScript strict. No `any` except where narrowing a Stripe event payload,
  and comment why.
- Do NOT deploy. Do NOT run `vercel deploy --prod`. Eddy verifies and deploys.
- Do NOT modify curriculum, lesson, or content code. Billing surface only.
- If you find a subscription write site not listed in the sprint doc, stop and
  report it rather than guessing at its intent.

Definition of Done is the checklist in the sprint doc. Report each item as
done / not done / blocked with reason. Do not mark an item done that you have
not actually verified.
```
