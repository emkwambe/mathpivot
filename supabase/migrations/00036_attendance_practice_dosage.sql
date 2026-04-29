-- Migration: Attendance tracking and practice logging for dosage compliance

-- ============================================================
-- SESSION ATTENDANCE (track show/no-show per enrollment)
-- ============================================================
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id),
  session_id UUID REFERENCES sessions(id),
  booking_id UUID REFERENCES bookings(id),
  student_id UUID NOT NULL REFERENCES users_profile(id),
  coach_id UUID NOT NULL REFERENCES users_profile(id),
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'attended', 'no_show', 'cancelled_by_student', 'cancelled_by_coach', 'rescheduled')),
  noted_by UUID REFERENCES users_profile(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PRACTICE LOGS (between-session accountability)
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users_profile(id),
  enrollment_id UUID REFERENCES program_enrollments(id),
  practice_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  concepts_practiced UUID[] DEFAULT '{}',
  description TEXT,
  logged_by UUID NOT NULL REFERENCES users_profile(id),
  verified_by_coach BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, practice_date)
);

-- ============================================================
-- DOSAGE TARGETS (per enrollment, set by coach or program)
-- ============================================================
ALTER TABLE program_enrollments
  ADD COLUMN IF NOT EXISTS target_sessions_per_month INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS target_practice_days_per_week INTEGER DEFAULT 3;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON session_attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON session_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON session_attendance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON session_attendance(status);
CREATE INDEX IF NOT EXISTS idx_practice_student ON practice_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_date ON practice_logs(practice_date);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select" ON session_attendance FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.id = session_attendance.enrollment_id
      AND pe.parent_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "attendance_insert" ON session_attendance FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "attendance_update" ON session_attendance FOR UPDATE TO authenticated
  USING (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "practice_select" ON practice_logs FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR logged_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = practice_logs.student_id
      AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "practice_insert" ON practice_logs FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = practice_logs.student_id
      AND pe.parent_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
