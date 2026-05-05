-- Migration: Session feedback from student/parent side

CREATE TABLE IF NOT EXISTS session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users_profile(id),
  attendance_confirmed BOOLEAN,
  reflection TEXT,
  parent_concern TEXT,
  submitted_by UUID NOT NULL REFERENCES users_profile(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_student ON session_feedback(student_id);

ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select" ON session_feedback FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = session_feedback.student_id
      AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "feedback_insert" ON session_feedback FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.student_id = session_feedback.student_id
      AND pe.parent_id = auth.uid()
    )
  );
