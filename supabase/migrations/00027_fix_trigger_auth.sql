-- ============================================================================
-- Migration 00027: Fix trigger breaking admin/super_admin login
--
-- The prevent_role_self_change trigger queries auth.uid() which is not
-- available during GoTrue's internal auth operations, causing 500 errors
-- for admin/super_admin users.
--
-- Fix: Make the trigger safe by checking if auth.uid() is available first.
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uid UUID;
    v_changer_role user_role;
BEGIN
    -- If role is not changing, always allow
    IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
        RETURN NEW;
    END IF;

    -- Get current auth user (may be NULL during GoTrue internal operations)
    BEGIN
        v_uid := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_uid := NULL;
    END;

    -- If no auth context (GoTrue internal, service role, trigger), allow
    -- Service role operations are trusted (admin client, GoTrue)
    IF v_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get the role of whoever is making the change
    SELECT role INTO v_changer_role FROM users_profile WHERE id = v_uid;

    -- Only admin/super_admin can change roles
    IF v_changer_role IS NULL OR v_changer_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;

    -- Non-super-admins cannot grant super_admin
    IF NEW.role = 'super_admin' AND v_changer_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can grant super_admin role';
    END IF;

    RETURN NEW;
END;
$$;
