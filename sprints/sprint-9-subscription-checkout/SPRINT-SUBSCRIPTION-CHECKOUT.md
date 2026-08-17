# Sprint 9: Self-Serve Subscription Checkout — MathPivot

**Goal:** Let anonymous parents enroll in Foundation / Acceleration / Elite
coaching without a consultation call. Payment via Stripe Checkout, account
auto-provisioned on webhook, welcome email with a one-click magic link.

**Outcome:** Live end-to-end on `https://www.mathpivot.com`. Test-mode
verified with an $799 Elite subscription (`pivotsquare1@gmail.com`,
`cs_test_b1sELFIjh9f...`) that landed in `program_subscriptions`, created a
confirmed `auth.users` row, and delivered the welcome email. Live-mode
switchover is the only remaining step — see S8.

**Repo:** `C:\Users\HP\Documents\mathpivot`
**Branch:** `claude/stabilize-mathtutoros-ZLnOZ`
**Baseline commit:** `9c61293` (sprint 9 initial)
**Final commit:** `eea41b7` (customer_creation fix)

---

## S1 — Enroll flow scaffolding (baseline, `9c61293`)

New public routes and helpers so a parent can go from `/pricing` → checkout
→ success in three clicks.

- `src/lib/stripe/programs.ts` — tier config (Foundation $349,
  Acceleration $549, Elite $799) + env-var-driven price ID lookup so
  test↔live is one env-var flip
- `src/lib/stripe/subscription-checkout.ts` — creates a Stripe Checkout
  session in `mode: 'subscription'` with two custom fields (student name,
  grade), promo codes enabled, address collection required
- `src/app/actions/enroll.ts` — server action wired to
  `startEnrollmentAction(tier)`
- `src/app/api/stripe/subscription-webhook/route.ts` — handles
  `checkout.session.completed` and the `customer.subscription.*` lifecycle
- `src/app/(public)/enroll/[tier]/page.tsx` — confirmation page (program
  summary, features, "Continue to Checkout")
- `src/app/(public)/enroll/success/page.tsx` — post-checkout thank-you
  with a 3-step "what happens next" timeline
- `src/app/(public)/enroll/cancel/page.tsx` — abandoned checkout
- `src/middleware.ts` — `/enroll` added to public routes

Migration `supabase/migrations/00049_program_subscriptions.sql`:

