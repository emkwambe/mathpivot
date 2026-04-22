# External Pilot Runbook

## Pre-Pilot Checklist

### Deployment
- [ ] Push to main branch on GitHub
- [ ] Vercel auto-deploys from main
- [ ] Verify production URL loads (check landing page)
- [ ] Verify login works with a test account
- [ ] Verify role-based routing (admin→/admin, parent→/parent, etc.)
- [ ] Check security headers in browser DevTools (Network → Response Headers)

### Environment Variables (Vercel Dashboard)
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (production URL)

Optional but recommended:
- `RESEND_API_KEY` (email notifications)
- `STRIPE_SECRET_KEY` (test mode: sk_test_*)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test mode: pk_test_*)
- `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY` (AI tutor)

### Database
- [ ] All migrations applied (00001–00031)
- [ ] RLS policies active on all tables
- [ ] Seed data loaded (demo accounts, availability rules, credits)
- [ ] Verify parent can see students (test RLS)

---

## Daily Monitoring (First Week)

### Morning Check (5 min)
1. Open Supabase Dashboard → Logs → Postgres
   - Look for: RLS policy denials, query errors, slow queries
2. Check Vercel Dashboard → Deployments
   - Verify latest deployment is healthy (no build errors)
3. Open production URL → Login as admin
   - Check admin dashboard loads with real data

### Evening Check (5 min)
1. Supabase Dashboard → Auth → Users
   - Verify new signups have correct roles
2. Check for any user-reported issues (email/messages)
3. Review Supabase → Logs → Auth
   - Look for: failed logins, rate limit triggers

### What to Watch For
- **Blank pages**: Usually RLS blocking data. Check Supabase Postgres logs.
- **"Failed to load"**: Server action error. Check Vercel function logs.
- **Login loops**: Middleware redirect issue. Check browser DevTools → Network for redirect chains.
- **Missing students on parent dashboard**: RLS policy on students_profile or family_members.
- **Booking fails**: Check families.credit_balance and bookings RLS.

---

## Incident Response

### Severity 1: App Down / Login Broken
1. Check Vercel deployment status
2. Check Supabase project status (dashboard.supabase.com)
3. If deployment issue: Rollback via Vercel (see rollback checklist)
4. If Supabase issue: Check Supabase status page

### Severity 2: Feature Broken (booking, messaging, sessions)
1. Check browser console for error messages
2. Check Vercel function logs for the failing route
3. Check Supabase Postgres logs for RLS errors
4. If data issue: Use SQL Editor to inspect affected records
5. If code issue: Fix on branch, test locally, deploy

### Severity 3: Minor UX Issue
1. Document in issue tracker
2. Fix in next deployment cycle
3. Do not rush a fix that could break other things

---

## Support Triage

### Parent Reports Issue
1. Ask: "What page were you on? What did you click?"
2. Check their family_id: `SELECT * FROM family_members WHERE user_id = '[their-id]'`
3. Check if students exist: `SELECT * FROM students_profile WHERE family_id = '[family-id]'`
4. Check credit balance: `SELECT * FROM credit_ledger WHERE family_id = '[family-id]' ORDER BY created_at DESC LIMIT 1`

### Tutor Reports Issue
1. Check their tutor profile: `SELECT * FROM tutors_profile WHERE user_id = '[their-id]'`
2. Check bookings: `SELECT * FROM bookings WHERE tutor_user_id = '[their-id]' ORDER BY start_at DESC LIMIT 10`
3. Check if they can see sessions: `SELECT * FROM sessions WHERE booking_id IN (SELECT id FROM bookings WHERE tutor_user_id = '[their-id]')`

### Student Reports Issue
1. Check student profile: `SELECT * FROM students_profile WHERE user_id = '[their-id]'`
2. Check family membership: `SELECT * FROM family_members WHERE user_id = '[their-id]'`
3. Check bookings: `SELECT * FROM bookings WHERE student_user_id = '[their-id]'`
