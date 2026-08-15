# Sprint: Stripe Hardening — MathPivot

**Context:** Production `STRIPE_SECRET_KEY` held a publishable key, causing `500` on
`POST /enroll/acceleration`. Replaced and redeployed. Audit then surfaced four further
defects, one of which is silently dropping every paid subscription.

**Repo:** `C:\Users\HP\Documents\mathpivot`

---

## S1 — Restore subscription webhook verification (P0, revenue-affecting)

`constructSubscriptionWebhookEvent` verifies against `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`.
That variable does not exist in Vercel Production. Every delivery to
`/api/stripe/subscription-webhook` returns `400 Invalid signature`, so no
`program_subscriptions` row, no parent auth user, no welcome email — for any paying customer.

1. Stripe Dashboard → Developers → Webhooks → subscription endpoint → reveal signing secret.
   If the endpoint does not exist, create it against
   `https://www.mathpivot.com/api/stripe/subscription-webhook` subscribed to:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`.

2. Add the secret and redeploy:

```powershell
vercel env add STRIPE_SUBSCRIPTION_WEBHOOK_SECRET production
```

```powershell
vercel deploy --prod --cwd "C:\Users\HP\Documents\mathpivot"
```

3. Replay failed deliveries from the endpoint page so past customers are provisioned
   retroactively.

**Endpoint / event ownership.** Both routes handle `checkout.session.completed`. Keep them
separate but ensure each Stripe endpoint subscribes only to its own events — the credits
endpoint must NOT be subscribed to subscription events, and vice versa. The subscription
handler already guards with `session.mode !== "subscription"` and
`metadata.flow !== "program_subscription"`; add the mirror guard to the credits handler.

---

## S2 — Fail fast on bad configuration

The current module warns and exports `null`, which converts a config error into a runtime
500 in front of a paying parent. That is exactly how the publishable-key bug reached
production. A malformed key should break the build, not the checkout.

Replace `src/lib/stripe/index.ts` header:

```ts
import "server-only";
import Stripe from "stripe";

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

export function isStripeConfigured(): boolean {
  return true;
}
```

`import "server-only"` makes the module un-importable from a client component, so the
secret can never be bundled into browser JS.

Because `stripe` is no longer nullable, drop the `!` assertions and `if (!stripe)` guards
in both routes and in `subscription-checkout.ts`. Keep `isStripeConfigured()` exported as
a no-op so call sites need not change in this sprint.

**Trade-off to accept deliberately:** a missing key now fails the build. That is the point.
If any preview branch lacks the var, it will fail loudly instead of shipping a broken
checkout.

---

## S3 — Idempotency: dedupe on `event.id`

Neither route guards against redelivery. `stripe_webhook_events` is written but
`processed_at` is never read back. Stripe retries on any non-2xx and occasionally
redelivers on its own. In `handleCheckoutCompleted` a retry re-enters the credit grant and
adds `product.credits` to `families.credit_balance` a second time. The error path returns
`500` *after* credits may already be applied, guaranteeing a retry into a double-grant.

A `SELECT` then `INSERT` is not sufficient — concurrent deliveries race. Use a unique
constraint and let the insert itself be the lock.

Migration:

```sql
-- supabase/migrations/<timestamp>_stripe_event_dedupe.sql
alter table public.stripe_webhook_events
  add constraint stripe_webhook_events_event_id_key unique (stripe_event_id);

create index if not exists stripe_webhook_events_processed_idx
  on public.stripe_webhook_events (processed_at);
```

Guard, placed immediately after signature verification in **both** routes:

```ts
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
  console.error("[webhook] could not claim event:", claimErr.message);
  return NextResponse.json({ error: "Claim failed" }, { status: 500 });
}
```

Note this claims *before* processing, so a handler that crashes mid-way leaves the event
claimed but unprocessed. That is the correct trade for money movement — a stuck event is
recoverable by manual replay; a double credit grant is not. The `processed_at` stamp and
`error_message` write already present in `webhook/route.ts` become the recovery signal:
rows with `processed_at IS NULL` and a non-null `error_message` need attention.

Also fix the unchecked audit insert in `webhook/route.ts` — supabase-js resolves with an
`{ error }` rather than throwing, so the current call can fail silently. The
subscription route already handles this correctly and is the model to follow.

---

## S4 — Subscription period fields returning null

`(sub as unknown as { current_period_start?: number }).current_period_start` compiles but
reads `undefined` if the field moved onto subscription items in the pinned API version,
writing `null` to `current_period_start` / `current_period_end` on every row.

Verify before changing:

```powershell
stripe subscriptions list --limit 1
```

If the field sits under `items.data[0]`, extract from the item:

```ts
function periodFrom(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0] as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  } | undefined;
  const legacy = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  return {
    start: toIsoNullable(item?.current_period_start ?? legacy.current_period_start),
    end: toIsoNullable(item?.current_period_end ?? legacy.current_period_end),
  };
}
```

The fallback keeps the code correct across either API version, which matters because
**webhook payloads render at the version configured on the endpoint**, not at the SDK's
pinned `apiVersion`. Those two can drift independently.

Apply the same check to `handleInvoicePaymentFailed`: `invoice.subscription` may now live
at `invoice.parent.subscription_details.subscription`. If it does, the function returns
early and `past_due` is never set — failed payments look active indefinitely.

---

## S5 — Environment parity

Production is fixed; local and preview are not.

- `.env.local` declares `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as empty and has
  no `STRIPE_PRICE_ID_*` at all. Fill with test-mode values.
- Confirm Preview and Development were not seeded with the same publishable key that broke
  Production:

```powershell
vercel env ls
```

- Local webhook secret comes from the listener, and differs from Production's:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/subscription-webhook
```

---

## Definition of Done

- [ ] `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` set in Production; new deploy aliased to `www`
- [ ] Subscription endpoint exists in Stripe with the five events subscribed
- [ ] Failed deliveries replayed; affected parents have `program_subscriptions` rows
- [ ] `src/lib/stripe/index.ts` throws on missing/invalid key prefix and imports `server-only`
- [ ] Null-guards removed from both routes and `subscription-checkout.ts`; `tsc` clean
- [ ] Unique constraint migration applied; duplicate `stripe trigger` of the same event
      yields exactly one credit grant
- [ ] `current_period_start` / `current_period_end` non-null on a freshly created test subscription
- [ ] `invoice.payment_failed` sets `status = 'past_due'` on the correct row
- [ ] `.env.local` populated; full checkout runs end to end on `localhost:3000`
- [ ] Preview/Development env vars verified
- [ ] `POST /enroll/acceleration` redirects to `checkout.stripe.com` in production
- [ ] `vercel deploy --prod` followed by smoke test

---

## Verification commands

```powershell
stripe trigger checkout.session.completed
```

```powershell
stripe trigger customer.subscription.deleted
```

```powershell
vercel logs https://www.mathpivot.com --since 15m
```

Test cards: `4242 4242 4242 4242` success, `4000 0000 0000 9995` insufficient funds,
`4000 0025 0000 3155` 3DS challenge required.
