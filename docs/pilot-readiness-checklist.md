# MathPivot TutorOS — Pilot Readiness Checklist

## Pre-Pilot Verification Steps

### 1. Authentication & Access Control
- [ ] Login with email/password works for each role (admin, tutor, parent, student)
- [ ] Logout clears session and redirects to login
- [ ] Unauthenticated users are redirected to /login
- [ ] Authenticated users on /login are redirected to their dashboard
- [ ] Admin can access all /admin/* routes
- [ ] Tutor cannot access /admin/* routes (redirected to /tutor)
- [ ] Parent cannot access /tutor/* or /admin/* routes
- [ ] Student cannot access /parent/*, /tutor/*, or /admin/* routes
- [ ] Password reset flow sends email and allows update
- [ ] All roles can access /messages and /settings

### 2. Parent Booking Flow
- [ ] Parent can see their students listed
- [ ] Parent can select a tutor and date for booking
- [ ] Available time slots load correctly for selected tutor/date
- [ ] Booking creation succeeds with sufficient credits
- [ ] Booking creation fails gracefully with insufficient credits
- [ ] Booking appears in parent dashboard after creation
- [ ] Booking confirmation shows success feedback

### 3. Tutor Availability & Sessions
- [ ] Tutor can set weekly availability rules
- [ ] Tutor can remove availability slots
- [ ] Tutor can view upcoming sessions
- [ ] Tutor can start a session from a confirmed booking
- [ ] Tutor can end a session with notes and next steps
- [ ] Session completion deducts a credit from the family
- [ ] Tutor can add notes to a completed session
- [ ] Tutor can update student mastery levels

### 4. Messaging
- [ ] Thread list shows all conversations for the logged-in user
- [ ] Threads are ordered by most recent message
- [ ] Opening a thread shows messages in chronological order
- [ ] Sending a message succeeds and appears immediately
- [ ] Unread count displays and clears when thread is opened
- [ ] Users cannot access threads they don't participate in
- [ ] Empty state shown when no conversations exist
- [ ] Error state shown when message fetch fails

### 5. Student Experience
- [ ] Student dashboard shows upcoming sessions and skill stats
- [ ] Student can view their progress/mastery levels
- [ ] Student can access AI tutor chat
- [ ] Student session history shows completed sessions with notes

### 6. Admin Operations
- [ ] Admin dashboard loads without errors
- [ ] Admin can view and manage users (role changes)
- [ ] Admin calendar shows bookings for the current week
- [ ] Admin can navigate between calendar weeks
- [ ] Admin can view and manage leads (kanban board)
- [ ] Admin can view invoices and mark as paid
- [ ] Admin can view payroll periods and generate payouts
- [ ] Admin can import students/tutors via CSV

### 7. Progress & Reports
- [ ] Student progress page shows mastery levels by skill category
- [ ] Parent can view student progress summaries
- [ ] Tutor can assess student eligibility (5-factor assessment)
- [ ] Weekly reports page loads for parents

### 8. Edge Cases & Error Handling
- [ ] 404 page displays correctly for unknown routes
- [ ] Pages with no data show meaningful empty states
- [ ] Failed API/action calls show error messages (not blank screens)
- [ ] Form submissions show loading state during processing
- [ ] Double-clicking submit buttons doesn't create duplicates

---

## Known Limitations for Pilot

### Documented Technical Debt
1. **Monthly recurrence** uses +28 days instead of proper month arithmetic (DB migration needed)
2. **No pagination** on messaging threads or messages (acceptable for <100 conversations)
3. **No rate limiting** on message sending (acceptable for pilot scale)
4. **No realtime updates** — messaging requires page refresh to see new messages
5. **Timezone handling** uses browser-local time for date rendering; may show incorrect times for users in different timezones than the tutoring center

### Operational Prerequisites
- [ ] Supabase project configured with all required tables/migrations
- [ ] Environment variables set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- [ ] At least one admin account created
- [ ] RLS policies verified enabled on all tables
- [ ] STRIPE_SECRET_KEY configured (if billing features used)
- [ ] ANTHROPIC_API_KEY configured (if AI tutor used)

### Monitoring Priorities During Pilot
1. Watch for auth redirect loops (middleware + layout double-redirect)
2. Monitor Supabase logs for RLS policy denials
3. Check that session completions persist (internal_notes, completed_at)
4. Verify credit deductions happen on session completion
5. Monitor for 500 errors on booking/availability pages

---

## Smoke Test Automation Candidates

High-value tests for future automation:
1. **Auth flow**: Login → verify redirect to correct dashboard → logout
2. **Role protection**: Attempt to access /admin as student → verify redirect
3. **Booking creation**: Select student → select tutor → select date → book
4. **Session lifecycle**: Start session → end with notes → verify completion
5. **Message send**: Open thread → send message → verify it appears
6. **Progress display**: Navigate to /student/progress → verify mastery data renders
