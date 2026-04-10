-- ============================================================================
-- Migration 00029: Onboarding Fixes
-- Auto-create tutor profile on signup, improve handle_new_user trigger
-- ============================================================================

-- ============================================================
-- 1. UPDATE handle_new_user to also create tutor profile
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_email TEXT;
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_email := NEW.email;

    -- Create users_profile
    INSERT INTO public.users_profile (id, email, role, full_name, created_at, updated_at)
    VALUES (NEW.id, v_email, v_role::user_role, v_full_name, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        role = v_role::user_role,
        full_name = v_full_name,
        updated_at = NOW();

    -- Auto-create role-specific profiles
    IF v_role = 'tutor' THEN
        INSERT INTO public.tutors_profile (user_id, bio, specialties, is_active, created_at, updated_at)
        VALUES (NEW.id, '', '{}', true, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. ALSO keep handle_new_parent_family for parent auto-family
-- (make sure it doesn't conflict)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_parent_family()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_family_id UUID;
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Family');

    IF v_role = 'parent' THEN
        -- Check if family already exists
        IF NOT EXISTS (SELECT 1 FROM public.families WHERE primary_parent_user_id = NEW.id) THEN
            v_family_id := gen_random_uuid();
            INSERT INTO public.families (id, name, primary_parent_user_id, created_at, updated_at)
            VALUES (v_family_id, v_full_name || '''s Family', NEW.id, NOW(), NOW());

            INSERT INTO public.family_members (family_id, user_id, member_role, created_at)
            VALUES (v_family_id, NEW.id, 'parent', NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_family ON auth.users;
CREATE TRIGGER on_auth_user_created_family
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_parent_family();
