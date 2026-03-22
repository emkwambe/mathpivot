-- ============================================================================
-- CHECK AND SET ADMIN FOR: fresh@mathpivot.com
-- User UID: 82b1fbc6-d511-41d8-845f-2e23f6d67818
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

-- Update user to admin role
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
