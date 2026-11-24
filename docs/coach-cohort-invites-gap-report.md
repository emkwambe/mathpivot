# Coach-Initiated Cohort Invitations: Gap Report

**Date:** 2026-11-24
**Branch inspected:** `claude/stabilize-mathtutoros-ZLnOZ` (HEAD `3ec6aa1`)
**Status:** Investigation only. No code changed. Decisions D1 to D6 below are needed before fixing starts.

## 1. The requirement

An **approved (activated) Math Coach** should be able to invite a lead (a parent or prospect) to sign up for one of that coach's coaching cohorts. A cohort holds **at most 6 students**. The invite has to carry the lead from "invited" through account creation and payment to a confirmed seat in that specific cohort, without an admin placing them by hand.

An "invite" covers two channels (clarified by the owner on 2026-11-24):

1. **Direct invite.** The coach sends a personal message to a specific family (a known lead) inviting them into a named cohort.
2. **Generic shareable invite.** The coach posts one link or ad (flyer, social post, school newsletter, QR code). Each visitor is routed to the *relevant* cohort based on their needs, such as grade, course, goals, or diagnostic result. The coach is credited for the conversion.

I read "course" as a **cohort**: one `coaching_schedules` row, which is one coach, one program, and one weekly time slot, with `default_capacity = 5` and `max_capacity = 6`. If you meant something else (for example a program tier across several time slots), see decision D1.

## 2. Summary

There is no coach-initiated invite path today. Each piece the feature needs exists only in admin-only form, or doesn't exist at all. Leads are admin-only at the database level. Cohort placement is an admin action. The coach dashboard never displays the coach's own cohorts. Stripe checkout knows the program tier but not which cohort or coach the family chose.

The investigation also turned up two problems that would break the feature even after an invite UI is added:

1. **The Stripe webhook never creates or links a student account.** The placement queue silently skips every subscription that has no student account linked. As far as the repo shows, **every new self-serve paid student is invisible to admin placement today.** This is a live operational bug, separate from invites.
2. **The capacity "6" is not enforced anywhere that matters.** There is no database constraint and no row lock, so two simultaneous checkouts can overfill a cohort. The admin suggestion list also hides the 6th seat.

There are also two security findings on the same tables (section 4, G9 and G10). Any work in this area should fix them first.

## 3. How it works today (traced in code)

```
Lead capture (public form) ──► leads table (RLS: admin only)
                                    │  admin drags on kanban
                                    ▼
Parent self-serves /enroll/[tier] ──► Stripe Checkout (metadata: tier only)
                                    ▼
subscription-webhook ──► program_subscriptions (parent_user_id set, student_user_id NEVER set)
                                    ▼
/admin/placement-queue ──► filters out rows with no student_user_id ──► (nothing shown)
                                    ▼
admin placeStudent() ──► cohort_enrollments (schedule_id, student_id)
```

Coaches don't appear anywhere in this chain. The only coach-related invite flow in the code is **admin → prospective coach** (`coach_applications.invite_token`). That is the reverse of what's needed here.

## 4. Gaps

Each gap names the evidence in the repo. Severity is about the invite feature unless noted.

### G1. Coaches cannot see or touch leads (blocking)

`leads` RLS is admin-only (`supabase/migrations/00022_leads_pipeline.sql:267`, `USING (is_admin())`). Every lead server action in `src/app/actions/leads.ts` returns "Admin access required" for any other role. `leads.assigned_to` exists but nothing lets the assigned coach read the row. The `lead_source` enum has no value for a coach-originated invite.

### G2. No invitation entity for families (blocking)

No table, token, expiry, or status models "Coach X invited this family to Cohort Y". The only token-based invite is `coach_applications.invite_token` (migration 00054), which is for hiring coaches.

### G3. Coaches cannot see their own cohorts (blocking)

`getCoachSchedules()` in `src/app/actions/schedules.ts` has **no callers**. No page under `src/app/(dashboard)/tutor/` reads `coaching_schedules`, `cohort_enrollments`, or `coach_schedule_overview`. A coach has no screen that shows "Tuesday 5:30 Acceleration, 3 of 6 filled", so there's nothing to invite *into*. Schedules can only be created by an admin (`createSchedule`, admin-gated).

