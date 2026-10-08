# MathPivot Stripe — Challenge / Solution Plan

**Goal:** Working, trustworthy Stripe checkout for three coaching tiers
(Foundation, Acceleration, Elite).

**Current state:** Two root-cause defects fixed and deployed. Neither has been
verified with a real transaction. Two further defects fixed in code, also
unverified. Historical customer damage not yet remediated.

Ordering principle: verify before building, remediate customers before polishing
code, and defer anything that does not touch money or trust.

---

## Phase 0 — Verify what is already deployed

Nothing below Phase 0 should start until this passes, because a failure here
changes what the rest of the plan even is.

### C0.1 — Checkout has never been confirmed working

**Challenge.** `STRIPE_SECRET_KEY` held a publishable key, causing
`500` on `POST /enroll/acceleration`. Replaced and redeployed four hours ago.
No one has submitted the form since. The fix is presumed, not observed.

**Solution.** Submit the live form at
`https://www.mathpivot.com/enroll/acceleration` with test card
`4242 4242 4242 4242`. Success is a redirect to `checkout.stripe.com`.

**Why first:** it is two minutes of work and every other item assumes it passes.

### C0.2 — Subscription webhook has never been confirmed verifying

**Challenge.** `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` did not exist in Production
while `constructSubscriptionWebhookEvent` required it. Every delivery returned
`400 Invalid signature`. The var was added and deployed; no delivery has landed
since.

**Solution.** After completing C0.1's checkout, check Stripe Dashboard →
Developers → Webhooks → subscription endpoint → recent deliveries. Expect `200`.
Then confirm a `program_subscriptions` row exists for the test purchase.

**Also confirms in the same transaction:** C2.1 (period fields non-null) and
C3.1 (dedupe path did not misfire).

**Definition of Done for Phase 0:** one test subscription completes end to end,
producing a Stripe `200` and a database row with non-null
`current_period_start` and `current_period_end`.

---

## Phase 1 — Remediate customers already harmed

### C1.1 — Parents who paid but were never provisioned

**Challenge.** Between the deploy of commit `3389737` (which introduced the
dedicated subscription secret) and today, every subscription checkout charged the
customer and then failed at the webhook. Those parents have no
`program_subscriptions` row, no auth user, and never received a welcome email.
They are paying for a service they cannot access.

**Solution, in order.**

1. Replay from Stripe: Dashboard → Webhooks → subscription endpoint → filter to
   failed → resend each. The handler is idempotent on `stripe_event_id`, so
   replay is safe. This provisions accounts retroactively, including the magic
   link email.
2. For anything outside Stripe's retention window, reconcile manually:

```powershell
stripe subscriptions list --limit 100 --status active
```

   Compare against `program_subscriptions.stripe_subscription_id` and provision
   the difference.

3. Consider a short apology email to affected parents. A parent who paid days
   ago and heard nothing has already formed an impression; a brief note beats
   a silent late welcome email.

**Risk to watch.** Replay fires `sendEmail` for each event, so a parent could
receive a welcome email dated well after their payment. Acceptable, but worth
knowing before you trigger fifty at once.

### C1.2 — Failed payments show as active

**Challenge.** `handleInvoicePaymentFailed` read `invoice.subscription`, which is
absent in the current API version — the real path is
`invoice.parent.subscription_details.subscription`. The function returned early
every time, so `status = 'past_due'` has never been set on any row. Any parent
whose card failed still appears fully enrolled.

**Solution.** Code fix is deployed. Verify with a real failure:

```powershell
stripe trigger invoice.payment_failed
```

Then audit existing rows for drift — any subscription Stripe reports as
`past_due` or `unpaid` that your table shows as `active`:

```powershell
stripe subscriptions list --status past_due --limit 100
```

Correct those rows directly in Supabase.

### C1.3 — Period fields null on every existing row

**Challenge.** `current_period_start` / `current_period_end` were read from the
subscription root, but the pinned API version exposes them on subscription
items. Every row written so far has nulls. Anything that gates access on period
end — renewal reminders, expiry checks, the parent billing view — is operating
on missing data.

