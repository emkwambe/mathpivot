# SPRINT MP-M1 — Commercial Truth, Safety Gates, and Coach Cohort Invites

**Master plan covering Sprints S1–S5 (Weeks 1–8).**
**Product:** MathPivot (mathpivot.com)
**Status:** Approved for execution.
**Owner:** Eddy Mkwambe
**Workflow:** Claude Chat (this doc) → Claude Code (terminal execution) → Eddy (verify + deploy).
**Preceding record:** `docs/coach-cohort-invites-gap-report.md` (G1–G14 code audit); `docs/MathPivot Prioritized Fixes and 90-Day Plan.md` (FIX-01–FIX-10 public-perimeter plan); `docs/MathPivot_ Additional Blind Spots.md` (BS-01–BS-10 operational risks); `docs/MathPivot Technical Claims Fact-Check.md` (public-claim softening).

---

## Decisions anchoring the sprints

These are frozen as of 2026-11-24 and must not drift during execution. Any proposed change to them requires an explicit new decision line in this doc with date, owner, and reason.

| # | Decision | Value | Applies to |
|---|---|---|---|
| D1 | Cohort size | 5 target / 6 max | CLAUDE.md, cohort-nudges, availability, invite capacity, marketing copy |
| D2 | Foundation price | **$379 / month** (not $349) | Stripe price, `/pricing`, `/compare`, `/enroll/*`, welcome email, CRM |
| D3 | Public coach-earning claim | "Earn up to ~$8,600/month running three full Advanced cohorts" — derived from 60% × $799 × 6 students × 3 cohorts. **No disclosure of revenue-share percentage, per-session rates, or contractual terms on public pages.** | `/careers`, `/tutor/earnings`, coach-apply landing |
| D4 | Acceleration price | $549 / month (unchanged) | Same surfaces as D2 |
| D5 | Advanced price | $799 / month (unchanged) | Same surfaces as D2; also used as the top anchor for D3 |
| D6 | Session cadence | Foundation 2/wk, Acceleration 3/wk, Advanced 2–3/wk | Any "high-dose tutoring" / "high-impact" / IES-cited language is **removed** per fact-check |
| D7 | Charlotte launch | Hypothesis only — do not represent as a strategic choice until Score 1 maturity | Marketing, media buy briefs |

### Public earning-potential claim (full derivation)

Advanced $799 × 6 learners/cohort = $4,794 per full cohort per month.
Three full Advanced cohorts = $14,382 gross per month.
Coach revenue share (internal, not disclosed) × $14,382 = up to **~$8,600/month** at full capacity.

Public copy uses "Up to ~$8,600/month at full capacity" and nothing more specific. Internal onboarding + the earnings dashboard may show the exact math to the signed-in coach only.

---

## How to read each sprint

- **Intention** — the business outcome the sprint exists to produce.
- **Context** — the paths, docs, and prior-art references Claude Code must read before touching any file.
- **Tasks** — numbered and ordered. Each task names the files involved. No task modifies curriculum or lesson content.
- **Definition of Done (qualitative)** — reviewer-check statements written as what a human can observe.
- **Definition of Done (quantitative)** — thresholds, counts, assertions, and test outputs.
- **Claude Code execution prompt** — verbatim block to paste into the terminal agent.

Rules for every sprint:

- Windows PowerShell on the operator machine; Linux on Vercel. Absolute paths. No `cd` preconditions.
- Supabase migrations are `supabase/migrations/NNNNN_*.sql`; the next available number is used.
- Each sprint deploys separately. Do not batch deploys across sprints.
- Never push to `main`. Branch: `claude/stabilize-mathtutoros-ZLnOZ`.
- Do not disclose coach revenue-share percentage, per-session rates, or contractual terms in any public artifact.

---

# Sprint S1 — Commercial Truth & Launch Gates

**Window:** Week 1 (5 business days).
**Blocking:** every other sprint — commercial drift corrupts everything downstream.

## Intention

Every price, cohort number, and session cadence that a visitor can see must match the same truth table. A reviewer unfamiliar with operations must be able to answer "what does Foundation cost and how big is the cohort" after a single read of any page, and get the same answer across pages.

## Context Claude Code must read first