### G4. Checkout carries no cohort context (blocking)

`createSubscriptionCheckout` (`src/lib/stripe/subscription-checkout.ts:63`) puts only `program_tier` and `billing_plan` into Stripe metadata. No `schedule_id`, `coach_id`, or `invite_id` exists, so the webhook can't know which cohort the family was invited to.

### G5. The webhook never provisions a student account (blocking, and a live bug today)

`handleSubscriptionCheckoutCompleted` (`src/app/api/stripe/subscription-webhook/route.ts:188-220`) provisions the **parent** user and stores `parent_user_id`. It writes `student_name` and `student_grade` as text but never sets `student_user_id`. A repo-wide search shows no code anywhere that writes `program_subscriptions.student_user_id`.

`getPlacementQueue()` then drops those rows (`src/app/actions/placement.ts:99`, `s.student_user_id && ...`), and `placeStudent()` refuses them with "Subscription is missing a linked student account." `cohort_enrollments.student_id` is `NOT NULL REFERENCES auth.users`, so no paid student can be seated until someone manually creates the student user and links it.

*Live data was not checked.* The Supabase connector isn't authenticated in this session. Confirm with `select count(*) from program_subscriptions where status in ('active','trialing') and student_user_id is null;`.

### G6. Capacity of 6 is not actually enforced (blocking for "up to 6")

- **No database constraint.** Capacity is checked in application code with count-then-insert (`placement.ts` `placeStudent`, `schedules.ts` `placeCohortStudent`). Two concurrent inserts can both see 5 and both insert, which gives 7. Coach invites make this much more likely, because many families can check out in parallel.
- **The 6th seat is hidden.** The view computes `spots_remaining = default_capacity - enrolled` (`00041:132`), which is 5 minus enrolled. `getSuggestionsForTier()` filters `spots_remaining > 0` (`placement.ts:154`), so a cohort with 5 students never appears as placeable even though `max_capacity` is 6.
- **No seat holds.** Nothing reserves a seat between "invite accepted" and "payment succeeded", so six outstanding invites plus admin placements can oversubscribe a cohort.

### G7. Cohort writes may be blocked by RLS (needs live verification)

Migration 00041 enables RLS on `coaching_schedules` and `cohort_enrollments` but creates **only SELECT policies**. No later migration adds INSERT or UPDATE policies. The admin actions use the RLS-bound server client (`createClient`), so as written in the repo, `createSchedule` and `placeStudent` would be rejected. If they work in production, the policies were added outside the migrations and the repo is out of sync with the database. Either way, a coach-side write path needs explicit policies or a `SECURITY DEFINER` function.

### G8. "Approved coach" is not enforced as a gate anywhere

`coach_onboarding_progress.activated` exists and is set by `adminActivateCoach`, but only the coach dashboard banners and the public coach roster read it. `createSchedule` doesn't check it either. Any new coach action must gate on `activated = true` **and** `coaching_schedules.coach_id = auth.uid()`.

### G9. Anyone can sign up as a coach (security, pre-existing)

The signup form offers "Coach" (`src/app/(auth)/signup/page.tsx`), the schema accepts `role: "tutor"` (`src/app/(auth)/actions.ts:25`), and `handle_new_user` trusts `raw_user_meta_data->>'role'` (`00029_onboarding_fixes.sql`). A self-registered "coach" gets the tutor role without application, approval, or background check. This matters directly here: any gate that relies on "role = tutor" is meaningless, which is why G8's gate must use `activated`.

### G10. Cohort and diagnostic data readable by anyone (security, pre-existing)

`cohort_read` and `diagnostic_read` are `FOR SELECT USING (true)` with no `TO` clause (`00041:109,113`). With Supabase's default grants, that likely includes `anon`. Every student's cohort placement, payment status, and diagnostic scores could be read with the public anon key. Invites would add more family data to these tables, so this should be closed first.

### G11. Signup drops invite context (blocks any token-based invite)