- `program_tier` enum (foundation / acceleration / elite)
- `program_subscription_status` enum (full Stripe lifecycle — renamed from
  the generic `subscription_status` to avoid colliding with migration
  00016's enum of the same name)
- `program_subscriptions` table with Stripe IDs, period, RLS for parents
  and admins, updated_at trigger

Wire-up:

- `src/app/(public)/pricing/page.tsx` — "Enroll Now" buttons →
  `/enroll/[tier]`
- `src/components/DiagnosticFlow.tsx` — result-screen "Enroll in
  [Program]" → `/enroll/[tier]`
- `src/app/landing-page-client.tsx` — 5 homepage CTAs rewired away from
  `/signup` to `/pricing` or `/enroll/[tier]` (`1c860d6`)

Docs: `docs/stripe-subscription-setup.md` — full setup guide.

---

## S2 — Hotfix: dedicated subscription webhook secret + resilient parent provisioning (`3389737`)

External code review surfaced three defects, all of which could silently
drop a paid enrollment. Fixed together.

1. **Dedicated signing secret per endpoint.** The credits and subscription
   endpoints both verified against a single `STRIPE_WEBHOOK_SECRET`, but
   Stripe issues a distinct signing secret per registered endpoint — so at
   most one of the two could ever verify. Introduced
   `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` and
   `constructSubscriptionWebhookEvent()`. Missing secret is now logged by
   name instead of failing indistinguishably from a bad signature.
   **ACTION:** set `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` in Vercel
   Production.
2. **Database writes are checked.** `supabase-js` resolves with `{ error }`
   rather than throwing, so unchecked calls in
   `handleSubscriptionCheckoutCompleted`, `syncSubscriptionState`, and
   `handleInvoicePaymentFailed` were returning 200 to Stripe on failure,
   so Stripe never retried. Each write now destructures `error`, logs it
   with the subscription id, and throws so the outer catch returns 500.
3. **Parents paying for the first time get a working account.**
   `generateLink({ type: "magiclink" })` requires an existing `auth.users`
   row; a brand-new self-serve parent has none. `provisionParentAccount()`
   now creates the auth user first (`email_confirm: true` since payment
   already completed), tolerates the already-registered case for repeat
   customers and webhook retries, then generates the link. Resolved user
   id is stored as `parent_user_id` so the RLS policy in migration 00049
   matches the parent to their own subscription.

Left `current_period_start`/`current_period_end` fix for the next commit
since it's data-quality only.

---

## S3 — Stripe API drift + webhook dedup (`8dbb240`, `83977cd`)

Follow-on hardening from the same external review.

- **Fail-fast key validation** in `src/lib/stripe/index.ts` — surfaces
  bad `STRIPE_SECRET_KEY` at boot instead of on first paid enrollment.
- **Webhook idempotency** — event id is claimed via
  `stripe_webhook_events.stripe_event_id` (UNIQUE) before any handler
  runs; a duplicate delivery hits `23505` and returns 200 without
  re-running handlers.
- **Period fields fix** — `current_period_start` /
  `current_period_end` moved from Subscription root to `items[0]` in
  Stripe API 2026-05-27.dahlia. `periodFrom(sub)` reads the item field
  first, falls back to the root for older endpoint API versions.
- **Invoice subscription lookup fix** — `invoice.subscription` moved to
  `invoice.parent.subscription_details.subscription` in the same API
  drift. `subscriptionIdFromInvoice(invoice)` handles both shapes.
- **Read-only reconciliation audit** — script queries Stripe for
  subscriptions the app doesn't have rows for (or has stale state on)
  and reports drift. Non-mutating.

---

## S4 — Fix: `customer_creation` rejected in subscription mode (`eea41b7`)

`src/lib/stripe/subscription-checkout.ts` set
`customer_creation: parentEmail ? undefined : "always"`. Stripe rejects
that field in subscription mode with `customer_creation can only be used
in payment mode` — every "Continue to Checkout" click returned 500 for
parents who didn't pre-fill their email. Subscription mode always creates
a customer implicitly, so the field is redundant here. Removed.

---

## S5 — Config gotchas discovered during rollout

None of these are code bugs, but each cost a debug cycle. Documented in
`docs/stripe-subscription-setup.md`.

1. **Empty env-var paste.** `vercel env add STRIPE_SECRET_KEY production`
   in PowerShell silently accepted an empty value when nothing was
   pasted at the sensitive prompt. Vercel showed `[SENSITIVE]` in
   `env pull` output regardless of whether the value was empty. Fix: set
   sensitive values via the Vercel Dashboard web UI, not the CLI's
   sensitive prompt.
2. **Sandbox vs Test mode.** Stripe now splits "Test mode" into named
   Sandboxes, each with its own webhooks, keys, and data. Registering
   the endpoint in classic Test mode while `STRIPE_SECRET_KEY` was a
   Sandbox key silently dropped every event — Sandbox tried to fire
   webhooks, saw no registered endpoint, sent nothing. Endpoint must be
   registered inside the same Sandbox as the key.
3. **Wrong key type.** `STRIPE_SECRET_KEY` set to a publishable key
   (`pk_...`) or restricted key (`rk_...`) returned Stripe's
   `This API call cannot be made with a publishable key` error as a
   500 on POST. Must be the standard secret key (`sk_test_...` /
   `sk_live_...`).
4. **Homepage CTAs pointed at `/signup`.** Sprint 9 only rewired
   `/pricing` and diagnostic results. Landing page CTAs still went to
   the pre-existing auth signup page. Rewired in `1c860d6`.
5. **Supabase Site URL still `http://localhost:3000`.** Magic links in
   welcome emails resolved to localhost after Stripe checkout. Fix in
   Supabase Dashboard → Authentication → URL Configuration: set Site URL
   to `https://www.mathpivot.com` and add `/**` / `/parent` /
   `/auth/callback` to Redirect URLs allowlist.

---

## S6 — Env vars required in Vercel Production

| Variable | Value | When to update | Notes |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (test) / `sk_live_...` (live) | On every mode switch. See S8 for the live swap | Must be the STANDARD secret key, not publishable or restricted |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` for `/api/stripe/webhook` | Whenever you register the credits endpoint in a new mode (test / live). See S8 for the live swap | Signing secret for the older credit-purchase endpoint (`/api/stripe/webhook`), separate from `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`. Do NOT share one value between the two — Stripe issues a distinct signing secret per endpoint |
| `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` | `whsec_...` for `/api/stripe/subscription-webhook` | Whenever you register the subscription endpoint in a new mode (test / live). See S8 for the live swap | New in S2. Do NOT reuse `STRIPE_WEBHOOK_SECRET` — Stripe issues a distinct signing secret per endpoint |
| `STRIPE_PRICE_ID_FOUNDATION` | `price_...` | On every mode switch — test and live products have different price IDs | From the Foundation product created in Stripe |
| `STRIPE_PRICE_ID_ACCELERATION` | `price_...` | On every mode switch | From the Acceleration product |
| `STRIPE_PRICE_ID_ELITE` | `price_...` | On every mode switch | From the Elite product |

All six are mode-scoped: none of them carry over from test to live. S8 is
the ordered procedure for swapping them.

Also required (pre-existing): `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`.

---

## S7 — Validation (test mode, complete)

End-to-end tested with the flow:

1. Anonymous visitor → https://www.mathpivot.com → click "Enroll Your
   Child" → `/pricing` → click "Enroll Now" on Elite → `/enroll/elite`
2. "Continue to Checkout" → Stripe Checkout at `checkout.stripe.com`
3. Test card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`, student
   name "Test Student", grade 10 → Subscribe
4. Redirected to `/enroll/success` — "Welcome to Elite Coaching —
   $799/mo, 2-3 sessions/week + enrichment opportunities"

Verified in Supabase:

- `program_subscriptions` row created with
  `status = 'active'`, `parent_user_id` populated, all Stripe IDs, both
  period columns non-null, full metadata
- `auth.users` row created with `email_confirmed_at` set
- Welcome email delivered from `noreply@mathpivot.com`, BCC to
  `mathpivot@mpingo.ai`, magic link points at `/parent` (after S5.5 fix)

---

## S8 — Going live (remaining)

Sprint 9 is complete in test mode. Flip to live when ready:

1. Stripe Dashboard → toggle off Test mode → **Product catalog** → create
   the same three products (Foundation $349, Acceleration $549, Elite
   $799, monthly recurring). Copy the live `price_...` IDs. These are what
   Stripe actually charges — the amounts in `PROGRAMS` are display-only.
2. Stripe Dashboard (live mode) → Developers → Webhooks → register **both**
   endpoints and copy each one's signing secret. Do this before step 3, so
   there is never a window where a live key is deployed against a
   test-mode signing secret.

   | Endpoint | Events | Secret env var |
   |---|---|---|
   | `/api/stripe/subscription-webhook` | `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` | `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` |
   | `/api/stripe/webhook` | `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed` | `STRIPE_WEBHOOK_SECRET` |

   **Five events on the subscription endpoint, not six.** Earlier drafts
   listed `invoice.payment_succeeded`; the handler has no case for it and
   it falls through to `default: break`. Subscribing anyway is harmless
   but writes a dedupe row per delivery for no reason. Renewals are
   already picked up via `customer.subscription.updated`.

   **Both endpoints must exist in live mode with distinct secrets.** The
   credits endpoint is pre-existing and unrelated to this sprint, but
   Stripe issues a separate signing secret per endpoint, so a live
   deployment that only sets `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` leaves
   `/api/stripe/webhook` rejecting every live event with a 400. Never
   copy one secret into both vars — see S2.1.
3. Update the Vercel Production env vars — **via the Dashboard web UI, not
   `vercel env add`** (S5.1). Six values:
   `STRIPE_SECRET_KEY` (`sk_test_...` → `sk_live_...`, standard secret key
   only), `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` and `STRIPE_WEBHOOK_SECRET`
   from step 2, and the three `STRIPE_PRICE_ID_*` values from step 1.
4. `vercel --prod`. A missing or malformed `STRIPE_SECRET_KEY` now fails
   the build outright (`src/lib/stripe/index.ts` throws at module load), so
   an empty paste is caught here. A *valid but wrong* key — live secret
   from another account — is not caught by anything.
5. Smoke test with a real card at $349 Foundation. Verify in order:
   `/enroll/success` renders → row in `program_subscriptions` with
   `status = 'active'` and both period columns non-null → `auth.users` row
   with `email_confirmed_at` set → welcome email arrives → **the magic
   link resolves to `https://www.mathpivot.com/parent`, not localhost**
   (the S5.5 fix, never yet exercised against live mode).
6. Cancel the subscription immediately from the Stripe Dashboard, then
   confirm `customer.subscription.deleted` flowed through and the row's
   status changed. That proves the live webhook works in both directions.

---

## S9 — Queued follow-ups

- **6-month / annual prepay pricing** — user asked, deferred. Add three
  extra prices per product with 6-month and yearly intervals (~10% and
  ~17% discounts), tier toggle on the enroll page, revised `PROGRAMS`
  config carrying multiple price IDs per tier.
- **Parent dashboard billing section** — surface active subscription,
  next billing date, invoice history, "Cancel subscription" button that
  calls Stripe's cancel API. Reads `program_subscriptions` via the RLS
  policy the sprint added.
- **Coach matching automation** — S7 step 4 currently requires manual
  intake handoff. Auto-match by grade + program tier + capacity when the
  webhook creates the row.
- **Reconciliation cron** — schedule `83977cd`'s read-only audit as a
  daily Vercel cron and page on drift.
- **Course-volume PDF library (light)** — unit-level PDFs named
  `<course>_vol<N>_<unit_slug>.pdf`, private `course-volumes/` storage
  bucket with signed URLs, `scripts/import-course.ts`, and a library
  panel in the parent / student / coach dashboards. **Starts at
  migration `00051`** — see the numbering note below.

### Migration numbering

`00050` is **taken** by `00050_stripe_event_dedupe.sql` (the UNIQUE
assertion on `stripe_webhook_events.stripe_event_id` plus the
`processed_at` index). Earlier planning notes assigned `00050` to the
course-library tables; that slot is gone. The next free number is
`00051`.

Note also that `00050`'s header comment says a handler that dies leaves a
row needing "a manual replay." That is stale as of `dec950c` — Stripe's
own retry now re-runs those handlers automatically. The comment was left
in place rather than edited, since rewriting an already-applied migration
risks a Supabase CLI checksum mismatch.
