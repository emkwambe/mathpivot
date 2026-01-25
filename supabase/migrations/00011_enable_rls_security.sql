-- ============================================================================
-- ENABLE RLS ON TABLES FLAGGED BY SECURITY ADVISOR
-- Migration 00011: Fix RLS security issues
-- ============================================================================

-- Enable RLS on permissions table
ALTER TABLE IF EXISTS public.permissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on custom_roles table
ALTER TABLE IF EXISTS public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_role_assignments table
ALTER TABLE IF EXISTS public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on question_bank_categories table
ALTER TABLE IF EXISTS public.question_bank_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR PERMISSIONS TABLE
-- ============================================================================

-- Admin can manage all permissions
CREATE POLICY IF NOT EXISTS permissions_admin_all ON public.permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

-- All authenticated users can read permissions
CREATE POLICY IF NOT EXISTS permissions_read ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR CUSTOM_ROLES TABLE
-- ============================================================================

-- Admin can manage all custom roles
CREATE POLICY IF NOT EXISTS custom_roles_admin_all ON public.custom_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

-- All authenticated users can read custom roles
CREATE POLICY IF NOT EXISTS custom_roles_read ON public.custom_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR USER_ROLE_ASSIGNMENTS TABLE
-- ============================================================================

-- Admin can manage all role assignments
CREATE POLICY IF NOT EXISTS user_role_assignments_admin_all ON public.user_role_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can see their own role assignments
CREATE POLICY IF NOT EXISTS user_role_assignments_own ON public.user_role_assignments
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR QUESTION_BANK_CATEGORIES TABLE
-- ============================================================================

-- Admin and tutors can manage question categories
CREATE POLICY IF NOT EXISTS question_bank_categories_manage ON public.question_bank_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

-- All authenticated users can read question categories
CREATE POLICY IF NOT EXISTS question_bank_categories_read ON public.question_bank_categories
  FOR SELECT USING (auth.role() = 'authenticated');