The existing coach-invite page redirects to `/signup?email=…&next=…` (`coach-apply/accept/[token]/page.tsx:49`), but the signup page reads neither parameter. `signupAction` also sends `emailRedirectTo: /auth/callback` with no `next` (`actions.ts:170`). After email confirmation the user lands on `/` and the token is lost. The coach-invite accept page also looks up `coach_applications` as an anonymous user, while that table's RLS only allows admins or the linked owner. So it most likely shows "Invitation not found" to every signed-out invitee. A family invite built on the same pattern would fail the same way. *Verify on staging; I traced the code but didn't run the flow.*

### G12. Program and slug mismatch for summer clinics (scope)

Schedules can be created for summer clinic slugs (`propel-7`, `advantage-8`, …), but Stripe checkout only supports `foundation`, `acceleration`, and `advanced` (`src/lib/stripe/programs.ts:1`). Clinic cohorts have no purchasable checkout, so invites can only cover year-round cohorts until clinic checkout exists.

### G15. No needs-based routing from a link to a cohort (blocking for channel 2)

Some needs-assessment pieces already exist, but nothing joins them to a coach or a cohort:

- **The diagnostic works anonymously.** The public diagnostic (`/diagnostic`, `submitAssessment` in `src/app/actions/diagnostics.ts`) recommends a program without login. It writes a `diagnostic_assessments` row only when the visitor is signed in.
- **Lead capture drops the result.** `DiagnosticFlow.tsx` captures a lead with `source = free_diagnostic` and passes only the source and grade as hidden fields. The recommended program is **not stored on the lead**.
- **Persona isn't used for routing.** `classifyPersona()` (`src/lib/persona.ts`) tags leads with one of six personas, but nothing acts on the tag.
- **No coach attribution.** No referral, campaign, or coach code is carried from a link through intake, checkout, and the webhook. The family referral system (migration 00024) is parent-to-parent, not coach-scoped.
- **No matching step.** Nothing maps "grade 8, needs Algebra 1 support, recommended Acceleration" to "this coach's Thursday 5:30 Acceleration cohort, 2 seats open".

A generic coach link today would at best create an unattributed lead on the admin kanban.

### G13. Business-rule tension on 5 vs 6

`CLAUDE.md` says "5 target / 6 max". `cohort-nudges.ts` says "once a cohort hits 5, spin up a second cohort". Your request says "up to 6". These need one rule for whether invites may fill the 6th seat (D2).

## 5. Proposed solution

This is a phased plan. Phase 0 is fixes the feature can't work without, and Phase 0a also helps today's paid families.

### Phase 0: Prerequisites

**0a. Student provisioning in the webhook (G5).** At `checkout.session.completed`, create the student auth user (role `student`) under the parent's family using the existing `family_members` model, and set `student_user_id`. Backfill existing `active`/`trialing` rows where `student_user_id is null`. Don't reuse the hard-coded `"Welcome123!"` password from `family.ts`. Create the student without a password and let the parent manage access.

**0b. Atomic seat claim (G6, G7).** Add a `SECURITY DEFINER` Postgres function `claim_cohort_seat(schedule_id, student_id, …)` that does `SELECT … FOR UPDATE` on the `coaching_schedules` row, counts `confirmed`/`active` enrollments plus unexpired holds, and inserts or rejects atomically against `max_capacity`. Route all three placement paths through it. Fix the view's `spots_remaining` so it reports both target and max.

**0c. Lock down RLS (G7, G9, G10).**
- Replace the `USING (true)` read policies with admin, the owning coach (`schedule.coach_id = auth.uid()`), and the student or parent on the row.
- Add explicit write policies, or rely on the definer function.
- Remove "Coach" from public signup, force `role` to `parent`/`student` in `handle_new_user`, and grant `tutor` only through `acceptInvitation`.

**0d. Signup keeps `next` and `email` (G11).** Read the parameters on `/signup`, pass `next` through `emailRedirectTo`, and resolve invite tokens server-side with the admin client inside a narrow function. Don't use public table reads. This also fixes the existing coach-hiring invite.

### Phase 1: Direct coach invitations (channel 1)

**Data.** Add a new table `cohort_invitations`:

