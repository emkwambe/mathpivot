-- ============================================================================
-- Migration 00025: Multitenancy Hardening
-- Fixes: org-scoping, tutor access in RLS, role escalation protection
-- ============================================================================

-- ============================================================================
-- 1. ADD organization_id TO CORE TABLES
-- ============================================================================
ALTER TABLE families ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE recurring_series ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE fee_policies ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_families_org ON families(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payouts_org ON tutor_payouts(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id) WHERE organization_id IS NOT NULL;

-- ============================================================================
-- 2. ORG-SCOPED ADMIN HELPER
-- Returns true if: super_admin, OR admin in same org, OR no orgs yet (dev mode)
-- ============================================================================
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role user_role;
    v_has_any_org BOOLEAN;
BEGIN
    SELECT role INTO v_role FROM users_profile WHERE id = auth.uid();

    -- Super admin bypasses everything
    IF v_role = 'super_admin' THEN RETURN TRUE; END IF;

    -- Must be admin role
    IF v_role != 'admin' THEN RETURN FALSE; END IF;

    -- If no org_id provided, check if admin is in ANY org
    IF p_org_id IS NULL THEN
        -- Dev/single-tenant fallback: if no org members exist at all, allow
        SELECT EXISTS(SELECT 1 FROM organization_members LIMIT 1) INTO v_has_any_org;
        IF NOT v_has_any_org THEN RETURN TRUE; END IF;
        -- Otherwise admin must be in at least one org
        RETURN EXISTS(SELECT 1 FROM organization_members WHERE user_id = auth.uid());
    END IF;

    -- Check specific org membership
    RETURN EXISTS(
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid() AND organization_id = p_org_id
    );
END;
$$;

-- ============================================================
-- 3. ORG-SCOPED HELPER: Check if admin can access a family
-- (replaces unused admin_can_access_family from 00018)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_can_access_family(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role user_role;
    v_family_org UUID;
BEGIN
    SELECT role INTO v_role FROM users_profile WHERE id = auth.uid();

    -- Super admin sees everything
    IF v_role = 'super_admin' THEN RETURN TRUE; END IF;

    -- Must be admin
    IF v_role != 'admin' THEN RETURN FALSE; END IF;

    -- Get family's org
    SELECT organization_id INTO v_family_org FROM families WHERE id = p_family_id;

    -- If family has no org (legacy/dev), allow if admin has no org either
    IF v_family_org IS NULL THEN
        RETURN NOT EXISTS(SELECT 1 FROM organization_members WHERE user_id = auth.uid());
    END IF;

    -- Check admin is in same org
    RETURN EXISTS(
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid() AND organization_id = v_family_org
    );
END;
$$;

-- ============================================================
-- 4. FIX: can_access_student() — add tutor check
-- Tutors with active bookings should see student data
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_access_student(p_student_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR p_student_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.students_profile sp
      WHERE sp.user_id = p_student_user_id
        AND public.is_parent_in_family(sp.family_id)
    )
    OR (
      -- Tutor with active booking for this student
      public.is_tutor()
      AND EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.student_user_id = p_student_user_id
          AND b.tutor_user_id = auth.uid()
          AND b.status NOT IN ('canceled')
      )
    )
$$;

-- ============================================================
-- 5. FIX: Prevent role self-escalation
-- Users can update their own profile but NOT the role column
-- ============================================================
DROP POLICY IF EXISTS "users_profile_update" ON users_profile;

-- Admin/super_admin can update any profile (including role)
CREATE POLICY users_profile_admin_update ON users_profile
    FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Regular users can update own profile but role must stay the same
CREATE POLICY users_profile_self_update ON users_profile
    FOR UPDATE TO authenticated
    USING (id = auth.uid() AND NOT is_admin())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users_profile WHERE id = auth.uid()));

-- ============================================================
-- 6. UPDATE KEY RLS POLICIES TO USE ORG-SCOPING
-- Replace bare is_admin() with org-aware checks on core tables
-- ============================================================

-- Families: org-scoped admin access
DROP POLICY IF EXISTS "families_select" ON families;
CREATE POLICY families_select ON families
    FOR SELECT TO authenticated
    USING (
        admin_can_access_family(id)
        OR EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = id AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "families_update" ON families;
CREATE POLICY families_update ON families
    FOR UPDATE TO authenticated
    USING (
        admin_can_access_family(id)
        OR primary_parent_user_id = auth.uid()
    );

-- Leads: org-scoped
DROP POLICY IF EXISTS leads_admin ON leads;
CREATE POLICY leads_org_admin ON leads
    FOR ALL TO authenticated
    USING (
        is_org_admin(organization_id)
    );

-- Invoices: org-scoped admin + family access
DROP POLICY IF EXISTS invoices_family_select ON invoices;
CREATE POLICY invoices_select ON invoices
    FOR SELECT TO authenticated
    USING (
        parent_user_id = auth.uid()
        OR is_org_admin(organization_id)
        OR EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = invoices.family_id AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS invoices_admin_manage ON invoices;
CREATE POLICY invoices_admin_manage ON invoices
    FOR ALL TO authenticated
    USING (is_org_admin(organization_id));

-- Tutor payouts: org-scoped
DROP POLICY IF EXISTS payouts_tutor_select ON tutor_payouts;
CREATE POLICY payouts_select ON tutor_payouts
    FOR SELECT TO authenticated
    USING (
        tutor_user_id = auth.uid()
        OR is_org_admin(organization_id)
    );

DROP POLICY IF EXISTS payouts_admin_manage ON tutor_payouts;
CREATE POLICY payouts_admin_manage ON tutor_payouts
    FOR ALL TO authenticated
    USING (is_org_admin(organization_id));

-- Rooms: org-scoped
DROP POLICY IF EXISTS rooms_admin ON rooms;
CREATE POLICY rooms_admin ON rooms
    FOR ALL TO authenticated
    USING (is_org_admin(organization_id));

-- ============================================================
-- 7. BACKFILL: Set org for existing data (single-tenant dev)
-- If exactly one org exists, assign all unscoped data to it
-- ============================================================
DO $$
DECLARE
    v_org_id UUID;
    v_org_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_org_count FROM organizations;
    IF v_org_count = 1 THEN
        SELECT id INTO v_org_id FROM organizations LIMIT 1;
        UPDATE families SET organization_id = v_org_id WHERE organization_id IS NULL;
        UPDATE leads SET organization_id = v_org_id WHERE organization_id IS NULL;
        UPDATE invoices SET organization_id = v_org_id WHERE organization_id IS NULL;
        UPDATE tutor_payouts SET organization_id = v_org_id WHERE organization_id IS NULL;
        UPDATE rooms SET organization_id = v_org_id WHERE organization_id IS NULL;
        RAISE NOTICE 'Backfilled org_id % for existing data', v_org_id;
    ELSE
        RAISE NOTICE 'Skipping backfill: % organizations found', v_org_count;
    END IF;
END $$;
