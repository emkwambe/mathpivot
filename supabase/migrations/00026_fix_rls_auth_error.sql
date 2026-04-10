-- ============================================================================
-- Migration 00026: Fix RLS policies breaking Supabase auth
--
-- Migration 00025 introduced policies with circular/recursive evaluation
-- that cause "Database error querying schema" 500 from GoTrue.
--
-- Fix: Revert to safe is_admin() based policies while keeping org-scoped
-- functions available for explicit app-level checks.
-- ============================================================================

-- ============================================================
-- 1. FIX: users_profile UPDATE policy
-- The subquery in WITH CHECK was causing circular RLS evaluation
-- ============================================================
DROP POLICY IF EXISTS users_profile_admin_update ON users_profile;
DROP POLICY IF EXISTS users_profile_self_update ON users_profile;

-- Restore single combined policy (safe, no recursion)
CREATE POLICY users_profile_update ON users_profile
    FOR UPDATE TO authenticated
    USING (is_admin() OR id = auth.uid())
    WITH CHECK (is_admin() OR id = auth.uid());

-- Add a database-level trigger to prevent role self-escalation instead
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_changer_role user_role;
BEGIN
    -- If role is not changing, allow
    IF OLD.role = NEW.role THEN
        RETURN NEW;
    END IF;

    -- Get the role of whoever is making the change
    SELECT role INTO v_changer_role FROM users_profile WHERE id = auth.uid();

    -- Only admin/super_admin can change roles
    IF v_changer_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;

    -- Non-super-admins cannot grant super_admin
    IF NEW.role = 'super_admin' AND v_changer_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can grant super_admin role';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON users_profile;
CREATE TRIGGER trg_prevent_role_self_change
    BEFORE UPDATE OF role ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_self_change();

-- ============================================================
-- 2. FIX: families_select policy
-- Revert to is_admin() to avoid recursive evaluation
-- ============================================================
DROP POLICY IF EXISTS families_select ON families;
CREATE POLICY families_select ON families
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = id AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS families_update ON families;
CREATE POLICY families_update ON families
    FOR UPDATE TO authenticated
    USING (
        is_admin()
        OR primary_parent_user_id = auth.uid()
    );

-- ============================================================
-- 3. FIX: leads policy (was using is_org_admin which may fail)
-- ============================================================
DROP POLICY IF EXISTS leads_org_admin ON leads;
CREATE POLICY leads_admin ON leads
    FOR ALL TO authenticated
    USING (is_admin());

-- ============================================================
-- 4. FIX: invoices policies
-- ============================================================
DROP POLICY IF EXISTS invoices_select ON invoices;
CREATE POLICY invoices_family_select ON invoices
    FOR SELECT TO authenticated
    USING (
        parent_user_id = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = invoices.family_id AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS invoices_admin_manage ON invoices;
CREATE POLICY invoices_admin_manage ON invoices
    FOR ALL TO authenticated
    USING (is_admin());

-- ============================================================
-- 5. FIX: tutor_payouts policies
-- ============================================================
DROP POLICY IF EXISTS payouts_select ON tutor_payouts;
CREATE POLICY payouts_tutor_select ON tutor_payouts
    FOR SELECT TO authenticated
    USING (tutor_user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS payouts_admin_manage ON tutor_payouts;
CREATE POLICY payouts_admin_manage ON tutor_payouts
    FOR ALL TO authenticated
    USING (is_admin());

-- ============================================================
-- 6. FIX: rooms policy
-- ============================================================
DROP POLICY IF EXISTS rooms_admin ON rooms;
CREATE POLICY rooms_admin ON rooms
    FOR ALL TO authenticated
    USING (is_admin());

-- ============================================================
-- NOTE: The org-scoped functions (is_org_admin, admin_can_access_family)
-- remain available. They should be called explicitly in server actions
-- rather than embedded in RLS policies to avoid circular evaluation.
-- The organization_id columns also remain for future use.
-- ============================================================