- `src/lib/stripe/programs.ts` — tier config, source of truth for price and label.
- `src/app/(public)/pricing/page.tsx`, `src/app/(public)/compare/page.tsx`, `src/app/(public)/programs/page.tsx`.
- Every `src/app/(public)/for/*/page.tsx` audience page.
- `src/app/(public)/summer/page.tsx` or whatever renders the Summer 2026 scarcity bar.
- `src/app/landing-page-client.tsx` for the homepage "15:1 Max Coach Ratio" chip.
- `docs/MathPivot Prioritized Fixes and 90-Day Plan.md` §FIX-01 for acceptance checks.

## Tasks

1. **Update `src/lib/stripe/programs.ts`** so Foundation is $379, Acceleration $549, Advanced $799, and cohort display is "5–6 students" in one place. Export `COHORT_SIZE_TARGET = 5`, `COHORT_SIZE_MAX = 6`, `MAX_COHORTS_PER_COACH = 3` so every consumer imports from here.
2. **Delete or guard the Summer 2026 scarcity bar** everywhere it renders. If `end_date < today()`, render nothing. No static past dates in the component.
3. **Sweep `grep -r "349\|15:1\|high.dose\|high.impact\|root cause\|root prerequisite\|paradigm shift"` across `src/`** and replace per the fact-check "Use instead" phrasings. Keep "179 atomic concepts" **only** if accompanied by a footnote link to a public artifact. Otherwise soften to "a defined secondary-math skill model under active calibration".
4. **Update the homepage** (`src/app/landing-page-client.tsx`): the "15:1 Max Coach Ratio" chip becomes "5–6 students per cohort". Add a visible footer link to Privacy and Terms (even if the pages are fleshed out in S2).
5. **Update `src/lib/email/index.ts`** welcome-email templates: tier names use D-decisions for price and session cadence. No legacy "Elite" copy.
6. **Update `docs/coaching-academy-positioning.md`** and `.claude/CLAUDE.md` to reflect D2 ($379 Foundation). Any other tier-price mention must be made consistent.

## Definition of Done — qualitative

- A reviewer who has never seen MathPivot can open `/`, `/pricing`, `/compare`, `/for/schools`, `/for/homeschool`, `/for/competition`, `/enroll/foundation` and `/enroll/acceleration`, and give the same answer for: Foundation monthly price, cohort size, sessions per week, cancellation policy, effective date.
- No visible page displays a past Summer 2026 date as if it were upcoming.
- No public page uses "high-dose", "high-impact", "paradigm shift", "root cause" or "root prerequisite gap".
- Welcome email received from a test Foundation purchase addresses the family at the current price and cadence, with no reference to "Elite".

## Definition of Done — quantitative

- `grep -r "349\|15:1\|high.dose\|high.impact\|paradigm shift\|root cause\|root prerequisite" src/` returns **0 matches** outside of this sprint doc and the analyst docs it references.
- `grep -r "Elite" src/` returns **≤ 2 matches**, all in `src/lib/stripe/programs.ts` and migration-guard code commented as historical.
- Playwright smoke script asserts the string "$379" appears on `/pricing`, `/compare`, `/enroll/foundation`, and no page in `src/app/(public)/**` contains `"$349"`.
- `npm run build` exits 0.

## Claude Code execution prompt

```
Execute Sprint S1 from
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-M1-MASTER.md.

Read that file first in full. Read the four input docs it references before
touching any code.

Constraints:
- Windows PowerShell on the operator machine. Absolute paths.
- Do NOT deploy. Do NOT run `vercel`. Eddy verifies and deploys.
- Do NOT modify curriculum, lesson, or content files. Commercial surface only.
- TypeScript strict. BOM-free UTF-8 writes.
- One commit per task so the review diff is readable.

Report after each task: files changed, grep assertions ran, any deviation
from the sprint doc. Mark DoD items done / not done / blocked with reason.
Do NOT start S2 in the same pass.
```

---

# Sprint S2 — Student Provisioning & Signup Lockdown

**Window:** Week 2 (5 business days).
**Blocking:** S4 (invite feature cannot place anyone until this is fixed). Also unblocks placement queue for already-paying families.

## Intention

Close two live defects. First, the Stripe subscription webhook never provisions a student auth user, so every paid family is stuck un-placeable. Second, the public signup form offers "Coach" as a role option and the backend trusts it, so any visitor becomes a tutor without approval.

## Context Claude Code must read first

