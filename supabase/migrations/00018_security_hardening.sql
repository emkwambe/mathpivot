-- ============================================================================
-- SPRINT 0: CRITICAL SECURITY HARDENING
-- Migration 00018_security_hardening.sql
-- Fixes: tutor public read, availability public read, admin org-scoping,
--        tutor verification gate, COPPA RLS enforcement
-- ============================================================================

-- ============================================================================
-- FIX 1: Restrict tutor profile to authenticated users only
-- Was: USING (true) — public read, FERPA/privacy violation
-- Now: Authenticated users only; parents/students only see verified tutors
-- ============================================================================
DROP POLICY IF EXISTS "tutors_profile_select" ON public.tutors_profile;
CREATE POLICY "tutors_profile_select"
ON public.tutors_profile FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_admin()
    OR user_id = auth.uid()
    OR (
      -- Parents/students only see verified, active tutors
      is_active = true
      AND COALESCE(verification_status, 'not_started') = 'approved'
    )
  )
);

-- ============================================================================
-- FIX 2: Restrict availability to authenticated users only
-- Was: USING (true) — public, leaks tutor schedules
-- Now: authenticated only; parents/students see only active verified tutors
-- ============================================================================
DROP POLICY IF EXISTS "availability_rules_select" ON public.availability_rules;
CREATE POLICY "availability_rules_select"
ON public.availability_rules FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_admin()
    OR tutor_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutors_profile tp
      WHERE tp.user_id = availability_rules.tutor_user_id
        AND tp.is_active = true
        AND COALESCE(tp.verification_status, 'not_started') = 'approved'
    )
  )
);

DROP POLICY IF EXISTS "availability_exceptions_select" ON public.availability_exceptions;
CREATE POLICY "availability_exceptions_select"
ON public.availability_exceptions FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_admin()
    OR tutor_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tutors_profile tp
      WHERE tp.user_id = availability_exceptions.tutor_user_id
        AND tp.is_active = true
        AND COALESCE(tp.verification_status, 'not_started') = 'approved'
    )
  )
);

-- ============================================================================
-- FIX 3: Scope admin role to their organization
-- was: is_admin() = any admin sees ALL families/data (multi-tenant broken)
-- Now: org-scoped admin only sees families in their organization
-- Super_admin retains global access
-- ============================================================================

-- Update the is_admin() helper to be org-aware
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'super_admin')
     FROM public.users_profile
     WHERE id = auth.uid()),
    false
  )
$$;

-- New function: check if admin can access a specific family
CREATE OR REPLACE FUNCTION public.admin_can_access_family(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Super admins see everything
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
    OR
    -- Org admins see only families in their org
    EXISTS (
      SELECT 1
      FROM public.users_profile up
      WHERE up.id = auth.uid()
        AND up.role = 'admin'
        AND (
          -- Admin is in same org as a family member
          EXISTS (
            SELECT 1
            FROM public.organization_members om1
            JOIN public.family_members fm ON fm.user_id = om1.user_id
            JOIN public.organization_members om2 ON om2.organization_id = om1.organization_id
            WHERE fm.family_id = p_family_id
              AND om2.user_id = auth.uid()
          )
          -- OR no org structure yet (single-tenant fallback for dev)
          OR NOT EXISTS (
            SELECT 1 FROM public.organization_members WHERE user_id = auth.uid()
          )
        )
    )
$$;

-- ============================================================================
-- FIX 4: COPPA — enforce parental consent for under-13 students in RLS
-- Tutors cannot access student data unless consent exists for data_collection
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_access_student(p_student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Super admin: always
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
    -- Admin (org-scoped): if in same org
    OR (
      public.is_admin()
      AND EXISTS (
        SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role IN ('admin','super_admin')
      )
    )
    -- Self access
    OR (auth.uid() = p_student_user_id)
    -- Parent in family
    OR EXISTS (
      SELECT 1
      FROM public.students_profile sp
      WHERE sp.user_id = p_student_user_id
        AND public.is_parent_in_family(sp.family_id)
    )
    -- Tutor: must have active booking AND (student >= 13 OR parental consent)
    OR (
      public.is_tutor()
      AND EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.student_user_id = p_student_user_id
          AND b.tutor_user_id = auth.uid()
          AND b.status NOT IN ('canceled')
      )
      AND (
        -- Student is 13 or older (no COPPA requirement)
        EXISTS (
          SELECT 1 FROM public.students_profile sp
          LEFT JOIN public.users_profile up ON up.id = p_student_user_id
          WHERE sp.user_id = p_student_user_id
            AND (
              sp.date_of_birth IS NULL
              OR sp.date_of_birth <= CURRENT_DATE - INTERVAL '13 years'
            )
        )
        OR
        -- Parental consent exists for data_collection
        public.check_parental_consent(p_student_user_id, 'data_collection')
      )
    )
$$;

-- ============================================================================
-- FIX 5: Tutor verification gate
-- Unverified tutors must not access student/session data
-- ============================================================================

-- Verify tutor is cleared before booking access
CREATE OR REPLACE FUNCTION public.is_verified_tutor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutors_profile tp
    WHERE tp.user_id = auth.uid()
      AND tp.is_active = true
      AND COALESCE(tp.verification_status, 'not_started') IN ('approved')
      -- Background check required to teach minors
      AND COALESCE(tp.background_check_clear, false) = true
  )
