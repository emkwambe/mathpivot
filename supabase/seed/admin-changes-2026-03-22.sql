-- ============================================================================
-- Admin Changes: 2026-03-22
-- ============================================================================
-- 1. Delete user: fresh@mathpivot.com
-- 2. Set super_admin: eddy@mpingo.ai
-- ============================================================================

-- ============================================================================
-- DELETE USER: fresh@mathpivot.com
-- ============================================================================
-- This will cascade delete from users_profile due to ON DELETE CASCADE

DELETE FROM auth.users
WHERE email = 'fresh@mathpivot.com';

-- ============================================================================
-- SET SUPER_ADMIN: eddy@mpingo.ai
-- ============================================================================

UPDATE users_profile
SET role = 'super_admin',
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'eddy@mpingo.ai'
);

-- ============================================================================
-- VERIFY CHANGES
-- ============================================================================

-- Verify fresh@mathpivot.com is deleted
SELECT 'fresh@mathpivot.com deleted:' AS check,
       NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fresh@mathpivot.com') AS success;

-- Verify eddy@mpingo.ai is super_admin
SELECT
    u.email,
    p.role,
    p.full_name,
    p.updated_at
FROM auth.users u
JOIN users_profile p ON u.id = p.id
WHERE u.email = 'eddy@mpingo.ai';