- `src/app/api/stripe/subscription-webhook/route.ts` — handler for `checkout.session.completed` and the invoice events.
- `src/app/actions/placement.ts` — see where `student_user_id` is required and how the queue filters.
- `src/app/(auth)/signup/page.tsx` + `src/app/(auth)/actions.ts` — current role picker.
- `supabase/migrations/00029_onboarding_fixes.sql` — `handle_new_user` trigger reading `raw_user_meta_data->>'role'`.
- `supabase/migrations/00049_program_subscriptions.sql` + `program_subscriptions` schema.
- `docs/coach-cohort-invites-gap-report.md` §G5, §G9 for the evidence.

## Tasks

1. **Migration `NNNNN_student_user_provisioning.sql`**: add `public.provision_student_for_subscription(parent_user_id uuid, student_name text, student_grade int)` as `SECURITY DEFINER`, inserting a `student`-role row in `users_profile` + an auth user if one does not already exist, under the parent's `families.id`. Return the new `student_user_id`.
2. **Update `handleSubscriptionCheckoutCompleted`** to call that function immediately after `provisionParentAccount` and set `program_subscriptions.student_user_id`. Bump a `provisioning_version = 2` metadata flag on the row.
3. **Backfill script** `scripts/backfill-student-user-ids.ts` (Node, run against production via `node --env-file=.env.local`): iterate `program_subscriptions WHERE status IN ('active','trialing') AND student_user_id IS NULL`, call the same function, write the result, and log a reconciliation report with before/after counts.
4. **Remove "Coach" from `src/app/(auth)/signup/page.tsx`'s role `<select>`.** Keep only Parent and Student.
5. **Harden `src/app/(auth)/actions.ts`**: force `role` to one of `parent | student` server-side regardless of form input. A submission claiming `tutor` returns a 400.
6. **Migration NNNNN+1**: update `handle_new_user` trigger to ignore `raw_user_meta_data.role` for `tutor`. Only `acceptInvitation` (coach-application flow) may elevate to `tutor`, and only after setting `coach_onboarding_progress.activated = true`.
7. **Audit all coach-gated server actions** (`src/app/actions/*.ts`) and wrap role checks so they require both `role = 'tutor'` **and** `coach_onboarding_progress.activated = true`. Produce a list of actions touched.

## Definition of Done — qualitative

- Creating a new Foundation subscription with a test card immediately produces a `program_subscriptions` row with a non-null `student_user_id`, and the student can be placed into a cohort by admin without manual DB edits.
- A visitor who inspects the signup form sees no "Coach" option. A crafted POST with `role=tutor` is rejected server-side.
- A coach who has `role=tutor` but `activated=false` cannot reach any coach-only action (returns a "coach not yet activated" error).
- Backfill script report is saved to the repo (not just stdout) for operator review before running in prod.

## Definition of Done — quantitative

- `SELECT COUNT(*) FROM program_subscriptions WHERE status IN ('active','trialing') AND student_user_id IS NULL;` returns **0** after the backfill runs against prod.
- Playwright: POST to `/signup` with `role=tutor` returns HTTP 400. GET `/signup` HTML does not contain `value="tutor"`.
- `grep -rE "role\s*===?\s*['\"]tutor['\"]" src/app/actions/` finds **0** call sites that do not also check `activated`.
- `npm run build` exits 0; `vitest run` passes (webhook handler test added for the new provisioning path).

## Claude Code execution prompt

```
Execute Sprint S2 from
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-M1-MASTER.md.

Same global constraints as S1. Two additional rules for this sprint:

- The backfill script writes its reconciliation report to a file under
  `scripts/out/` named by UTC timestamp. Do NOT run the script against
  production. Eddy runs it after reviewing the dry-run output.
- Migration file numbers: use the next available integer after
  `supabase/migrations/` HEAD; do NOT reuse an existing number.

Before writing any code, discovery report:
  1. Every file that writes to program_subscriptions.
  2. Every call site that treats role='tutor' as sufficient authorization.
  3. The current signup -> auth-user -> users_profile data path.

Then execute tasks 1-7 in order. After each, stop and report what changed.
Mark DoD items done / not done / blocked with reason.
```

---

# Sprint S3 — Platform Hardening

**Window:** Weeks 2–3 (runs in parallel with S2; 8 business days total).
**Blocking:** S4 (invites cannot enforce capacity until the seat-claim function exists; invites cannot survive the login wall until middleware is fixed).

## Intention

