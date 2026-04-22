# Staging Environment Setup Checklist

## Prerequisites
- [ ] Vercel account (free tier works for staging)
- [ ] Separate Supabase project for staging (do NOT use production database)
- [ ] Stripe test-mode keys (sk_test_*, pk_test_*)

## Supabase Staging Setup
1. [ ] Create new Supabase project (e.g., "MathPivot Staging")
2. [ ] Run all migrations: `npx supabase db push` against staging project
3. [ ] Verify RLS policies applied (check Supabase dashboard > Auth > Policies)
4. [ ] Run seed data script (pilot-seed SQL from docs)
5. [ ] Copy staging project URL and keys

## Vercel Staging Deployment
1. [ ] Connect GitHub repo to Vercel
2. [ ] Create "Preview" environment (automatic for PRs)
3. [ ] Set environment variables for staging:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_STAGING_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...staging...
SUPABASE_SERVICE_ROLE_KEY=eyJ...staging...
NEXT_PUBLIC_APP_URL=https://your-staging.vercel.app
NODE_ENV=production
```

4. [ ] Optional integrations:
```
ANTHROPIC_API_KEY=sk-ant-...       (for AI tutor)
STRIPE_SECRET_KEY=sk_test_...      (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...    (from Stripe dashboard)
NEXT_PUBLIC_SENTRY_DSN=https://...  (from Sentry)
```

## Verification After Deploy
- [ ] Landing page loads at staging URL
- [ ] Login works with demo accounts (run setup-demo-accounts in dev)
- [ ] Role-based routing works (admin→/admin, parent→/parent, etc.)
- [ ] Booking flow completes (requires seed data)
- [ ] Messages page loads
- [ ] No console errors in browser

## Environment Separation Rules
- NEVER use production Supabase keys in staging
- NEVER use production Stripe live keys in staging
- Always use `sk_test_*` Stripe keys for staging
- Staging database can be reset at any time
- Production database requires migration planning

## Migration Order
When deploying a new version:
1. Run migrations on staging Supabase first
2. Test all flows on staging
3. Then run migrations on production Supabase
4. Deploy production
