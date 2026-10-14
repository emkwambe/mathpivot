-- Migration 00058: Scope reads on cohort enrollments and diagnostics
--
-- 00041 created these read policies with USING (true) and no TO clause:
--   coaching_schedules      "schedules_read"
--   cohort_enrollments      "cohort_read"      (student ids, diagnostic_score, payment_status, notes)
--   diagnostic_assessments  "diagnostic_read"  (answers, domain scores, overall score)
-- A policy without TO applies to PUBLIC, so anonymous requests with the
-- public key could read every row.
--
-- Fix:
--   * coaching_schedules: signed-in users only. Rows hold slot times,
--     labels and coach ids, no student data.
--   * cohort_enrollments and diagnostic_assessments: admins, the student,
--     the student's parent, and coaches who work with the student
--     (bookings via can_access_student, an active or paused program
--     enrollment, or a seat in one of the coach's schedules).
--   * coach_schedule_overview: run with the caller's rights, so its
--     counts follow the policies above instead of the view owner's.
--
-- Write policies are deliberately not changed here. The app inserts into
-- these tables with the user's session (schedules.ts, placement.ts,
-- diagnostics.ts), but no INSERT/UPDATE policies exist in the migrations.
-- Check the live policies (query at the end) before relying on this file.

CREATE OR REPLACE FUNCTION public.can_view_student_record(p_student UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.can_access_student(p_student)
    OR EXISTS (
      SELECT 1 FROM public.program_enrollments pe
      WHERE pe.student_id = p_student
        AND (pe.coach_id = auth.uid() OR pe.parent_id = auth.uid())
        AND pe.status IN ('active', 'paused')
    )
    OR EXISTS (
      SELECT 1
      FROM public.cohort_enrollments ce
      JOIN public.coaching_schedules cs ON cs.id = ce.schedule_id
      WHERE ce.student_id = p_student
        AND (cs.coach_id = auth.uid() OR ce.parent_id = auth.uid())
    )
$$;

REVOKE ALL ON FUNCTION public.can_view_student_record(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_student_record(UUID) TO authenticated;

-- coaching_schedules ---------------------------------------------------------
DROP POLICY IF EXISTS "schedules_read" ON coaching_schedules;
DROP POLICY IF EXISTS "schedules_read_signed_in" ON coaching_schedules;
CREATE POLICY "schedules_read_signed_in"
  ON coaching_schedules FOR SELECT
  TO authenticated
  USING (true);

-- cohort_enrollments ---------------------------------------------------------
DROP POLICY IF EXISTS "cohort_read" ON cohort_enrollments;
DROP POLICY IF EXISTS "cohort_read_related" ON cohort_enrollments;
CREATE POLICY "cohort_read_related"
  ON cohort_enrollments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR student_id = auth.uid()
    OR parent_id = auth.uid()
    OR public.can_view_student_record(student_id)
  );

-- diagnostic_assessments -----------------------------------------------------
DROP POLICY IF EXISTS "diagnostic_read" ON diagnostic_assessments;
DROP POLICY IF EXISTS "diagnostic_read_related" ON diagnostic_assessments;
CREATE POLICY "diagnostic_read_related"
  ON diagnostic_assessments FOR SELECT
  TO authenticated
  USING (
    administered_by = auth.uid()
    OR public.can_view_student_record(student_id)
  );

-- coach_schedule_overview ----------------------------------------------------
ALTER VIEW public.coach_schedule_overview SET (security_invoker = true);
REVOKE ALL ON public.coach_schedule_overview FROM anon;

-- Before applying, list every live policy on these tables (read-only).
-- Policies are OR'ed, so any extra permissive policy created outside the
-- migrations would keep the old exposure open:
--   select tablename, policyname, roles, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('coaching_schedules','cohort_enrollments','diagnostic_assessments')
--   order by tablename, policyname;