Three hardening tracks landing in one sprint: RLS policy hygiene, atomic cohort seat claim, middleware public-route additions, mobile/accessibility fixes from FIX-04, and SEO perimeter from FIX-07. These are independent enough to parallelize across one engineer with Claude Code.

## Context Claude Code must read first

- `supabase/migrations/00041_*.sql` — RLS policies with `USING (true)`.
- `src/middleware.ts` — public-routes allowlist.
- `src/components/layouts/DashboardLayout.tsx` — nav, mobile header, label hooks.
- `src/app/robots.txt/route.ts`, `src/app/sitemap.xml/route.ts` (or the Next 16 metadata equivalents). Create them if absent.
- `docs/coach-cohort-invites-gap-report.md` §G6, §G7, §G10, §G14.
- `docs/MathPivot Prioritized Fixes and 90-Day Plan.md` §FIX-04, §FIX-07.

## Tasks

### Track A — RLS & seat claim (engineering + migrations)

1. **Migration `NNNNN_tighten_rls_policies.sql`**: replace every `USING (true)` policy on `cohort_enrollments`, `coaching_schedules`, `diagnostic_assessments`, `diagnostic_results` (and any sibling table the probe surfaced) with explicit policies scoped `TO authenticated` with a predicate that restricts rows to the owning parent, assigned coach, or admin.
2. **Migration `NNNNN+1_claim_cohort_seat.sql`**: `claim_cohort_seat(p_schedule_id uuid, p_student_id uuid, p_hold_minutes int default 0)` as `SECURITY DEFINER`. Inside: `SELECT … FOR UPDATE` on the `coaching_schedules` row, count enrollments + unexpired seat holds, reject if `enrolled + holds >= max_capacity`, otherwise insert the enrollment or hold row atomically. Grant EXECUTE to `authenticated`.
3. **Replace `placeStudent()` in `src/app/actions/placement.ts`** to call the function instead of count-then-insert. Replace `placeCohortStudent()` similarly.
4. **Fix `coach_schedule_overview` view** so `spots_remaining` reports both target and max: add `spots_to_target` (`default_capacity - enrolled`) and `spots_to_max` (`max_capacity - enrolled`). Update callers in `src/app/actions/placement.ts` and `src/app/actions/cohort-nudges.ts`.

### Track B — Middleware & signup routing (FIX-03 follow-through + G11/G14)

5. **Add `/join/[token]`, `/privacy`, `/terms`, `/legal/*` to `PUBLIC_ROUTES` in `src/middleware.ts`.** Confirm `/coach-apply`, `/coaches`, `/signup`, `/login` already present.
6. **Make `/signup` read `?email=` and `?next=`.** Pass `next` into `emailRedirectTo` via `signupAction`. Pre-fill the email input value from the query param (sanitized).
7. **Create `/privacy` and `/terms` pages** as static server components with placeholder content and a visible "Last updated" date. Even a stub is sufficient for this sprint — content copy is a separate task for legal review.

### Track C — Mobile & SEO perimeter (FIX-04 + FIX-07)

8. **Mobile header pass** on `src/components/layouts/MarketingHeader.tsx` (or equivalent): accessible menu button with `aria-label`, `aria-expanded`, `aria-controls`; escape-to-close; 44–48 px touch target. No horizontal overflow at 360/390/414 px.
9. **Form labels**: every `<input>` in `/signup`, `/get-started`, `/enroll/[tier]/page.tsx` has either a visible `<label htmlFor>` or `aria-label`. Error states use `aria-describedby`.
10. **`robots.txt` and `sitemap.xml`** as Next App Router files (`src/app/robots.ts`, `src/app/sitemap.ts`). Serve them without auth (middleware allowlist). Sitemap enumerates only indexable public routes.
11. **Canonical + OG metadata** on every page in `src/app/(public)/`: self-canonical `<link rel="canonical">`, unique `<title>`, unique `og:title`, `og:url`, and `og:image` (homepage image as fallback).

## Definition of Done — qualitative

- A signed-out visitor can fetch `/robots.txt` and `/sitemap.xml` and get real content, not a login redirect.
- A parent can land on `/signup?email=family@example.com&next=/join/abc` and see the email pre-filled; after email confirmation they land on `/join/abc`, not `/`.
- Mobile menu opens, traps focus, closes with escape, and is operable with keyboard alone.
- Concurrent placement attempts on the same last seat result in exactly one success and one clean rejection.
- Phase 0 RLS probe (anon key against the top-10 production tables) returns `200 OK + content-range: */0` or `401` on every table — same posture as 2026-11-24 result, but now by policy, not by accident of grant revocation.

