-- Migration 00057: Stop sign-up metadata from granting admin roles
--
-- handle_new_user (00029) copied the role straight from
-- raw_user_meta_data->>'role'. That metadata is supplied by whoever calls
-- auth.signUp, including direct calls with the public key, so a caller
-- could create an account with role 'admin' or 'super_admin'. The
-- prevent_role_self_change guard (00026/00027) only fires BEFORE UPDATE,
-- so it never saw this INSERT path.
--
-- Fix: one function decides the starting role.
--   * raw_app_meta_data->>'role' is honoured as-is. Only the service role
--     (admin API) can set app_metadata, so this is the path for creating
--     admins from trusted server code.
--   * raw_user_meta_data->>'role' is honoured only for the self-service
--     roles the sign-up form offers: parent, student, tutor.
--   * Anything else, including unknown values, becomes 'parent'.
--
-- Existing server flows keep working: csv-import and family.ts create
-- 'student'/'tutor' users, the Stripe webhook creates parents, and the dev
-- demo route upserts users_profile.role with the service role afterwards
-- (allowed by prevent_role_self_change when auth.uid() is null).

CREATE OR REPLACE FUNCTION public.signup_role(p_user_meta JSONB, p_app_meta JSONB)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN lower(p_app_meta->>'role') IN ('super_admin','admin','tutor','parent','student')
      THEN lower(p_app_meta->>'role')
    WHEN lower(p_user_meta->>'role') IN ('parent','student','tutor')
      THEN lower(p_user_meta->>'role')
    ELSE 'parent'
  END
$$;

REVOKE ALL ON FUNCTION public.signup_role(JSONB, JSONB) FROM PUBLIC, anon, authenticated;

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
    v_role := public.signup_role(NEW.raw_user_meta_data, NEW.raw_app_meta_data);
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_email := NEW.email;

    INSERT INTO public.users_profile (id, email, role, full_name, created_at, updated_at)
    VALUES (NEW.id, v_email, v_role::user_role, v_full_name, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        role = v_role::user_role,
        full_name = v_full_name,
        updated_at = NOW();

    IF v_role = 'tutor' THEN
        INSERT INTO public.tutors_profile (user_id, bio, specialties, is_active, created_at, updated_at)
        VALUES (NEW.id, '', '{}', true, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- The family trigger must agree with the profile role: a sign-up that asked
-- for 'admin' is now a parent, so it should get a family like any parent.
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
    v_role := public.signup_role(NEW.raw_user_meta_data, NEW.raw_app_meta_data);
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Family');

    IF v_role = 'parent' THEN
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

-- Triggers from 00029 already point at these functions; no trigger changes.
--
-- After applying, review existing privileged accounts (read-only):
--   select p.id, p.email, p.role, p.created_at,
--          u.raw_user_meta_data->>'role' as requested_role
--   from public.users_profile p join auth.users u on u.id = p.id
--   where p.role in ('admin','super_admin')
--   order by p.created_at;
