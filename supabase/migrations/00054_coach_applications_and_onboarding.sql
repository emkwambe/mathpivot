-- Migration 00054: Coach applications + onboarding pipeline
--
-- Two-stage workflow for bringing on a new MathPivot Math Coach:
--
--   1. coach_applications:
--        Public /coach-apply submits here. Admin reviews at
--        /admin/coach-applications. On approval an invitation token is
--        generated; the applicant follows /coach-apply/accept/<token>,
--        signs up, and is linked to the application.
--
--   2. coach_onboarding_progress:
--        One row per invited coach. Tracks profile completeness, the
--        manual background-check attestation, Code of Conduct
--        acceptance, admin verification, and final activation for
--        student assignment. Certification itself continues to live in
--        the existing certification_applications table.

CREATE TABLE IF NOT EXISTS coach_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Applicant supplies
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  current_role TEXT,
  years_teaching INTEGER,
  specialties TEXT[] DEFAULT '{}',
  resume_url TEXT,
  linkedin_url TEXT,
  why_mathpivot TEXT,
  availability TEXT,
  -- Workflow
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'screening', 'interview_scheduled',
    'approved', 'denied', 'withdrawn', 'accepted'
  )),
  admin_notes TEXT,
  denied_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  -- Invitation
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  -- Linked user (populated when the applicant signs up via the token)
  user_id UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_coach_apps_status ON coach_applications(status);
CREATE INDEX IF NOT EXISTS idx_coach_apps_email ON coach_applications(email);
CREATE INDEX IF NOT EXISTS idx_coach_apps_user ON coach_applications(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS coach_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  application_id UUID REFERENCES coach_applications(id),
  -- Coach-side attestations
  background_check_attested BOOLEAN NOT NULL DEFAULT false,
  background_check_attested_at TIMESTAMPTZ,
  background_check_provider TEXT,
  background_check_completed_on DATE,
  code_of_conduct_accepted BOOLEAN NOT NULL DEFAULT false,
  code_of_conduct_accepted_at TIMESTAMPTZ,
  code_of_conduct_version TEXT,
  -- Admin verification of the attestation (independent second check)
  admin_verified_background BOOLEAN NOT NULL DEFAULT false,
  admin_verified_background_at TIMESTAMPTZ,
  admin_verified_background_by UUID REFERENCES auth.users(id),
  admin_verification_notes TEXT,
  -- Final activation for student assignment. Should only be set true
  -- when: bg attested, admin verified, code accepted, and the coach has
  -- an approved certification_application (checked in the server action,
  -- not at the DB level).
  activated BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_activated ON coach_onboarding_progress(activated);

-- Auto-maintain updated_at on both tables.
CREATE OR REPLACE FUNCTION set_coach_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coach_apps_updated_at ON coach_applications;
CREATE TRIGGER trg_coach_apps_updated_at
BEFORE UPDATE ON coach_applications
FOR EACH ROW EXECUTE FUNCTION set_coach_workflow_updated_at();

DROP TRIGGER IF EXISTS trg_coach_onboarding_updated_at ON coach_onboarding_progress;
CREATE TRIGGER trg_coach_onboarding_updated_at
BEFORE UPDATE ON coach_onboarding_progress
FOR EACH ROW EXECUTE FUNCTION set_coach_workflow_updated_at();

ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Applications:
--   Anonymous users can INSERT (the public /coach-apply form runs
--   through a server action, but we permit anon insert here as a
--   defense-in-depth measure).
--   Only admin/super_admin can SELECT/UPDATE.
DO $$ BEGIN
  CREATE POLICY "coach_apps_insert_anon"
    ON coach_applications FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coach_apps_read_admin"
    ON coach_applications FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coach_apps_update_admin"
    ON coach_applications FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The linked coach may also SELECT their own application record.
DO $$ BEGIN
  CREATE POLICY "coach_apps_read_own"
    ON coach_applications FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Onboarding progress:
--   The coach can read/update their own row (attestations, code accept).
--   Admin can read/update anyone (verification + activation).
DO $$ BEGIN
  CREATE POLICY "onboarding_read_own"
    ON coach_onboarding_progress FOR SELECT
    USING (coach_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "onboarding_update_own"
    ON coach_onboarding_progress FOR UPDATE
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "onboarding_read_admin"
    ON coach_onboarding_progress FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "onboarding_update_admin"
    ON coach_onboarding_progress FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert policy: coach can create their own row when accepting the
-- invite; admin can create any row.
DO $$ BEGIN
  CREATE POLICY "onboarding_insert_own_or_admin"
    ON coach_onboarding_progress FOR INSERT
    WITH CHECK (
      coach_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users_profile up
        WHERE up.id = auth.uid()
          AND up.role IN ('admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