## Definition of Done — quantitative

- Playwright smoke: GET `/robots.txt` returns 200 with `content-type: text/plain`. GET `/sitemap.xml` returns 200 with `content-type: application/xml` and at least 5 `<url>` entries.
- `curl -I https://www.mathpivot.com/privacy` returns 200 without a login redirect.
- `vitest`: the `claim_cohort_seat` test harness (uses a local supabase instance) proves 20 concurrent inserts into a 6-max cohort result in exactly 6 successes and 14 clean rejects.
- Lighthouse Accessibility ≥ 95 on `/`, `/pricing`, `/signup`, `/for/homeschool`.
- No `console` warning about missing `<label>` or `aria-label` on any form in CI.

## Claude Code execution prompt

```
Execute Sprint S3 from
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-M1-MASTER.md.

This sprint runs in three independent tracks (A/B/C). Complete Track A
first — it unblocks S4. Then B and C in parallel.

Standard constraints. Two extra rules:

- Any new RLS policy must be tested with the anon key (unauthenticated) and
  a synthetic parent (authenticated as a non-owner) in the vitest suite.
  Expected behavior: both forbidden.
- The `claim_cohort_seat` function has a dedicated concurrency test harness
  under `test/concurrent-seat-claim.test.ts`. 20 concurrent inserts, 6-max
  cohort, exactly 6 wins. Fail the sprint if any single run produces 5, 7,
  or exits with a serialization error.

Discovery pass before coding:
  1. Every RLS policy currently using USING (true) in supabase/migrations/.
  2. Every call site of placeStudent / placeCohortStudent / spots_remaining.
  3. The current public-route allowlist in middleware.

Execute tasks 1-11 in order within their track. Report after each.
Mark DoD items done / not done / blocked with reason.
```

---

# Sprint S4 — Coach Cohort Invites (Phase 1)

**Window:** Weeks 4–5 (10 business days).
**Depends on:** S2 (student provisioning) + S3 Track A (seat claim) + S3 Track B (public `/join/[token]`).

## Intention

An activated coach can invite a lead into one of their own cohorts. The lead receives an email, lands on a public page, pays via Stripe Checkout with the cohort baked into the session metadata, and is auto-placed on payment success. Admin placement work goes away for coach-sourced families.

## Context Claude Code must read first

- The full gap report: `docs/coach-cohort-invites-gap-report.md`.
- `src/app/actions/coach-applications.ts` — token/invite pattern for coach-hiring.
- `src/lib/stripe/subscription-checkout.ts` — Stripe session construction.
- `src/app/api/stripe/subscription-webhook/route.ts` — the post-S2 handler.

## Tasks

1. **Migration** `NNNNN_cohort_invitations.sql`: `cohort_invitations` table per the gap report's Phase 1 column list (schedule_id, coach_id, lead_id, invitee_email, invitee_name, student_name, student_grade, token_hash, status enum, expires_at, seat_hold_until, created_at, updated_at). Add `coach_invite` to the `lead_source` enum. RLS: coach reads/writes rows where `coach_id = auth.uid()`; admin FOR ALL.
2. **Lead-visibility policy**: add RLS on `leads` so coach can SELECT rows where `assigned_to = auth.uid()`.
3. **`/tutor/cohorts` page**: server component listing the coach's own schedules from `coach_schedule_overview` (coach_id filter). For each: cohort label, day/time, "X of 6 filled · Y pending invites", "Invite a family" button. Hidden if coach is not `activated`.
4. **Invite form** (client component): email, parent name, student name, grade. On submit, server action `inviteFamilyToCohort` creates/links a lead, creates a `cohort_invitations` row with a hashed token, sends an email via Resend. Guardrails: rate-limit 10 invites/coach/day, reject if the cohort has no free seats including unexpired holds, reject if invitee_email already on the cohort.
5. **`/join/[token]` public page** (middleware already exempts it after S3): looks up the invitation server-side with the admin client, shows coach name, program, weekly time, seats left. "Reserve my seat" button places a 30-minute hold via `claim_cohort_seat(..., p_hold_minutes := 30)`, then redirects to Stripe Checkout with metadata `{ invitation_id, schedule_id, coach_id, program_tier }`.
6. **Webhook update**: on `checkout.session.completed` with `metadata.invitation_id`, call `claim_cohort_seat` to convert the hold to a confirmed enrollment, mark invitation `placed`, mark lead `converted`, email the coach. If the hold expired and the seat is gone: write `waitlisted`, alert admin via `mathpivot@mpingo.ai`, do not silently keep the payment.
7. **Outstanding-invite list**: `/tutor/cohorts` shows each pending invite with "resend" and "revoke" actions.
8. **Admin visibility**: existing `/admin/placement-queue` already handles this because it reads `program_subscriptions`; add a small "Via coach invite from {coach_name}" badge when `metadata.invitation_id` is present.

