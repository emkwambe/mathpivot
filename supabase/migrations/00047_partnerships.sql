-- Migration 00047: Partnership pipeline

DO $$ BEGIN
  CREATE TYPE partnership_type AS ENUM (
    'school', 'district', 'learning_center', 'homeschool_coop',
    'professional_org', 'sports_league', 'community_org', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE partnership_stage AS ENUM (
    'new', 'contacted', 'discovery', 'proposal', 'pilot', 'active', 'paused', 'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  organization_type partnership_type NOT NULL,
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website_url TEXT,
  student_count INTEGER,
  grade_range TEXT,
  location_city TEXT,
  location_state CHAR(2),
  interest_area TEXT,
  timeline TEXT,
  message TEXT,
  stage partnership_stage NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  next_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnerships_stage ON partnerships(stage);
CREATE INDEX IF NOT EXISTS idx_partnerships_type ON partnerships(organization_type);
CREATE INDEX IF NOT EXISTS idx_partnerships_created ON partnerships(created_at DESC);

ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY partnerships_admin ON partnerships FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE users_profile.id = auth.uid() AND users_profile.role IN ('admin', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
