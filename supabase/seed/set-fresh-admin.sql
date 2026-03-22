-- ============================================================================
-- CHECK AND SET ADMIN FOR: fresh@mathpivot.com
-- User UID: 82b1fbc6-d511-41d8-845f-2e23f6d67818
-- ============================================================================
--
-- MathPivotOS Multi-Tenant Roles:
--   - super_admin: Platform-level admin (manages ALL organizations/tenants)
--   - admin: Organization-level admin (manages their own organization)
-- ============================================================================

-- First, check current role for this user
SELECT
    u.id,
    u.email,
    p.role,
    p.full_name,
    p.created_at,
    p.updated_at
FROM auth.users u
LEFT JOIN users_profile p ON u.id = p.id
WHERE u.id = '82b1fbc6-d511-41d8-845f-2e23f6d67818';

-- ============================================================================
-- OPTION 1: Set as SUPER_ADMIN (platform-level, manages all tenants)
-- Uncomment to use:
-- ============================================================================
-- UPDATE users_profile
-- SET role = 'super_admin',
--     updated_at = NOW()
-- WHERE id = '82b1fbc6-d511-41d8-845f-2e23f6d67818';

-- ============================================================================
-- OPTION 2: Set as ADMIN (organization-level, manages own organization)
-- ============================================================================
UPDATE users_profile
SET role = 'admin',
    updated_at = NOW()
WHERE id = '82b1fbc6-d511-41d8-845f-2e23f6d67818';

-- Verify the update
SELECT
    u.id,
    u.email,
    p.role,
    p.full_name,
    p.updated_at
FROM auth.users u
LEFT JOIN users_profile p ON u.id = p.id
WHERE u.id = '82b1fbc6-d511-41d8-845f-2e23f6d67818';
