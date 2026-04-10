-- ============================================================================
-- Migration 00020: Fix is_admin() to include super_admin
--
-- The is_admin() function from migration 00002 only checks role = 'admin'.
-- This blocks super_admin users from accessing ALL tables that use is_admin()
-- in their RLS policies (families, students_profile, bookings, sessions, etc).
--
-- Fix: Update is_admin() to check for both 'admin' and 'super_admin'.
-- This is the simplest fix because 50+ RLS policies already reference is_admin().
-- ============================================================================

-- Update is_admin() to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_role() IN ('admin', 'super_admin'), false)
$$;

-- Also ensure current_role() has SECURITY DEFINER so it can read users_profile
-- (re-create to match the pattern from migration 00002)
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
