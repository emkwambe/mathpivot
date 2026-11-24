# SPRINT-MP-M1 — Amendments v1

**Supersedes:** sections of `docs/SPRINT-MP-M1-MASTER.md` listed below.
**Effective:** 2026-11-24.
**Precedence:** this file **overrides** the master doc anywhere the two disagree.

Load this into Claude Code with the master doc; the agent must read both before S1.

---

## Decisions amended

### D5 — Advanced tier monthly price

**Was:** $799 / month (unchanged).
**Is:** **$649 / month.**

Rationale: code + `/pricing` + analyst 90-Day Plan all show $649; CLAUDE.md had drifted ahead. No Stripe migration needed.

### D3 — Public coach-earning claim

**Was:** "Up to ~$8,600/month running three full Advanced cohorts" with 60% × $799 × 6 × 3 derivation.

**Is:** **"Up to ~$7,000/month at full capacity."** Nothing more specific on any public page. No percentage, no tier name, no cohort count, no per-session rate, no revenue-share figure. Derivation (0.60 × $649 × 6 × 3 ≈ $7,009) stays internal — may be shown only inside `/tutor/earnings` to a signed-in activated coach.

### D6 — Advanced cadence

**Was:** "2–3 sessions/week".
**Is:** **"3 sessions/week + monthly one-to-one."** Matches code. The monthly 1:1 is the Advanced differentiator vs. Acceleration's flat 3/wk — retain it in marketing copy.

### D-new (D8) — Confidentiality posture

The 60% revenue-share figure and the $26–$30 per-session figure are already in public repo history and on live `/careers`. Going forward:

- **No new public artifact** (master doc, sprint docs, commit messages, PR descriptions, migration comments, `/careers` copy, `/tutor/*` pages visible to non-coaches) names the revenue-share percentage or per-session rate.
- **No git history rewrite.** Cost exceeds benefit; no customer to protect.
- Internal sprint docs stay in the public repo for now. A split-repo move is deferred until a real commercial reason arises.

### D-new (D9) — Grandfathering

There are zero paying customers and zero activated coaches as of this amendment. S1–S5 may change prices, tiers, cadences, and copy freely. No grandfathering logic required.

---

## Sprint tasks amended

### S1 Task 1 — programs.ts updates

Add this to the tier config:

```ts
export const COHORT_SIZE_TARGET = 5;
export const COHORT_SIZE_MAX = 6;
export const MAX_COHORTS_PER_COACH = 3;
```

Tier prices: Foundation $379, Acceleration $549, **Advanced $649** (not $799). Advanced cadence string: `"3 sessions/week + monthly one-to-one"`.

### S1 Task 3 — grep sweep, scoped

The repo-wide `grep -r "349"` false-matches summer clinic SKUs (Ignite Math 1 $349). Scope the check:

