# Production Hardening Progress

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
