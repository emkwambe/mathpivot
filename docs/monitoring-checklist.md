# Monitoring Checklist

## Daily Checks (First Pilot Week)

### 1. Application Health
- [ ] Production URL loads (< 3 seconds)
- [ ] Login page renders
- [ ] At least one role dashboard loads successfully

### 2. Supabase Dashboard
- [ ] Check: Database → Logs → Recent queries
  - No repeated 403/RLS errors
  - No slow queries (> 5 seconds)
- [ ] Check: Auth → Users
  - New signups have correct roles assigned
  - No suspicious login patterns
- [ ] Check: Storage → Buckets
  - session-attachments bucket accessible

### 3. Vercel Dashboard
- [ ] Check: Deployments → Latest
  - Build succeeded
  - No function errors in logs
- [ ] Check: Analytics (if enabled)
  - Page load times reasonable
  - No spike in 500 errors

### 4. User-Reported Issues
- [ ] Check support channels for reported bugs
- [ ] Prioritize: auth > booking > messaging > other

---

## Weekly Checks

### Database Health
```sql
-- Check active user count
SELECT role, COUNT(*) FROM users_profile GROUP BY role;

-- Check booking volume
SELECT status, COUNT(*) FROM bookings GROUP BY status;

-- Check session completion rate
SELECT status, COUNT(*) FROM sessions GROUP BY status;

-- Check credit balances
SELECT f.name, f.credit_balance FROM families f ORDER BY credit_balance;

-- Check pending consents
SELECT status, COUNT(*) FROM parental_consents GROUP BY status;

-- Check audit log volume
SELECT action, COUNT(*) FROM audit_logs 
WHERE occurred_at > NOW() - INTERVAL '7 days' 
GROUP BY action ORDER BY COUNT(*) DESC;
```

### Performance Indicators
- Average page load time (Vercel Analytics)
- API response times (Vercel Function logs)
- Database query count per page (Supabase logs)

---

## Alert Triggers (Manual Until Automated)

| Condition | Severity | Action |
|-----------|----------|--------|
| App returns 500 for > 5 minutes | Critical | Check Vercel logs, consider rollback |
| Login fails for all users | Critical | Check Supabase auth, check middleware |
| New user can't see dashboard data | High | Check RLS policies, check family setup |
| Booking creates but doesn't appear | High | Check bookings RLS, check credit_balance |
| Messages don't refresh | Medium | Check ThreadRefresher, check message_threads RLS |
| Email not delivered | Low | Check RESEND_API_KEY, check Resend dashboard |

---

## Sentry Setup (When Available)

After creating Sentry account:
1. Run: `npx @sentry/wizard@latest -i nextjs`
2. Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel env vars
3. Verify: Trigger a test error and check Sentry dashboard
4. Set up alerts for: Error rate > 10/hour, new error types
