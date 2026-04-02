-- ============================================================================
-- CREATE DEMO ADMIN USERS FOR MATHPIVOT
-- Creates demo.admin@mathpivot.com and demo.superadmin@mathpivot.com
-- ============================================================================
--
-- USAGE: Run this in Supabase SQL Editor
-- These accounts are for development and testing purposes only
-- Password for all demo accounts: Demo123!
-- ============================================================================

-- Ensure we have the extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- CREATE DEMO ADMIN USER
-- ============================================================================
DO $$
DECLARE
    admin_id UUID;
    admin_email TEXT := 'demo.admin@mathpivot.com';
    admin_password TEXT := 'Demo123!';
BEGIN
    -- Check if user already exists
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

    IF admin_id IS NULL THEN
        -- Generate a new UUID for the admin
        admin_id := gen_random_uuid();

        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            confirmation_token,
            recovery_token
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"role": "admin", "full_name": "Demo Admin"}'::jsonb,
            false,
            'authenticated',
            'authenticated',
            '',
            ''
        );

        -- Insert into auth.identities (required for email login)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            created_at,
            updated_at,
            last_sign_in_at
        ) VALUES (
            gen_random_uuid(),
            admin_id,
            jsonb_build_object('sub', admin_id::text, 'email', admin_email),
            'email',
            admin_id::text,
            NOW(),
            NOW(),
            NOW()
        );

        -- The handle_new_user trigger should create users_profile automatically
        -- But ensure the role is admin
        UPDATE users_profile
        SET role = 'admin',
            full_name = 'Demo Admin'
        WHERE id = admin_id;

        RAISE NOTICE 'Demo admin user created: % (ID: %)', admin_email, admin_id;
    ELSE
        -- User exists, just update role
        UPDATE users_profile
        SET role = 'admin',
            full_name = 'Demo Admin',
            updated_at = NOW()
        WHERE id = admin_id;

        RAISE NOTICE 'Demo admin role updated for existing user: % (ID: %)', admin_email, admin_id;
    END IF;
END $$;

-- ============================================================================
-- CREATE DEMO SUPER ADMIN USER
-- ============================================================================
DO $$
DECLARE
    super_admin_id UUID;
    super_admin_email TEXT := 'demo.superadmin@mathpivot.com';
    super_admin_password TEXT := 'Demo123!';
BEGIN
    -- Check if user already exists
    SELECT id INTO super_admin_id FROM auth.users WHERE email = super_admin_email;

    IF super_admin_id IS NULL THEN
        -- Generate a new UUID for the super admin
        super_admin_id := gen_random_uuid();

        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            confirmation_token,
            recovery_token
        ) VALUES (
            super_admin_id,
            '00000000-0000-0000-0000-000000000000',
            super_admin_email,
            crypt(super_admin_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"role": "super_admin", "full_name": "Demo Super Admin"}'::jsonb,
            false,
            'authenticated',
            'authenticated',
            '',
            ''
        );

        -- Insert into auth.identities (required for email login)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            created_at,
            updated_at,
            last_sign_in_at
        ) VALUES (
            gen_random_uuid(),
            super_admin_id,
            jsonb_build_object('sub', super_admin_id::text, 'email', super_admin_email),
            'email',
            super_admin_id::text,
            NOW(),
            NOW(),
            NOW()
        );

        -- The handle_new_user trigger should create users_profile automatically
        -- Ensure the role is super_admin
        UPDATE users_profile
        SET role = 'super_admin',
            full_name = 'Demo Super Admin'
        WHERE id = super_admin_id;

        RAISE NOTICE 'Demo super admin user created: % (ID: %)', super_admin_email, super_admin_id;
    ELSE
        -- User exists, just update role
        UPDATE users_profile
        SET role = 'super_admin',
            full_name = 'Demo Super Admin',
            updated_at = NOW()
        WHERE id = super_admin_id;

        RAISE NOTICE 'Demo super admin role updated for existing user: % (ID: %)', super_admin_email, super_admin_id;
    END IF;
END $$;

-- ============================================================================
-- VERIFY DEMO ADMIN USERS
-- ============================================================================
SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    p.role,
    p.full_name,
    p.created_at
FROM auth.users u
LEFT JOIN users_profile p ON u.id = p.id
WHERE u.email IN ('demo.admin@mathpivot.com', 'demo.superadmin@mathpivot.com')
ORDER BY p.role;
