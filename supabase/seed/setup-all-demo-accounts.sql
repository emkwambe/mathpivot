-- ============================================================================
-- COMBINED SETUP: Migration 00020 + All Demo Accounts
-- Run this in Supabase SQL Editor
-- Password for all demo accounts: Demo123!
-- ============================================================================

-- ============================================================================
-- PART 1: Fix is_admin() to include super_admin (Migration 00020)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_role() IN ('admin', 'super_admin'), false)
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.role
  FROM public.users_profile up
  WHERE up.id = auth.uid()
$$;

-- ============================================================================
-- PART 2: Create Demo Accounts
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to create a demo user + profile in one shot
CREATE OR REPLACE FUNCTION _create_demo_user(
  p_email TEXT,
  p_password TEXT,
  p_role user_role,
  p_full_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Create auth user
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('role', p_role::text, 'full_name', p_full_name),
      false, 'authenticated', 'authenticated',
      '', ''
    );

    -- Create identity (required for email login)
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email),
      'email',
      v_user_id::text,
      NOW(), NOW(), NOW()
    );

    RAISE NOTICE 'Created user: % (ID: %)', p_email, v_user_id;
  ELSE
    RAISE NOTICE 'User already exists: % (ID: %)', p_email, v_user_id;
  END IF;

  -- Upsert users_profile (don't rely on trigger)
  INSERT INTO users_profile (id, email, role, full_name, created_at, updated_at)
  VALUES (v_user_id, p_email, p_role, p_full_name, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    role = p_role,
    full_name = p_full_name,
    updated_at = NOW();

  RETURN v_user_id;
END;
$$;

-- Create all demo accounts
SELECT _create_demo_user('demo.superadmin@mathpivot.com', 'Demo123!', 'super_admin', 'Demo Super Admin');
SELECT _create_demo_user('demo.admin@mathpivot.com',      'Demo123!', 'admin',       'Demo Admin');
SELECT _create_demo_user('demo.tutor@mathpivot.com',      'Demo123!', 'tutor',       'Demo Tutor');
SELECT _create_demo_user('demo.parent@mathpivot.com',     'Demo123!', 'parent',      'Demo Parent');
SELECT _create_demo_user('demo.student@mathpivot.com',    'Demo123!', 'student',     'Demo Student');

-- Create tutor profile for demo tutor
INSERT INTO tutors_profile (user_id, bio, specialties, is_active, created_at, updated_at)
SELECT id, 'Demo tutor for testing', ARRAY['algebra', 'calculus'], true, NOW(), NOW()
FROM users_profile WHERE email = 'demo.tutor@mathpivot.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create family + family_members for demo parent & student
DO $$
DECLARE
  v_parent_id UUID;
  v_student_id UUID;
  v_family_id UUID;
BEGIN
  SELECT id INTO v_parent_id FROM users_profile WHERE email = 'demo.parent@mathpivot.com';
  SELECT id INTO v_student_id FROM users_profile WHERE email = 'demo.student@mathpivot.com';

  IF v_parent_id IS NOT NULL AND v_student_id IS NOT NULL THEN
    -- Create family if not exists
    SELECT id INTO v_family_id FROM families WHERE primary_parent_user_id = v_parent_id;

    IF v_family_id IS NULL THEN
      INSERT INTO families (id, name, primary_parent_user_id, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Demo Family', v_parent_id, NOW(), NOW())
      RETURNING id INTO v_family_id;
    END IF;

    -- Add parent to family
    INSERT INTO family_members (family_id, user_id, member_role, created_at)
    VALUES (v_family_id, v_parent_id, 'parent', NOW())
    ON CONFLICT (family_id, user_id) DO NOTHING;

    -- Add student to family
    INSERT INTO family_members (family_id, user_id, member_role, created_at)
    VALUES (v_family_id, v_student_id, 'student', NOW())
    ON CONFLICT (family_id, user_id) DO NOTHING;

    -- Create student profile
    INSERT INTO students_profile (user_id, family_id, grade, course_track, created_at, updated_at)
    VALUES (v_student_id, v_family_id, 9, 'math_1', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Demo family created (ID: %) with parent and student', v_family_id;
  END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS _create_demo_user;

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT
  u.email,
  p.role,
  p.full_name,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  EXISTS(SELECT 1 FROM auth.identities i WHERE i.user_id = u.id) AS has_identity
FROM auth.users u
JOIN users_profile p ON u.id = p.id
WHERE u.email LIKE 'demo.%@mathpivot.com'
ORDER BY p.role;