| column | purpose |
|---|---|
| `schedule_id`, `coach_id` | the target cohort and the inviting coach |
| `lead_id` | the linked or created lead (keeps the pipeline and attribution intact) |
| `invitee_email`, `invitee_name`, `student_name`, `student_grade` | prefill |
| `token_hash` | store a hash, never the raw token |
| `status` | `sent → opened → checkout_started → paid → placed`, or `expired`/`revoked`/`declined` |
| `expires_at`, `seat_hold_until` | invite expiry and short seat hold during checkout |

Add `coach_invite` to the `lead_source` enum, and add a lead policy so a coach can read leads where `assigned_to = auth.uid()`.

**Coach UI** at `/tutor/cohorts`:
- A list of the coach's cohorts with "3 / 6 filled · 1 pending invite".
- An "Invite a family" form that creates or links the lead, the invitation, and the email.
- A list of outstanding invites with resend and revoke.

The form is disabled unless the coach is `activated`, and when the cohort has no free seats (including holds).

**Invitee flow** at `/join/[token]`:
1. A public page shows the coach, program, weekly time, and seats left.
2. "Reserve my seat" places a short hold (for example 30 minutes) through the definer function.
3. Stripe Checkout runs with `schedule_id`, `invitation_id`, and `coach_id` in the session and subscription metadata, using the tier that matches the cohort's `program_slug`.

**Webhook.**
1. Provision the parent and student (Phase 0a).
2. Call `claim_cohort_seat` to create a `confirmed` enrollment.
3. Mark the invitation `placed` and the lead `converted`.
4. Email the coach.

If the cohort filled anyway, enroll as `waitlisted`, alert admin, and don't silently keep the payment. The policy for that is D4.

**Guardrails.**
- Rate-limit invites per coach per day.
- Enforce `distinct email` per cohort.
- Make invites expire (default 7 days).
- Have admin see all invites on the existing leads kanban.

### Phase 1b: Generic coach link with needs-based routing (channel 2)

Both channels end in the same reserve → checkout → webhook → `claim_cohort_seat` path. They differ only in how the visitor gets to "Reserve my seat".

**Data.** Add a table `coach_invite_links` holding:

| column | purpose |
|---|---|
| `coach_id` | the coach being credited |
| `code` | short and human-friendly, e.g. `mathpivot.com/c/maria-fall` |
| `label` | e.g. "Lincoln MS newsletter" |
| `scope` | all of this coach's cohorts, one program, or one cohort |
| `is_active`, `expires_at` | link lifecycle |
| click and conversion counters | campaign reporting |

A coach can have several links, one per campaign, so they can see which channel works. Leads get `invite_link_id`, `recommended_program`, and `utm_*` columns.

**Visitor flow** (`/c/[code]`, public):
1. **Short intake.** Grade, current course, main goal (catch up, keep up, get ahead or compete), and preferred days. Offer the existing diagnostic as an optional step ("Not sure? Take the 15-minute placement check").
2. **Match.** A pure, unit-testable function `matchCohorts(needs, coachId)` returns ranked cohorts:
   - program tier from the diagnostic or intake, using the same rules as `submitAssessment`
   - this coach's active cohorts for that tier that have seats
   - ranked by day/time fit, then fill level (fill the 4-of-6 cohort before opening a new one, consistent with the 5-target rule)
3. **Results page.** Shows the recommended program, why it was recommended, and 1 to 3 matching cohorts with seats left.
4. **No fit with this coach** (wrong tier, all full, or no matching times):
   - Offer other coaches' matching cohorts. Attribution stays with the referring coach (D8).
   - Otherwise join a waitlist that feeds the admin "open a new cohort" nudge.
   - The lead is never lost.
5. **Reserve.** "Reserve" creates the seat hold and goes to Stripe checkout, with `invite_link_id`, `schedule_id`, and `coach_id` in the metadata.

Every visitor who gives an email becomes a lead (`source = coach_invite_link`, `assigned_to = coach`) with the intake answers and recommendation stored. The coach can then follow up with a **direct invite** (channel 1), so the two channels feed each other.

**Abuse and safety.**
- Rate-limit the public intake.
- Allow no free text from coaches on the link page. It shows the coach profile and cohort facts only.
- Require explicit consent before any follow-up email.

### Phase 2: Later options (not needed for the request)

