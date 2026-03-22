-- ============================================================================
-- Admin Changes: 2026-03-22
-- Set eddy@mpingo.ai as super_admin (platform-level admin)
-- ============================================================================

UPDATE users_profile
SET role = 'super_admin',
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'eddy@mpingo.ai'
);

-- Verify eddy@mpingo.ai is super_admin
SELECT
    u.email,
    p.role,
    p.full_name,
    p.updated_at
FROM auth.users u
JOIN users_profile p ON u.id = p.id
WHERE u.email = 'eddy@mpingo.ai';
