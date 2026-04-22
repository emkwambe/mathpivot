# Rollback Checklist

## When to Rollback
- App is completely down (blank pages for all users)
- Login is broken (redirect loops)
- Critical data corruption risk (bookings creating duplicates, credits being wrongly deducted)
- Security vulnerability discovered in production

## Do NOT Rollback For
- Single page error (fix forward instead)
- Styling issues
- Non-critical feature broken
- Performance degradation (investigate first)

## Vercel Rollback Steps

### Option 1: Instant Rollback (recommended)
1. Go to Vercel Dashboard → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → "Promote to Production"
4. The previous deployment becomes the active production deployment instantly

### Option 2: Git Revert
```bash
# Revert the last commit
git revert HEAD
git push origin main

# Or revert to a specific commit
git revert <commit-hash>
git push origin main
```

### Option 3: Force Deploy Previous Commit
```bash
git log --oneline -10  # Find the good commit hash
git checkout <good-commit-hash>
git push origin main --force  # CAUTION: only if you understand the implications
```

## Database Rollback

### IMPORTANT: Database changes are NOT automatically rolled back with code rollback

If a migration was applied that needs reversal:
1. Go to Supabase SQL Editor
2. Write a reverse migration (DROP/ALTER statements)
3. Test on staging first
4. Apply to production

### Supabase Point-in-Time Recovery
- Available on Pro plan
- Can restore to any point in the last 7 days
- Go to: Supabase Dashboard → Settings → Database → Backups

## Post-Rollback Verification
- [ ] Landing page loads
- [ ] Login works
- [ ] Parent dashboard shows students
- [ ] Tutor dashboard shows sessions
- [ ] Messages page loads
- [ ] No error in browser console