**Solution.** Code fix is deployed for new rows. Backfill existing ones from
Stripe as the source of truth, matching on `stripe_subscription_id`. Small
row count, so a one-off script beats building tooling.

---

## Phase 2 — Close the trust gaps

### C2.1 — Parents cannot cancel or manage billing

**Challenge.** The audit found no billing portal route. A parent on a recurring
monthly charge has no self-serve way to update a card or cancel. The welcome
email tells them to "manage or cancel anytime from your parent dashboard," which
is a promise the product does not currently keep. That is both a support burden
and a consumer-expectations problem on recurring billing.

**Solution.** Add a route calling `stripe.billingPortal.sessions.create` with
the stored `stripe_customer_id`, linked from `/parent/billing`. Configure the
portal in the Stripe Dashboard to allow cancellation and payment method updates.
Roughly an hour of work and the highest-value item in this phase.

### C2.2 — Delayed-notification payments provision before money clears

**Challenge.** Neither route gates on `payment_status`, and neither handles
`checkout.session.async_payment_succeeded`. With a delayed payment method,
`checkout.session.completed` arrives while the session is still unpaid — so an
account gets provisioned for a payment that may later fail.

**Solution.** Gate fulfillment on `session.payment_status !== 'unpaid'` and add
the async success handler. Low likelihood while card-only is enforced
(see C3.3), but the two interact: removing the card restriction without this
fix opens the hole.

### C2.3 — Sales tax not collected

**Challenge.** `automatic_tax` is off, so no sales tax is being collected on
recurring coaching subscriptions. If Mpingo Systems has nexus in NC or
elsewhere, that is an accruing liability, not a missing feature.

**Solution.** This is an accountant question before it is an engineering one.
Enabling `automatic_tax` requires an active state registration in Stripe Tax
first. Raise it with your accountant, then implement. Flagged here so it is
tracked rather than forgotten.

---

## Phase 3 — Deferred engineering

Nothing here affects a paying customer today.

### C3.1 — Migration 00050 not applied

The unique constraint already exists from migration 00001, so the dedupe guard
works today. Only the `processed_at` index is outstanding, and it supports a
recovery sweep you will rarely run. Apply directly in the Supabase SQL editor,
then `migration repair --status applied 00050` so it is not re-proposed.

### C3.2 — Migration history reconciled but unverified

`00001`–`00049` were marked applied without confirming the files match the live
schema. If any were hand-edited after application, that record is now wrong and
will mislead a future push. Worth a schema diff when convenient, not urgent.

### C3.3 — `payment_method_types: ['card']` hardcoded

Stripe's own guidance says never to pass this on subscription sessions — it
disables dynamic payment methods and costs conversion. A two-line deletion, but
it changes what parents are offered at checkout, so it is a business decision.
Pair it with C2.2.

### C3.4 — API version pin drift

The SDK pins `2025-12-15.clover`; the account default is newer; webhook payloads
render at the version configured per-endpoint, which drifts independently of
both. Not broken, but it is the variable behind C1.2 and C1.3, so an upgrade
needs its own change with a deploy behind it.

### C3.5 — `/api/dev/setup-demo-accounts` ships to production

Confirm it is gated on an environment check. If not, it is a route that creates
accounts, exposed publicly.

### C3.6 — Framework hygiene

Next 16 deprecates the `middleware` convention in favour of `proxy`; Sentry wants
an `onRouterTransitionStart` export; `metadataBase` is unset so social preview
images resolve against `localhost`. Batch these into one cleanup sprint.

---

## Execution order

| # | Item | Blocking money? | Effort |
|---|------|-----------------|--------|
| 1 | C0.1 + C0.2 verification | Yes — unknown state | 10 min |
| 2 | C1.1 replay failed deliveries | Yes — customers stranded | 30 min |
| 3 | C1.2 + C1.3 data audit and backfill | Yes — wrong access state | 1 hr |
| 4 | C2.1 billing portal | Trust and support burden | 1 hr |
| 5 | C2.2 + C3.3 payment method handling | No | 1 hr |
| 6 | C2.3 tax | Liability, needs accountant | — |
| 7 | Phase 3 remainder | No | batch later |

**Start at #1.** It costs ten minutes and determines whether items 2 and 3 are
small or large.
