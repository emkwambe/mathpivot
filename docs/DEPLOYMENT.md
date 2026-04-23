# Deployment Guide

## Vercel Setup (Production)

### 1. Connect Repository
- Go to [vercel.com/new](https://vercel.com/new)
- Import the `emkwambe/mathpivot` GitHub repo
- Framework preset: **Next.js** (auto-detected)
- No `vercel.json` needed — Next.js 16 is auto-configured

### 2. Environment Variables

Paste these into Vercel > Project Settings > Environment Variables.
Mark all non-`NEXT_PUBLIC_` vars as **sensitive**.

#### Required (app won't function without these)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### Stripe (credit purchases)
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
After deploying, create a Stripe webhook at https://dashboard.stripe.com/webhooks pointing to `https://your-domain.vercel.app/api/stripe/webhook` for the `checkout.session.completed` event.

#### Sentry (error monitoring)
```
NEXT_PUBLIC_SENTRY_DSN=https://...@o...ingest.us.sentry.io/...
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=mathpivot
SENTRY_AUTH_TOKEN=sntrys_...
```
The `SENTRY_AUTH_TOKEN` enables source map uploads during build. Without it, Sentry still captures errors — you just won't get deobfuscated stack traces.

#### Email (transactional)
```
RESEND_API_KEY=re_...
```
Without this, booking confirmations and session summaries silently skip sending.

#### AI Services (optional)
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
```
Without these, the AI Tutor falls back to a non-AI mode.

#### Google Calendar (optional)
```
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

### 3. Deploy
Push to `main` — Vercel auto-builds. First deploy takes ~2 minutes.

### 4. Post-Deploy Checklist
- [ ] Visit `/login` — confirm Supabase auth works
- [ ] Create a test booking — confirm credits flow
- [ ] Trigger an error (e.g. visit `/api/health` with bad method) — confirm Sentry receives it
- [ ] Check Stripe webhook dashboard — confirm events are delivered
- [ ] Send a test email via admin or booking flow — confirm Resend delivers

---

## Staging Setup

### Separate Supabase Project
1. Create a new Supabase project (e.g. `mathpivot-staging`)
2. Run all migrations against it:
   ```bash
   supabase link --project-ref <staging-ref>
   supabase db push
   ```
3. Copy the staging URL + anon key into a Vercel "Preview" environment

### Vercel Preview Environments
Vercel automatically deploys preview URLs for every branch push. Set staging env vars under **Settings > Environment Variables > Preview** so preview deploys hit the staging Supabase project instead of production.

---

## Environment Variable Summary

| Variable | Required | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Same (keep secret) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel domain |
| `STRIPE_SECRET_KEY` | For payments | Stripe dashboard > API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Same |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe dashboard > Webhooks |
| `NEXT_PUBLIC_SENTRY_DSN` | For monitoring | Sentry > Project Settings > Client Keys |
| `SENTRY_ORG` | For source maps | Sentry > Organization Settings |
| `SENTRY_PROJECT` | For source maps | Sentry > Project Settings |
| `SENTRY_AUTH_TOKEN` | For source maps | Sentry > Auth Tokens |
| `RESEND_API_KEY` | For email | Resend dashboard |
| `ANTHROPIC_API_KEY` | For AI tutor | Anthropic console |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For AI tutor | Google AI Studio |
| `GOOGLE_CLIENT_ID` | For calendar | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | For calendar | Same |