```powershell
grep -rE '\$349\b' src/app/`(public`)/{pricing,compare,programs,for} src/lib/persona-landing-content.ts src/lib/stripe/programs.ts
```

This hits subscription tiers only and leaves summer SKUs untouched. The other banned-phrase sweeps (`15:1`, `high.dose`, `high.impact`, `paradigm shift`, `root cause`, `root prerequisite`) stay repo-wide.

### S1 Task 4 — homepage edit targets

`src/app/landing-page-client.tsx` carries the hero chip ("15:1"), the public "60%" figure, and the footer. The master doc's reference to `MarketingHeader.tsx` was a guess — use whatever header component the landing page actually imports. Do not create a new header file.

### S1 — persona pages

The master doc's reference to per-persona pages under `src/app/(public)/for/*/` is wrong. The actual route is `src/app/(public)/for/[persona]/page.tsx` driven by data in **`src/lib/persona-landing-content.ts`**. Fix the data file — the dynamic route picks up changes automatically.

### S1 — summer clinic price drift

CLAUDE.md shows Advantage Math 8 at $399; code shows $349. **Make CLAUDE.md match the code**, not the other way around — the code is what Stripe actually charges. Same rule for any other summer SKU drift.

### S1 — `/programs` page

There is no `src/app/(public)/programs/page.tsx`. Drop it from the Task 1 context list. `/pricing` is the subscription-tier page.

### Summer 2026 scarcity

If the Summer 2026 scarcity bar lives at `src/app/(public)/summer/page.tsx` with a past date, delete the hard-coded date and render nothing when `end_date < today()`. If the component renders only statically, remove the scarcity messaging entirely — the page can still describe the clinic offer.

---

## Test tooling amendment (applies to S2, S3, S4, S5)

**Was:** vitest, `test/…`.
**Is:** **Jest 30** at `tests/{unit,integration,e2e,smoke}/…`. Use the repo's existing structure.

The S3 Track A concurrency test for `claim_cohort_seat` needs a local Supabase instance. Before running Docker, check available memory (`docker system info` + `Get-ComputerInfo | Select-Object TotalPhysicalMemory`). If RAM is constrained, run the concurrency test against a cheap Supabase project (`mathpivot-ci` or similar) instead of local Docker.

---

## S2 architecture amendments

### S2 Task 1 — split auth-user creation out of SQL

The master doc had the SQL function create the student auth user. **Change:** TypeScript admin-client code (mirror of `provisionParentAccount`) creates the auth user; the SQL function only writes the `users_profile` + `family_members` linkage.

Pattern:

```ts
// src/lib/provisioning/provisionStudentAccount.ts
export async function provisionStudentAccount(args: {
  parentUserId: string;
  studentName: string;
  studentGrade: number;
}): Promise<{ studentUserId: string | null }> {
  // 1. supabaseAdmin.auth.admin.createUser({ email_confirm: true, ... })
  // 2. rpc('link_student_to_family', { p_student_user_id, p_parent_user_id, p_name, p_grade })
}
```

Student accounts are created without a password. Access is through a magic link emailed to the parent, not through a hard-coded placeholder password. Do not reuse the legacy `"Welcome123!"` pattern.

### S2 Task 6 — grant coach role at invitation acceptance, gate actions on activation

Master's "elevate to tutor only after activated = true" was circular — activation requires acting as a coach to complete onboarding steps. **Change:**

- `acceptInvitation` (coach-application accept) grants `role = 'tutor'` immediately so onboarding can be completed.
- Every coach-only server action requires both `role = 'tutor'` **and** `coach_onboarding_progress.activated = true` for any **student-facing** write (cohort, invite, session log).
- Coach-facing-only pages (`/tutor/onboarding`, `/tutor/training`) require `role = 'tutor'` only — they help the coach reach activation.

### S2 Task 7 — audit scope

The audit lists the actions already distinguishing those requiring `activated`. Flag any that only check `role = 'tutor'` and recommend the two-gate pattern. Produce the list as `scripts/out/coach-action-audit-YYYYMMDD.md`.

---

## S3 Track A amendments

### Honest about the current RLS posture

The 2026-11-24 anon probe returned 200 + `Content-Range: */0` + empty body across all tested tables. This can mean either "RLS filters all rows to zero" or "table is empty." A follow-up service-role count has not been run to disambiguate. S3 Track A ships the fix regardless, but the sprint-report language changes from "we have confirmed RLS blocks" to "we have confirmed anon returns no rows today; S3 makes that behavior a property of policy, not grant."

---

## Naming amendment — gap report decisions

The gap report (`docs/coach-cohort-invites-gap-report.md`) uses its own D1–D11 numbering. **Rename those GD1–GD11** in all sprint reports to prevent collision with master doc D1–D9. The master doc's D1–D9 are the only D-items that drive sprint decisions.

---

## Updated S1 execution prompt

Replace the master doc's S1 execution prompt with this:

```
Execute Sprint S1 from
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-M1-MASTER.md,
amended by
C:\Users\HP\Documents\mathpivot\docs\SPRINT-MP-M1-AMENDMENTS-v1.md.

The amendments file overrides the master wherever they disagree.
Read both. Reconfirm: Advanced is $649, not $799. Public earning claim
is "Up to ~$7,000/month at full capacity" and nothing more specific.
Advanced cadence is "3 sessions/week + monthly one-to-one."

Standard constraints apply:
- Windows PowerShell on the operator machine. Absolute paths.
- Do NOT deploy. Do NOT run `vercel`. Eddy verifies and deploys.
- Do NOT modify curriculum, lesson, or content files.
- TypeScript strict. BOM-free UTF-8 writes.
- One commit per task so the review diff is readable.

Discovery pass before any edit: list every file you will change in S1,
cite the exact line where each conflicting value currently lives, and
show the proposed replacement. Stop and wait for my "proceed."

After each task: stop, report files changed + grep assertions ran, and
mark DoD items done / not done / blocked with reason. Do NOT start S2
in the same pass.

When you report "S1 complete", Eddy will deploy and re-verify before S2
begins.
```