## Definition of Done — qualitative

- An activated coach signs in, opens `/tutor/cohorts`, sees "0 / 6 filled" for a real cohort of theirs, clicks "Invite a family", submits a parent email, and the parent receives a legible email with a working link.
- The parent clicks the link, sees a page naming the coach, program, and weekly time, clicks "Reserve my seat", completes Stripe Checkout, and is auto-placed into the cohort within 30 seconds of payment success — no admin action required.
- A non-activated coach visiting `/tutor/cohorts` sees an onboarding banner, not the invite UI.
- If a coach tries to invite an 8th family to a cohort with 6 confirmed + 1 held, the UI prevents it and the server action rejects it.
- Admin sees coach-sourced placements in the placement queue with attribution.

## Definition of Done — quantitative

- Playwright E2E (staging): full invite → payment → placement round trip completes in < 2 minutes; the resulting `cohort_enrollments` row has `status = 'confirmed'` and the `cohort_invitations` row has `status = 'placed'`.
- Rate-limit test: 11th invite from the same coach within 24 hours returns a 429.
- Concurrency test: 10 simultaneous "Reserve my seat" clicks on a cohort with 2 open seats result in exactly 2 holds; the other 8 return a user-facing "no seats" message and no half-written rows.
- Email deliverability: Resend logs show delivery to a test Gmail inbox with SPF, DKIM, DMARC all passing (if BS-07 work completed; otherwise record the gap and continue).
- `vitest` covers: invite creation happy path, rate limit, duplicate-email rejection, expired token, revoked token, seat-full rejection, waitlist fallback on race.

## Claude Code execution prompt

```
Execute Sprint S4 from
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-M1-MASTER.md.

Preconditions: S2 and S3 Tracks A and B MUST be deployed. Refuse to start
if `claim_cohort_seat` RPC does not exist in the connected Supabase or if
`/join/[token]` still returns a login redirect.

Standard constraints. Additional rules:

- Email templates use the design-system tokens from
  src/lib/email/index.ts. No new brand assertions in copy.
- The invite action rate-limits via a simple database count against the
  invitations table in the last 24 hours — no Redis, no external service.
- The Stripe session metadata carries invitation_id, schedule_id,
  coach_id, program_tier. The webhook reads them.

Discovery pass before coding:
  1. The current coach-application invite pattern end to end
     (src/app/actions/coach-applications.ts + email template).
  2. The current subscription checkout session construction.
  3. The post-S2 webhook flow for checkout.session.completed.

Execute tasks 1-8 in order. After each, stop and report.
Mark DoD items done / not done / blocked with reason.
```

---

# Sprint S5 — Pilot Launch (3 Coaches, 1 Cohort Each)

**Window:** Weeks 6–8 for launch readiness; weeks 8–13 for the live pilot per the Pilot Metrics & Guardrails doc.
**Depends on:** S1–S4 fully deployed.

## Intention

Stand up the controlled pilot the Metrics & Guardrails doc specifies. Three coaches. One live cohort each. Twelve learners total maximum (the pilot doc proposes 4/cohort; D1 says 5–6 max, so operate at 4 for Score 1 evidence purposes while leaving the 5th and 6th seats unused — do not reduce the platform cap).

## Context Claude Code must read first

- `docs/MathPivot_ Additional Blind Spots.md` (all ten BS items).
- `docs/MathPivot Prioritized Fixes and 90-Day Plan.md` — Weeks 5–13.
- The Pilot Metrics & Guardrails doc content (not in repo yet; attach it or paste at execution time).
- `src/app/(dashboard)/admin/reports/page.tsx` — where the ten weekly scores will surface.

## Tasks

