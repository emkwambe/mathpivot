# MathPivot TutorOS — Database Migration Backlog

## Pending Migrations (Prioritized)

### P0 — Required Before Scale

#### 1. Fix Monthly Recurrence Arithmetic
**Location:** `supabase/migrations/00023_scheduling_upgrades.sql`
**Issue:** `v_date := v_date + 28` adds a fixed 28 days instead of advancing to the same day next month.
**Fix:** Replace with `v_date := (DATE_TRUNC('month', v_date) + INTERVAL '1 month')::DATE + (EXTRACT(DAY FROM v_series.starts_on) - 1) * INTERVAL '1 day'`
**Impact:** Monthly recurring sessions drift by 0-3 days each month.

### P1 — Recommended Before Pilot

#### 2. Add Missing Indexes for Common Dashboard Queries
```sql
-- Availability lookups (tutor booking flow)
CREATE INDEX IF NOT EXISTS idx_availability_rules_tutor_day
  ON availability_rules(tutor_user_id, day_of_week) WHERE is_active = TRUE;

-- Availability exceptions (date-specific blocks)
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_tutor_date
  ON availability_exceptions(tutor_user_id, exception_date);

-- Payout periods ordering
CREATE INDEX IF NOT EXISTS idx_payout_periods_start
  ON payout_periods(period_start DESC);

-- Tutor payouts lookup
CREATE INDEX IF NOT EXISTS idx_tutor_payouts_tutor_period
  ON tutor_payouts(tutor_user_id, period_id);

-- Leads follow-up filtering
CREATE INDEX IF NOT EXISTS idx_leads_follow_up
  ON leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- Leads status for kanban grouping
CREATE INDEX IF NOT EXISTS idx_leads_status
  ON leads(status);
```

#### 3. Add `last_message_at` Trigger on Messages Table
Currently, `last_message_at` on `message_threads` must be updated manually.
Add a trigger to auto-update when a new message is inserted:
```sql
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_thread_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();
```

### P2 — Nice to Have

#### 4. Add Referrals Table Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_referrals_family ON referrals(referrer_family_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
```

#### 5. Add Invoices Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_invoices_family ON invoices(family_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date) WHERE status IN ('sent', 'overdue');
```

#### 6. Consider Partial Indexes for Active Records
```sql
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming
  ON bookings(start_at) WHERE status IN ('pending', 'confirmed');
```

---

## Schema Verification Summary

### Tables Verified (code references match schema)
- [x] bookings
- [x] sessions
- [x] student_skill_mastery (was incorrectly referenced as `mastery`)
- [x] availability_rules (was incorrectly referenced as `availability`)
- [x] availability_exceptions (was incorrectly referenced as `blocked_times`)
- [x] message_threads
- [x] messages
- [x] users_profile
- [x] families / family_members
- [x] students_profile / tutors_profile
- [x] skills / session_skills
- [x] credit_ledger
- [x] products / purchases
- [x] notifications
- [x] events
- [x] leads / lead_activities / trial_lessons
- [x] invoices / invoice_line_items
- [x] payout_periods / tutor_payouts
- [x] recurring_series
- [x] rooms
- [x] drop_in_slots / drop_in_attendance
- [x] code_problems / code_submissions
- [x] csv_import_jobs

### Existing Index Coverage
- Bookings: 5 indexes (tutor_time, family, student, tutor, start_at, status)
- Sessions: 2 indexes (booking_id, status)
- Messages: 3 indexes (thread+created_at, sender, unread)
- Threads: 3 indexes (participant_a, participant_b, last_message)
- Mastery: 1 index (student_user_id)
- Users: 2 indexes (role, email)
- Family members: 2 indexes (user_id, family_id)
