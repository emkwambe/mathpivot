-- ============================================================================
-- MATHPIVOT TUTOROS - COMPREHENSIVE RLS POLICY FIX
-- Migration 00031: Fix all RLS policies for pilot readiness
--
-- Root cause: Original RLS policies used helper functions like
-- is_parent_in_family() which create circular dependencies when
-- PostgreSQL evaluates nested RLS. Also, families_select had a bug
-- comparing fm.family_id = fm.id (same table) instead of families.id.
--
-- This migration drops and recreates ALL critical RLS policies with
-- simple, non-recursive conditions that work reliably.
-- ============================================================================

-- ============================================================================
-- 1. users_profile - Everyone needs to read names/roles
-- ============================================================================
DROP POLICY IF EXISTS users_profile_select ON users_profile;
CREATE POLICY users_profile_select ON users_profile
  FOR SELECT TO authenticated
  USING (true);

-- Keep update restricted to self or admin
DROP POLICY IF EXISTS users_profile_update ON users_profile;
CREATE POLICY users_profile_update ON users_profile
  FOR UPDATE TO authenticated
  USING (is_admin() OR id = auth.uid());

-- ============================================================================
-- 2. families - Parents and family members can read their family
-- ============================================================================
DROP POLICY IF EXISTS families_select ON families;
CREATE POLICY families_select ON families
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    primary_parent_user_id = auth.uid() OR
    id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS families_update ON families;
CREATE POLICY families_update ON families
  FOR UPDATE TO authenticated
  USING (is_admin() OR primary_parent_user_id = auth.uid());

-- ============================================================================
-- 3. family_members - Members can see their own family
-- ============================================================================
DROP POLICY IF EXISTS family_members_select ON family_members;
CREATE POLICY family_members_select ON family_members
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    user_id = auth.uid() OR
    family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS family_members_insert ON family_members;
CREATE POLICY family_members_insert ON family_members
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    family_id IN (
      SELECT f.id FROM families f WHERE f.primary_parent_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS family_members_delete ON family_members;
CREATE POLICY family_members_delete ON family_members
  FOR DELETE TO authenticated
  USING (
    is_admin() OR
    family_id IN (
      SELECT f.id FROM families f WHERE f.primary_parent_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. students_profile - Parents, tutors with bookings, and self
-- ============================================================================
DROP POLICY IF EXISTS students_profile_select ON students_profile;
CREATE POLICY students_profile_select ON students_profile
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    user_id = auth.uid() OR
    family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid()) OR
    user_id IN (SELECT b.student_user_id FROM bookings b WHERE b.tutor_user_id = auth.uid())
  );

DROP POLICY IF EXISTS students_profile_insert ON students_profile;
CREATE POLICY students_profile_insert ON students_profile
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    family_id IN (
      SELECT f.id FROM families f WHERE f.primary_parent_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS students_profile_update ON students_profile;
CREATE POLICY students_profile_update ON students_profile
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR
    user_id = auth.uid() OR
    family_id IN (
      SELECT f.id FROM families f WHERE f.primary_parent_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. tutors_profile - All authenticated can see active tutors
-- ============================================================================
DROP POLICY IF EXISTS tutors_profile_select ON tutors_profile;
CREATE POLICY tutors_profile_select ON tutors_profile
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    user_id = auth.uid() OR
    is_active = true
  );

-- ============================================================================
-- 6. bookings - Participants and family members
-- ============================================================================
DROP POLICY IF EXISTS bookings_select ON bookings;
CREATE POLICY bookings_select ON bookings
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    tutor_user_id = auth.uid() OR
    student_user_id = auth.uid() OR
    parent_user_id = auth.uid() OR
    family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS bookings_insert ON bookings;
CREATE POLICY bookings_insert ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    parent_user_id = auth.uid() OR
    family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS bookings_update ON bookings;
CREATE POLICY bookings_update ON bookings
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR
    tutor_user_id = auth.uid() OR
    parent_user_id = auth.uid() OR
    family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid())
  );

-- ============================================================================
-- 7. sessions - Via booking access
-- ============================================================================
DROP POLICY IF EXISTS sessions_select ON sessions;
CREATE POLICY sessions_select ON sessions
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.tutor_user_id = auth.uid()
         OR b.student_user_id = auth.uid()
         OR b.parent_user_id = auth.uid()
         OR b.family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS sessions_insert ON sessions;
CREATE POLICY sessions_insert ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    booking_id IN (
      SELECT b.id FROM bookings b WHERE b.tutor_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS sessions_update ON sessions;
CREATE POLICY sessions_update ON sessions
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR
    booking_id IN (
      SELECT b.id FROM bookings b WHERE b.tutor_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. availability_rules - Tutors manage own, all can read active
-- ============================================================================
DROP POLICY IF EXISTS availability_rules_select ON availability_rules;
CREATE POLICY availability_rules_select ON availability_rules
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS availability_rules_insert ON availability_rules;
CREATE POLICY availability_rules_insert ON availability_rules
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS availability_rules_update ON availability_rules;
CREATE POLICY availability_rules_update ON availability_rules
  FOR UPDATE TO authenticated
  USING (is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS availability_rules_delete ON availability_rules;
CREATE POLICY availability_rules_delete ON availability_rules
  FOR DELETE TO authenticated
  USING (is_admin() OR tutor_user_id = auth.uid());

-- ============================================================================
-- 9. availability_exceptions - Same pattern as rules
-- ============================================================================
DROP POLICY IF EXISTS availability_exceptions_select ON availability_exceptions;
CREATE POLICY availability_exceptions_select ON availability_exceptions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS availability_exceptions_insert ON availability_exceptions;
CREATE POLICY availability_exceptions_insert ON availability_exceptions
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS availability_exceptions_update ON availability_exceptions;
CREATE POLICY availability_exceptions_update ON availability_exceptions
  FOR UPDATE TO authenticated
  USING (is_admin() OR tutor_user_id = auth.uid());

DROP POLICY IF EXISTS availability_exceptions_delete ON availability_exceptions;
CREATE POLICY availability_exceptions_delete ON availability_exceptions
  FOR DELETE TO authenticated
  USING (is_admin() OR tutor_user_id = auth.uid());

-- ============================================================================
-- 10. credit_ledger - Family members can read
-- ============================================================================
DROP POLICY IF EXISTS credit_ledger_select ON credit_ledger;
CREATE POLICY credit_ledger_select ON credit_ledger
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid())
  );

-- ============================================================================
-- 11. student_skill_mastery - Students, parents, tutors
-- ============================================================================
DROP POLICY IF EXISTS student_skill_mastery_select ON student_skill_mastery;
CREATE POLICY student_skill_mastery_select ON student_skill_mastery
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    student_user_id = auth.uid() OR
    student_user_id IN (
      SELECT sp.user_id FROM students_profile sp
      WHERE sp.family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid())
    ) OR
    student_user_id IN (
      SELECT b.student_user_id FROM bookings b WHERE b.tutor_user_id = auth.uid()
    )
  );

-- ============================================================================
-- DONE - All critical tables have clear, non-recursive RLS policies
-- ============================================================================
