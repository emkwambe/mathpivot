-- ============================================================================
-- Migration 00023: Scheduling Upgrades
-- Sprint 3 — Recurring lessons, group sessions, rooms, calendar sync
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE recurrence_pattern AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE room_type AS ENUM ('classroom', 'lab', 'office', 'virtual');
CREATE TYPE sync_direction AS ENUM ('push', 'pull', 'bidirectional');

-- ============================================================================
-- ROOMS / LOCATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    room_type room_type NOT NULL DEFAULT 'classroom',
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
    location TEXT,                            -- building/address
    floor TEXT,
    equipment TEXT[] DEFAULT '{}',            -- e.g. {"whiteboard", "projector", "computers"}
    is_virtual BOOLEAN NOT NULL DEFAULT false,
    virtual_link TEXT,                        -- Zoom/Meet link for virtual rooms
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ADD room_id TO BOOKINGS
-- ============================================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_group_session BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_id UUID;

CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_recurrence ON bookings(recurrence_id) WHERE recurrence_id IS NOT NULL;

-- ============================================================================
-- GROUP SESSION ENROLLMENTS
-- For group sessions: multiple students per booking
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_session_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES auth.users(id),
    family_id UUID NOT NULL REFERENCES families(id),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    canceled_at TIMESTAMPTZ,
    attendance_status attendance_status,
    UNIQUE(booking_id, student_user_id)
);

CREATE INDEX idx_group_students_booking ON group_session_students(booking_id);
CREATE INDEX idx_group_students_student ON group_session_students(student_user_id);

-- ============================================================================
-- RECURRING LESSON SERIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS recurring_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_user_id UUID NOT NULL REFERENCES tutors_profile(user_id) ON DELETE CASCADE,
    student_user_id UUID REFERENCES auth.users(id),    -- NULL for group recurring
    family_id UUID REFERENCES families(id),
    room_id UUID REFERENCES rooms(id),
    -- Schedule
    pattern recurrence_pattern NOT NULL DEFAULT 'weekly',
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    modality modality NOT NULL DEFAULT 'online',
    -- Group settings
    is_group BOOLEAN NOT NULL DEFAULT false,
    max_students INTEGER DEFAULT 1,
    subject TEXT,
    title TEXT,                               -- e.g. "AP Calc Study Group"
    -- Recurrence window
    starts_on DATE NOT NULL,
    ends_on DATE,                             -- NULL = indefinite
    -- State
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_generated INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_time < end_time)
);

CREATE INDEX idx_recurring_tutor ON recurring_series(tutor_user_id);
CREATE INDEX idx_recurring_active ON recurring_series(is_active) WHERE is_active = true;

-- ============================================================================
-- CALENDAR SYNC TOKENS
-- Stores OAuth tokens for Google Calendar
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_sync_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    calendar_id TEXT,                         -- Google calendar ID
    sync_direction sync_direction NOT NULL DEFAULT 'push',
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- ============================================================================
-- CALENDAR SYNC LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    booking_id UUID REFERENCES bookings(id),
    provider TEXT NOT NULL DEFAULT 'google',
    external_event_id TEXT,
    action TEXT NOT NULL,                     -- 'created', 'updated', 'deleted'
    status TEXT NOT NULL DEFAULT 'success',   -- 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_log_user ON calendar_sync_log(user_id, created_at DESC);
CREATE INDEX idx_sync_log_booking ON calendar_sync_log(booking_id);

