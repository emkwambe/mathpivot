# Production Hardening Progress

## Phase 4 — External Pilot Readiness

### 4.1 Pilot Operations
- **Status:** COMPLETE
- **Files created:** `docs/external-pilot-runbook.md`, `docs/rollback-checklist.md`, `docs/monitoring-checklist.md`
- **Coverage:** Pre-pilot checklist, daily/weekly monitoring, incident response, support triage, SQL diagnostic queries

### 4.2 Sentry/Error Monitoring
- **Status:** CODE READY — scaffolding exists
- **What exists:** Global error boundary (`src/app/global-error.tsx`), ErrorBoundary component, NEXT_PUBLIC_SENTRY_DSN support
- **Human action:** Run `npx @sentry/wizard@latest -i nextjs`, set DSN in Vercel

### 4.3 Stripe Pilot Verification
- **Status:** DOCS COMPLETE
- **Files created:** `docs/stripe-pilot-verification.md`
- **Coverage:** Full manual test flow, test cards, webhook setup, verification queries, common issues

### 4.4 CSP Hardening
- **Status:** REPORT-ONLY MODE DEPLOYED
- **Files changed:** `next.config.ts`
- **What exists:** Content-Security-Policy-Report-Only header with allowlist for self, Supabase, Stripe, Sentry
- **Next step:** After verifying no false positives in browser console, change to enforcing mode

### 4.5 Admin Visibility
- **Status:** DOCS COMPLETE
- **Coverage:** SQL diagnostic queries in runbook, monitoring checklist with weekly database health checks

### 4.6 Playwright
- **Status:** EXISTING SCAFFOLDING SUFFICIENT
- **What exists:** `playwright.config.ts` with chromium/firefox/webkit projects, 2 E2E spec files
- **No changes needed:** Scaffolding is adequate for future expansion

## Phase 3 — Quality Hardening

### 3.1 Integration Tests
- **Status:** COMPLETE
- **Files changed:** `tests/integration/critical-flows.test.ts` (new), `docs/testing-strategy.md` (new)
- **Coverage:** Booking validation (3 tests), session lifecycle (2 tests), messaging (1 test), auth enforcement (2 tests), consent flow (2 tests), audit wiring (3 tests) = 13 new test cases
- **Limitation:** Tests validate logic and structure, not live database interactions

### 3.2 Email Notifications
- **Status:** CODE COMPLETE — already wired
- **Finding:** `sendBookingConfirmation()` called in booking.ts, `sendSessionSummary()` called in session.ts. Both use fire-and-forget (.catch()). Resend integration exists in `src/lib/email/index.ts`.
- **Human action:** Set `RESEND_API_KEY` in environment variables to enable real email delivery

### 3.3 Mobile Responsiveness
- **Status:** IMPROVED
- **Files changed:** `src/components/layouts/DashboardLayout.tsx`
- **Fixes:** Added Messages to mobile bottom nav (was showing only first 4 items), added z-40 to prevent overlap, added bottom padding (pb-20 on mobile) so content doesn't hide behind nav, reduced mobile padding from p-6 to p-4

### 3.4 Polling Optimization
- **Status:** OPTIMIZED
- **Files changed:** `src/components/UnreadBadge.tsx`, `src/app/(dashboard)/messages/[threadId]/ThreadRefresher.tsx`
- **Changes:** UnreadBadge: 15s → 30s polling interval. ThreadRefresher: 5s → 8s with visibility-aware polling (only refreshes when tab is visible, saves server resources when user switches tabs)
- **Upgrade path:** Replace polling with Supabase Realtime subscriptions (documented in testing-strategy.md)

## Phase 2 — Tier 2 Pilot Blockers

### 2.1 COPPA Consent Flow
- **Status:** IMPLEMENTED — requires legal review of consent text
- **Files changed:** `src/app/actions/consent.ts` (new), `src/app/actions/family.ts` (wired consent requests), `src/components/ConsentBanner.tsx` (new), `src/app/(dashboard)/parent/page.tsx` (banner integration)
- **What works:** Adding a student triggers consent requests. Parent dashboard shows consent banner with approve buttons. Consent events are audit-logged.
- **Legal note:** Consent text is placeholder — final wording requires legal review before production use with real minors.

