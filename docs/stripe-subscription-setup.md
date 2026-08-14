# Stripe Subscription Setup

This is the one-time setup required to turn on paid enrollments for Foundation / Acceleration / Elite coaching programs. Do it in **test mode** first, verify with a test card, then flip to live.

**Do this in order.** Skipping ahead will produce vague "Stripe not configured" errors.

---

## 1. Create the three subscription products in Stripe

In the Stripe Dashboard (test mode toggle in the top-right corner):

1. Go to **Product catalog → Create product**.
2. For each program below, create a product with a **recurring monthly price**:

| Product name          | Recurring price | Billing period |
|-----------------------|-----------------|----------------|
| Foundation Coaching   | $349.00         | Monthly        |
| Acceleration Coaching | $549.00         | Monthly        |
| Elite Coaching        | $799.00         | Monthly        |

3. After creating each product, click into it and copy the **Price ID** (starts with `price_...`). You'll need all three.

Do the exact same three products in **live mode** later, and copy the live price IDs separately.

---

## 2. Set the price IDs as environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable                      | Value                              | Environment       |
|-------------------------------|------------------------------------|-------------------|
| `STRIPE_PRICE_ID_FOUNDATION`  | test `price_...` from step 1       | Preview + Development |
| `STRIPE_PRICE_ID_ACCELERATION`| test `price_...` from step 1       | Preview + Development |
| `STRIPE_PRICE_ID_ELITE`       | test `price_...` from step 1       | Preview + Development |
| `STRIPE_PRICE_ID_FOUNDATION`  | **live** `price_...`               | Production        |
| `STRIPE_PRICE_ID_ACCELERATION`| **live** `price_...`               | Production        |
| `STRIPE_PRICE_ID_ELITE`       | **live** `price_...`               | Production        |

Also required (should already be set from other Stripe flows):

- `STRIPE_SECRET_KEY` — test key (`sk_test_...`) for Preview/Dev, live key (`sk_live_...`) for Production
- `STRIPE_WEBHOOK_SECRET` — set in step 3 below, one per environment

---

## 3. Configure the subscription webhook

In Stripe Dashboard → **Developers → Webhooks → Add endpoint**:

- **Endpoint URL:** `https://www.mathpivot.com/api/stripe/subscription-webhook`
  - For Preview/Dev, use `https://mathpivot-dev.vercel.app/...` or a `vercel dev` tunnel via `stripe listen`.
- **Events to send:** select these six:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

After saving, click the endpoint and reveal the **Signing secret** (starts with `whsec_...`). Set it as:

- `STRIPE_WEBHOOK_SECRET` in the matching Vercel environment.

**One webhook per environment** — test-mode webhook uses your test-mode secret, live-mode webhook uses your live-mode secret. They are separate secrets.

---

## 4. Run the database migration

Migration file: `supabase/migrations/00049_program_subscriptions.sql`.

Open it in your local repo, copy the contents, paste into **Supabase → SQL Editor**, and run. Expected result: "Success. No rows returned."

Confirm the table exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'program_subscriptions'
ORDER BY ordinal_position;
```

---

## 5. Redeploy and smoke test

After setting env vars and running the migration, run:

```powershell
vercel --prod
```

Then:

1. Visit `https://www.mathpivot.com/enroll/foundation`
2. Click **Continue to Checkout**
3. In Stripe Checkout, use test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
4. Fill in the student name and grade custom fields
5. Complete payment
6. You should land on `/enroll/success` with the "You're enrolled" confirmation
7. Check your email inbox for the welcome email (from noreply@mathpivot.com, BCC'd to mathpivot@mpingo.ai)
8. In Supabase, verify a row appears in `program_subscriptions` with `status = 'active'`

If step 6 works but step 7 doesn't, the webhook likely isn't reaching your app. Check **Stripe Dashboard → Developers → Webhooks → [your endpoint] → Recent deliveries** for the failure details.

---

## 6. Going live

Repeat step 1 in **live mode** (create the three products and copy the live `price_...` IDs). Update the Production env vars from step 2. Add a live-mode webhook (step 3) with a live-mode signing secret.

Then run one more end-to-end test with a real card at a small amount (or use Stripe's live-mode test flow) and confirm the real subscription appears in your Stripe live dashboard.

---

## Common issues

- **"Stripe not configured"** on the enroll page → `STRIPE_SECRET_KEY` missing from that Vercel environment.
- **"Missing STRIPE_PRICE_ID for foundation"** → forgot one of the three price ID env vars.
- **Webhook returns 400 "Invalid signature"** → `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint's secret in Stripe (or you're using the test secret against live events, or vice versa).
- **Row never appears in `program_subscriptions`** → check webhook deliveries in Stripe; if they're failing, view the error. If they show `200 OK` but no row, check Supabase logs for an admin-client permission issue.
- **Welcome email never arrives** → the fallback in the webhook is best-effort; check server logs for `[subscription-webhook] welcome email failed`. `RESEND_API_KEY` must be set in the same environment.

---

## What the code does end-to-end

1. Parent clicks **Enroll Now** on `/pricing` (or "Enroll in Foundation Coaching" on diagnostic results).
2. They land on `/enroll/[tier]` — program summary, features, and a "Continue to Checkout" button (with optional email prefill).
3. Server action `startEnrollmentAction` creates a Stripe Checkout session in `mode: 'subscription'` with two custom fields (student name, grade), price = `STRIPE_PRICE_ID_[TIER]`.
4. Parent completes payment in Stripe's hosted Checkout.
5. Stripe sends `checkout.session.completed` to `/api/stripe/subscription-webhook`.
6. Webhook inserts a row in `program_subscriptions`, generates a Supabase auth magic link, and emails the parent a welcome message with the account-setup link.
7. Parent redirected to `/enroll/success` — clean thank-you page with next steps.
8. Ongoing subscription state changes (renewals, cancellations, past-due) are synced by the `customer.subscription.*` and `invoice.*` webhook events.

Manual work still required after payment: coach matching, first-session scheduling, cohort assignment. That's the intake handoff — auto-provisioning stops at the account level.
