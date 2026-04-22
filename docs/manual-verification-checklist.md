# Manual Verification Checklist

Run through this checklist after every deployment or significant change.

## Authentication
- [ ] Login with email/password works
- [ ] Signup creates new account with correct role
- [ ] Logout clears session
- [ ] Unauthenticated users redirected to /login
- [ ] Wrong-role users redirected to their dashboard
- [ ] Password reset sends email

## Parent Flow
- [ ] Dashboard shows students and credits
- [ ] Book Session shows students and tutors
- [ ] Availability slots load for selected date
- [ ] Booking completes successfully
- [ ] Success screen shows booking details
- [ ] Messages page accessible

## Tutor Flow
- [ ] Dashboard shows today's sessions and upcoming
- [ ] Pending bookings show Confirm button
- [ ] Confirm button changes status to confirmed
- [ ] My Sessions page loads
- [ ] Messages page accessible

## Student Flow
- [ ] Dashboard shows upcoming sessions
- [ ] Progress page loads
- [ ] AI Tutor chat works (or shows fallback)
- [ ] Messages page accessible

## Admin Flow
- [ ] Dashboard loads with stats
- [ ] Users page shows user list
- [ ] Calendar page shows events
- [ ] Leads page shows kanban board

## Messaging
- [ ] New Message button opens dialog
- [ ] Recipients load based on role
- [ ] Sending message works
- [ ] Thread appears in list
- [ ] Messages auto-refresh (within 5 seconds)
- [ ] Unread badge appears in sidebar

## Security
- [ ] /api/dev/setup-demo-accounts returns 404 in production
- [ ] Security headers present (check browser DevTools > Network > Response Headers)
- [ ] Cannot access /admin as parent/student/tutor
- [ ] Cannot access other users' message threads

## Error Handling
- [ ] 404 page shows for unknown routes
- [ ] Global error boundary catches crashes (test by temporarily throwing in a component)