- A per-coach public profile page (`/coaches/[slug]`) that hosts the generic link and shows level badges. This was discussed separately and isn't scoped here.
- Invites into summer clinic cohorts, once clinic checkout exists (G12).
- A coach-side lead list showing invitees who haven't paid yet.

### Decision-framework check

The feature improves outcomes, because students land in the right coach's cohort faster. It scales beyond the founder, because coaches fill their own cohorts and admin placement work goes away. It generates data on coach-sourced conversion. It also works for a trained coach in any state. It passes the 7-layer test, mainly through Layer 3 (Coach) and Layer 4 (Operating).

## 6. Decisions needed before fixing

| # | Decision | My recommendation |
|---|---|---|
| D1 | Does "course" mean one cohort (coach + program + weekly slot)? | Yes, a cohort, capped at its `max_capacity`. |
| D2 | May coach invites fill the 6th seat, or stop at 5 (target) and let admin approve the 6th? | Invites may fill to 6. The existing nudge still prompts a second cohort at 5. |
| D3 | Can coaches create their own cohorts, or only invite into admin-created ones? | Admin-created only for Phase 1. |
| D4 | If a cohort fills between invite and payment: waitlist, auto-refund, or offer another slot? | Seat hold makes this rare. If it happens, waitlist and alert admin within 24h, with refund as the fallback. |
| D5 | Ship Phase 0 (student provisioning, RLS, signup role lockdown) as its own sprint first? | Yes. G5, G9, and G10 affect production today regardless of invites. |
| D6 | Do invites need a discount or promo (for example a coach referral credit)? | No, not in Phase 1. Stripe promo codes are already allowed at checkout. |
| D7 | How does a direct invite reach the family: email only, or also SMS or in-app message? | Email in Phase 1 using the existing `sendEmail`. SMS needs consent handling and a provider, so later. |
| D8 | When a generic-link visitor fits no cohort of the referring coach, show other coaches' cohorts? Who gets credit? | Yes, show them, so the family is never lost. Record the referring coach as `source coach` and the teaching coach separately. Any compensation follows from D9. |
| D9 | Does a coach earn anything for families they bring in (referral bonus in payroll)? | Defer, but capture attribution from day one so it can be decided on real data. |
| D10 | Is the placement diagnostic required before reserving via a generic link, or optional? | Optional, with a short intake as the minimum. Requiring it adds friction at the top of the funnel. The coach confirms fit in the first session. |
| D11 | Build order between channel 1 (direct) and channel 2 (generic link)? | Channel 1 first. It is smaller, and channel 2 reuses its seat-hold, checkout, and webhook path. |

## 7. Live site check (www.mathpivot.com, 2026-11-24)

I ran read-only page fetches against production. I made no logins, no form submissions, and no database queries.

```
GET /signup  → role <select> options:
  <option value="parent" selected="">Parent / Guardian
  <option value="student">Student
  <option value="tutor">Coach
GET /signup?email=test@example.com&next=/coach-apply/accept/abc
  → email input rendered as name="email" with no value (prefill ignored)
GET /coach-apply/accept/not-a-real-token → 200, "Invitation not found."
GET /join/abc        → 200 at /login?redirectTo=%2Fjoin%2Fabc
GET /tutor/cohorts   → 200 at /login?redirectTo=%2Ftutor%2Fcohorts
```

- **G9 is confirmed live.** Anyone can pick "Coach" at public signup.
- **G11 is partly confirmed live.** Signup ignores the `email` parameter. Whether `next` survives email confirmation, and the anon-RLS lookup on the accept page, still need a real invite token to test.
- **New, G14:** `src/middleware.ts` redirects every route not in `PUBLIC_ROUTES` to login. The Phase 1 `/join/[token]` page must be added to that list, or invitees will be sent to login before they can see the cohort.

## 8. What was not verified

- **Live database state.** The Supabase connector wasn't authenticated, so G5's affected-row count, G7 (whether write policies exist out-of-band), and G10 (whether `anon` actually has SELECT grants) are based on migrations and code only.
- **The end-to-end coach-hiring invite flow in G11** was traced in code, not run.
- **Migration numbering skips `00046`.** I didn't check whether a migration is missing from the repo.