-- ============================================================================
-- FUNCTION: Generate bookings from a recurring series
-- Creates bookings for the next N weeks
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_recurring_bookings(
    p_series_id UUID,
    p_weeks_ahead INTEGER DEFAULT 4
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_series recurring_series%ROWTYPE;
    v_date DATE;
    v_end_date DATE;
    v_start_at TIMESTAMPTZ;
    v_end_at TIMESTAMPTZ;
    v_count INTEGER := 0;
    v_existing INTEGER;
BEGIN
    SELECT * INTO v_series FROM recurring_series WHERE id = p_series_id AND is_active = true;
    IF v_series.id IS NULL THEN
        RETURN 0;
    END IF;

    -- Calculate date range
    v_date := GREATEST(v_series.starts_on, CURRENT_DATE);
    v_end_date := CURRENT_DATE + (p_weeks_ahead * 7);
    IF v_series.ends_on IS NOT NULL THEN
        v_end_date := LEAST(v_end_date, v_series.ends_on);
    END IF;

    -- Walk forward to next matching day_of_week
    WHILE EXTRACT(DOW FROM v_date) != v_series.day_of_week LOOP
        v_date := v_date + 1;
    END LOOP;

    -- Generate bookings
    WHILE v_date <= v_end_date LOOP
        v_start_at := (v_date || ' ' || v_series.start_time)::TIMESTAMPTZ;
        v_end_at := (v_date || ' ' || v_series.end_time)::TIMESTAMPTZ;

        -- Skip if booking already exists for this slot
        SELECT COUNT(*) INTO v_existing
        FROM bookings
        WHERE recurrence_id = p_series_id
          AND start_at = v_start_at
          AND status != 'canceled';

        IF v_existing = 0 AND v_series.student_user_id IS NOT NULL THEN
            INSERT INTO bookings (
                family_id, student_user_id, parent_user_id, tutor_user_id,
                start_at, end_at, modality, status, room_id,
                is_group_session, max_students, recurrence_id, notes
            )
            SELECT
                v_series.family_id,
                v_series.student_user_id,
                f.primary_parent_user_id,
                v_series.tutor_user_id,
                v_start_at, v_end_at,
                v_series.modality, 'confirmed',
                v_series.room_id,
                v_series.is_group, v_series.max_students,
                p_series_id,
                'Auto-generated from recurring series'
            FROM families f
            WHERE f.id = v_series.family_id;

            v_count := v_count + 1;
        END IF;

        -- Advance by pattern
        IF v_series.pattern = 'weekly' THEN
            v_date := v_date + 7;
        ELSIF v_series.pattern = 'biweekly' THEN
            v_date := v_date + 14;
        ELSIF v_series.pattern = 'monthly' THEN
            v_date := v_date + 28;
        END IF;
    END LOOP;

    -- Update counter
    UPDATE recurring_series
    SET total_generated = total_generated + v_count, updated_at = NOW()
    WHERE id = p_series_id;

    RETURN v_count;
END;
$$;

-- ============================================================================
-- FUNCTION: Check room conflicts
-- ============================================================================
CREATE OR REPLACE FUNCTION check_room_conflict(
    p_room_id UUID,
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE room_id = p_room_id
          AND status NOT IN ('canceled')
          AND tstzrange(start_at, end_at) && tstzrange(p_start_at, p_end_at)
          AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    );
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Rooms: everyone can read, admin manages
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY rooms_select ON rooms
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY rooms_admin ON rooms
    FOR ALL TO authenticated
    USING (is_admin());

-- Group session students
ALTER TABLE group_session_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_students_select ON group_session_students
    FOR SELECT TO authenticated
    USING (
        student_user_id = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.tutor_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM family_members fm WHERE fm.family_id = group_session_students.family_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY group_students_admin ON group_session_students
    FOR ALL TO authenticated
    USING (is_admin());

-- Recurring series
ALTER TABLE recurring_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurring_tutor_select ON recurring_series
    FOR SELECT TO authenticated
    USING (tutor_user_id = auth.uid() OR is_admin());

CREATE POLICY recurring_admin ON recurring_series
    FOR ALL TO authenticated
    USING (is_admin());

-- Calendar sync tokens: own only
ALTER TABLE calendar_sync_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_tokens_own ON calendar_sync_tokens
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Calendar sync log: own only + admin
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_log_select ON calendar_sync_log
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin());