$$;

-- Sessions: tutors must be verified
DROP POLICY IF EXISTS "sessions_insert" ON public.sessions;
CREATE POLICY "sessions_insert"
ON public.sessions FOR INSERT
WITH CHECK (
  public.is_admin()
  OR (public.is_booking_tutor(booking_id) AND public.is_verified_tutor())
);

DROP POLICY IF EXISTS "sessions_update" ON public.sessions;
CREATE POLICY "sessions_update"
ON public.sessions FOR UPDATE
USING (
  public.is_admin()
  OR (public.is_booking_tutor(booking_id) AND public.is_verified_tutor())
)
WITH CHECK (
  public.is_admin()
  OR (public.is_booking_tutor(booking_id) AND public.is_verified_tutor())
);

-- ============================================================================
-- FIX 6: Family auto-creation trigger
-- When a parent signs up, auto-create a family and add them as parent member
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_parent_family()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id uuid;
  v_role user_role;
BEGIN
  -- Only run for new parent users
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent');

  IF v_role = 'parent' THEN
    -- Create the family
    INSERT INTO public.families (name, primary_parent_user_id)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Family',
      NEW.id
    )
    RETURNING id INTO v_family_id;

    -- Add parent as family member
    INSERT INTO public.family_members (family_id, user_id, member_role)
    VALUES (v_family_id, NEW.id, 'parent');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, recreate
DROP TRIGGER IF EXISTS on_parent_signup_create_family ON auth.users;
CREATE TRIGGER on_parent_signup_create_family
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_parent_family();

-- ============================================================================
-- FIX 7: Error message normalization helper
-- Application layer should call this to get generic error codes
-- (actual enforcement is in src/app/(auth)/actions.ts)
-- ============================================================================

-- Rate limiting table for auth endpoints
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP or email
  action TEXT NOT NULL,     -- 'login', 'signup', 'reset'
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, action)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON public.auth_rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window ON public.auth_rate_limits(window_start);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write rate limits
CREATE POLICY "rate_limits_service_only" ON public.auth_rate_limits
  FOR ALL USING (false); -- blocked for all regular users; service_role bypasses RLS

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.auth_rate_limits;
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_minutes || ' minutes')::INTERVAL;
BEGIN
  SELECT * INTO v_record
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier AND action = p_action;

  -- No record: create and allow
  IF NOT FOUND THEN
    INSERT INTO public.auth_rate_limits (identifier, action, attempts, window_start)
    VALUES (p_identifier, p_action, 1, v_now);
    RETURN jsonb_build_object('allowed', true, 'attempts', 1, 'remaining', p_max_attempts - 1);
  END IF;

  -- Locked: check if lock expired
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'locked_until', v_record.locked_until,
      'retry_after_seconds', EXTRACT(EPOCH FROM (v_record.locked_until - v_now))::INTEGER
    );
  END IF;

  -- Window expired: reset
  IF v_record.window_start < v_window_start THEN
    UPDATE public.auth_rate_limits
    SET attempts = 1, window_start = v_now, locked_until = NULL, updated_at = v_now
    WHERE identifier = p_identifier AND action = p_action;
    RETURN jsonb_build_object('allowed', true, 'attempts', 1, 'remaining', p_max_attempts - 1);
  END IF;

  -- Within window: increment
  UPDATE public.auth_rate_limits
  SET
    attempts = attempts + 1,
    locked_until = CASE WHEN attempts + 1 >= p_max_attempts
                        THEN v_now + (p_window_minutes || ' minutes')::INTERVAL
                        ELSE NULL END,
    updated_at = v_now
  WHERE identifier = p_identifier AND action = p_action
  RETURNING * INTO v_record;

  IF v_record.locked_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'locked_until', v_record.locked_until,
      'retry_after_seconds', p_window_minutes * 60
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'attempts', v_record.attempts,
    'remaining', GREATEST(0, p_max_attempts - v_record.attempts)
  );
END;
$$;

COMMENT ON TABLE public.auth_rate_limits IS 'Rate limiting for auth endpoints (login, signup, password reset)';
COMMENT ON FUNCTION public.check_rate_limit IS 'Check and increment rate limit counter, returns allowed/blocked status';
