-- ============================================================================
-- CREATE ADMIN USER FOR MATHPIVOT
-- ============================================================================
--
-- USAGE: Run this in Supabase SQL Editor AFTER creating the user via:
-- 1. Supabase Dashboard > Authentication > Users > Add User
--    Email: demo.admin@mathpivot.com
--    Password: Demo123!
--
-- OR use this script with Supabase Admin API (requires service role key)
-- ============================================================================

-- Option 1: If user already exists in auth.users, update their profile role
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Find the user by email
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = 'demo.admin@mathpivot.com';

    IF admin_id IS NOT NULL THEN
        -- Update their profile to admin role
        UPDATE users_profile
        SET role = 'admin',
            full_name = 'Demo Admin',
            updated_at = NOW()
        WHERE id = admin_id;

        RAISE NOTICE 'Admin role set for user: demo.admin@mathpivot.com (ID: %)', admin_id;
    ELSE
        RAISE NOTICE 'User not found. Please create user first via Supabase Dashboard or Auth API.';
        RAISE NOTICE 'Email: demo.admin@mathpivot.com';
        RAISE NOTICE 'Password: Demo123!';
    END IF;
END $$;

-- ============================================================================
-- ALTERNATIVE: Create user directly using Supabase auth.users
-- This requires the pgcrypto extension and proper permissions
-- ============================================================================

-- First, ensure we have the extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user if not exists (Supabase-compatible approach)
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
        -- Note: This uses Supabase's internal schema
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
        -- But let's ensure the role is admin
        UPDATE users_profile
        SET role = 'admin'
        WHERE id = admin_id;

        RAISE NOTICE 'Admin user created: % (ID: %)', admin_email, admin_id;
    ELSE
        -- User exists, just update role
        UPDATE users_profile
        SET role = 'admin',
            full_name = 'Demo Admin',
            updated_at = NOW()
        WHERE id = admin_id;

        RAISE NOTICE 'Admin role updated for existing user: % (ID: %)', admin_email, admin_id;
    END IF;
END $$;

-- ============================================================================
-- VERIFY ADMIN USER
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
WHERE u.email = 'demo.admin@mathpivot.com';
