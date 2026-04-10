# Sprint 0 — Security Hardening
## Tasks
- [ ] Fix tutor_profile RLS (remove public read)
- [ ] Fix tutor availability RLS (restrict to auth'd users)
- [ ] Add COPPA consent enforcement to student RLS
- [ ] Scope admin role to organization only
- [ ] Add verified_at check before tutor can access student data
- [ ] Implement password reset flow (Supabase built-in)
- [ ] Add rate limiting middleware on /api/auth/*
- [ ] Fix error messages (don't leak auth state)
- [ ] Add family auto-creation on parent signup
- [ ] Fix student/family_members divergence
- [ ] Enforce email verification in production
