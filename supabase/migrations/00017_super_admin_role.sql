-- ============================================================================
-- Migration: Add Super Admin Role for Multi-Tenant Architecture
-- MathPivotOS requires two admin levels:
--   - super_admin: Platform-level admin (manages all organizations/tenants)
--   - admin: Organization-level admin (manages their own organization)
-- ============================================================================

-- =============================================================================
-- ADD SUPER_ADMIN TO USER_ROLE ENUM
-- =============================================================================

-- Add super_admin to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin' BEFORE 'admin';

-- =============================================================================
-- UPDATE has_permission FUNCTION FOR SUPER_ADMIN
-- =============================================================================

-- Super admins have all permissions across all organizations
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_code TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role VARCHAR(50);
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Get user's base role
  SELECT role INTO v_user_role FROM users_profile WHERE id = p_user_id;

  -- Super admins have ALL permissions (platform-wide)
  IF v_user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Admins have all permissions (within their organization scope)
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Check custom role assignments
  SELECT TRUE INTO v_has_permission
  FROM user_role_assignments ura
  JOIN custom_roles cr ON cr.id = ura.role_id
  WHERE ura.user_id = p_user_id
    AND p_permission_code = ANY(cr.permissions)
    AND (ura.expires_at IS NULL OR ura.expires_at > NOW());

  IF v_has_permission THEN
    RETURN TRUE;
  END IF;

  -- Check default permissions for role
  SELECT TRUE INTO v_has_permission
  FROM permissions
  WHERE code = p_permission_code
    AND v_user_role = ANY(default_for_roles);

  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check if user is super_admin
-- =============================================================================

CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = p_user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- HELPER FUNCTION: Check if user is admin or super_admin
-- =============================================================================

CREATE OR REPLACE FUNCTION is_admin_or_above(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = p_user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- UPDATE current_role FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM users_profile WHERE id = auth.uid()
$$;

-- =============================================================================
-- UPDATE RLS POLICIES FOR SUPER_ADMIN ACCESS
-- =============================================================================

-- Organizations: Super admin can manage ALL organizations
DROP POLICY IF EXISTS organizations_super_admin ON organizations;
CREATE POLICY organizations_super_admin ON organizations
  FOR ALL USING (is_super_admin());

-- Audit logs: Super admin can read all
DROP POLICY IF EXISTS audit_logs_super_admin ON audit_logs;
CREATE POLICY audit_logs_super_admin ON audit_logs
  FOR SELECT USING (is_super_admin());

-- Users profile: Super admin can manage all users
DROP POLICY IF EXISTS users_profile_super_admin ON users_profile;
CREATE POLICY users_profile_super_admin ON users_profile
  FOR ALL USING (is_super_admin());

-- Parental consents: Super admin access
DROP POLICY IF EXISTS consents_super_admin_access ON parental_consents;
CREATE POLICY consents_super_admin_access ON parental_consents
  FOR ALL USING (is_super_admin());

-- Tutor verifications: Super admin can manage all
DROP POLICY IF EXISTS tutor_verifications_super_admin ON tutor_verifications;
CREATE POLICY tutor_verifications_super_admin ON tutor_verifications
  FOR ALL USING (is_super_admin());

-- Custom roles: Super admin can manage system-wide roles
DROP POLICY IF EXISTS custom_roles_super_admin ON custom_roles;
CREATE POLICY custom_roles_super_admin ON custom_roles
  FOR ALL USING (is_super_admin());

-- User role assignments: Super admin can manage all
DROP POLICY IF EXISTS user_role_assignments_super_admin ON user_role_assignments;
CREATE POLICY user_role_assignments_super_admin ON user_role_assignments
  FOR ALL USING (is_super_admin());

-- API keys: Super admin can view all
DROP POLICY IF EXISTS api_keys_super_admin ON api_keys;
CREATE POLICY api_keys_super_admin ON api_keys
  FOR ALL USING (is_super_admin());

-- =============================================================================
-- ADD SUPER_ADMIN PERMISSIONS
-- =============================================================================

INSERT INTO permissions (code, name, description, category, default_for_roles, is_sensitive, requires_audit) VALUES
-- Super admin specific permissions
('super_admin.organizations', 'Manage Organizations', 'Create and manage all organizations', 'super_admin', ARRAY['super_admin'], TRUE, TRUE),
('super_admin.tenants', 'Manage Tenants', 'Full tenant management', 'super_admin', ARRAY['super_admin'], TRUE, TRUE),
('super_admin.platform_settings', 'Platform Settings', 'Configure platform-wide settings', 'super_admin', ARRAY['super_admin'], TRUE, TRUE),
('super_admin.all_users', 'Manage All Users', 'Manage users across all organizations', 'super_admin', ARRAY['super_admin'], TRUE, TRUE),
('super_admin.billing', 'Platform Billing', 'Manage platform-wide billing and subscriptions', 'super_admin', ARRAY['super_admin'], TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  default_for_roles = EXCLUDED.default_for_roles;

-- Update existing admin permissions to include super_admin
UPDATE permissions
SET default_for_roles = array_append(default_for_roles, 'super_admin')
WHERE 'admin' = ANY(default_for_roles)
  AND NOT ('super_admin' = ANY(default_for_roles));

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION is_super_admin IS 'Check if user has super_admin role (platform-level admin)';
COMMENT ON FUNCTION is_admin_or_above IS 'Check if user has admin or super_admin role';