1. **Operations dashboard at `/admin/pilot-scorecard`**: ten tiles, one per weekly score, each showing numerator/denominator/missing-count. Numerators are read from `program_subscriptions`, `bookings`, `cohort_enrollments`, `subscription_invoices`, and a new `pilot_events` table.
2. **Migration `NNNNN_pilot_events.sql`**: `pilot_events` table recording inquiry, response, payment, activation, session attendance, cancellation, refund, each with coach_id, cohort_id, learner_id, source, timestamp.
3. **Attribution tracking**: three distinct fields on `program_subscriptions` + `cohort_enrollments` — `referring_coach_id`, `requested_coach_id`, `assigned_coach_id`. Default assigned = requested on invite flow. Admin transfers update `assigned_coach_id` without touching `referring_coach_id`.
4. **Response-time clock on inquiries**: `leads.first_substantive_response_at` column + an admin UI prompt in `/admin/placement-queue` to mark a reply as "substantive" (not just an auto-ack).
5. **Hard-stop guardrails code**: a nightly job (Vercel Cron) that flags any `program_subscriptions.student_user_id IS NULL`, any coach with no activation record delivering sessions, any session log older than 24h, any refund rate above 10% rolling, and emails `mathpivot@mpingo.ai` + `emkwambe1@gmail.com`.
6. **Session logging on `/tutor/cohorts/[schedule]/session-log`**: coach records what was taught per session, with 24-hour expectation; log state surfaces on Score 6.
7. **Billing portal env var**: set `STRIPE_PORTAL_CONFIGURATION_ID` in Vercel production and confirm the "Manage subscription" button works. This closes C2.1 from the Challenge Plan.
8. **Pilot kickoff pack**: a one-page per-coach briefing covering authorization scope (specific course + topic packet), the ten scores, the stop rules, and the response-time SLA. Place at `/tutor/pilot-brief` as an authenticated page.

## Definition of Done — qualitative

- Admin opens `/admin/pilot-scorecard` and reads all ten scores with numerators and denominators. No score shows a percentage without the underlying count.
- Each of the three pilot coaches has: activation record, authorized topic packet, briefing acknowledged, response-time SLA understood.
- A parent on an active subscription can open the Stripe billing portal from `/parent/billing` and cancel.
- A test "no response within one business day" trip fires the stop rule and emails the operator.
- No pilot cohort launches without a coach `activated = true`, a payment ledger clean on reconciliation, and parent-visible Privacy/Terms.

## Definition of Done — quantitative

- `/admin/pilot-scorecard` renders 10 tiles, each with `{numerator, denominator, missing}` and a timestamp of last computation.
- Vercel Cron for guardrails runs nightly at 03:00 UTC; logs show executions for 7 consecutive days with no alert noise from un-rolled-out code.
- Response-time instrumentation covers 100% of new inquiries post-deploy (asserted by a report query).
- Billing portal test: a test customer can open the portal, update their payment method, and the Stripe event is reflected in `program_subscriptions.status` within 2 minutes.

## Claude Code execution prompt

```
Execute Sprint S5 from
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-M1-MASTER.md.

Preconditions: S1-S4 deployed and verified. Do not start if any S1-S4 DoD
item is still open.

Standard constraints. Additional rules:

- The pilot scorecard reads live data only. No mock numerators. If a
  source is empty, the tile shows "not yet measurable" with the missing
  denominator — never "0%" and never "100%".
- Nightly cron is wired via vercel.json schedule. Alert emails are
  plain text, use the existing sendEmail helper, and BCC
  mathpivot@mpingo.ai.

Discovery pass:
  1. How admin/reports currently composes tiles.
  2. Whether vercel.json already contains a crons section.
  3. The existing bookings/attendance data model used by the admin
     dashboard's "Today's Sessions" tile.

Execute tasks 1-8 in order. After each, stop and report.
Mark DoD items done / not done / blocked with reason.
```

---

## Sprint dependency graph

```
S1 ──► S2 ──► S4 ──► S5
 │      │
 └──► S3 ──┘
```

S1 blocks everything downstream. S2 and S3 Track A are independent and can run in parallel but S4 depends on both. S3 Tracks B and C are independent of S4 but desirable before S5 so the pilot does not launch onto a broken mobile funnel.

## Change log

- 2026-11-24 — initial draft. D1–D7 anchored. Sprint S1–S5 defined.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Qjoh5TNLXgQyXHU7KQUouF