### 2.2 Tutor Start Session Button
- **Status:** COMPLETE
- **Files changed:** `src/app/(dashboard)/tutor/StartSessionButton.tsx` (new), `src/app/(dashboard)/tutor/page.tsx` (button added to Today's Schedule)
- **What works:** Confirmed bookings in Today's Schedule show "Start Session" button. Clicking it creates a session record, transitions booking to in_progress, and navigates to session detail page where whiteboard and mastery tools become active.

### 2.3 Placeholder Page Labeling
- **Status:** COMPLETE
- **Files changed:** `src/components/layouts/DashboardLayout.tsx`
- **What changed:** Added `beta?: boolean` flag to NavItem interface. Non-core features (Certifications, Programs, Competitions, Equipment, Career Pathways, Referrals, Whiteboards, Desmos) marked with subtle "Beta" label in sidebar. Core features (Dashboard, Book Session, Credits, Sessions, Messages, etc.) remain unlabeled.

### 2.4 Audit Logging
- **Status:** WIRED — critical actions now log
- **Files changed:** `src/app/actions/booking.ts`, `src/app/actions/session.ts`, `src/app/actions/users.ts`, `src/app/actions/consent.ts`
- **Actions now audited:** Booking creation, session start, session completion, user role changes, consent approvals
- **Remaining:** Additional actions could be audited (booking cancellation, CSV imports, etc.) but core compliance actions are covered.

### 2.5 Stripe Flow
- **Status:** CODE COMPLETE — requires Stripe credentials for live testing
- **Finding:** End-to-end flow exists: purchase page → checkout API → Stripe session → webhook → credit addition
- **Human action required:** Test with real Stripe test keys (sk_test_*, pk_test_*)
- **Verification checklist added to:** `docs/manual-verification-checklist.md`

## Phase 1 — Tier 1 Production Blockers

### 1.1 Security Headers
- **Status:** COMPLETE
- **Files changed:** `next.config.ts`
- **Headers added:** X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control, Strict-Transport-Security (production only)
- **CSP note:** Not added yet — requires careful allowlisting of Supabase, Stripe, Google fonts, etc. Should be added after deployment testing.
- **Remaining:** CSP header needs to be added after verifying which external domains are required.

### 1.2 Error Monitoring
- **Status:** STUB COMPLETE — requires Sentry account
- **Files changed:** `src/app/global-error.tsx` (new)
- **What exists:** Global error boundary catches unhandled errors, logs to console, reports to monitoring endpoint in production
- **Human action required:** 
  1. Create Sentry account at https://sentry.io
  2. Install `@sentry/nextjs` package
  3. Run `npx @sentry/wizard@latest -i nextjs`
  4. Set `NEXT_PUBLIC_SENTRY_DSN` in environment variables
- **Remaining:** Full Sentry SDK integration (requires account)

### 1.3 Dev Endpoint Gating
- **Status:** COMPLETE
- **Files changed:** `src/app/api/dev/setup-demo-accounts/route.ts`
- **Fix:** Changed production response from 403 (reveals endpoint exists) to 404 (looks like endpoint doesn't exist) for both GET and POST
- **Remaining:** None

### 1.4 Deployment Configuration
- **Status:** COMPLETE
- **Files changed:** `docs/staging-setup-checklist.md`, `docs/release-readiness-status.md`
- **Note:** Next.js 16 on Vercel requires no `vercel.json` — it auto-detects. All config is in `next.config.ts` and env vars.
- **Human action required:** Connect GitHub repo to Vercel, set environment variables
- **Remaining:** Actual deployment (requires Vercel account)

### 1.5 Staging Readiness
- **Status:** DOCS COMPLETE
- **Files changed:** `docs/staging-setup-checklist.md`
- **Remaining:** Create separate Supabase project for staging
