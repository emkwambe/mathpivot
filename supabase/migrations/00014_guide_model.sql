-- ============================================================================
-- Migration: Guide Model - Merged Coach/Mentor Role System
--
-- Implements the unified "Math Development Guide" model with:
-- - Guide Levels (I, II, III, Specialist)
-- - Student Eligibility Tiers
-- - Tiered Programs and Products
-- - Guide Compensation Plans
-- ============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Guide level enum (the merged coach/mentor role)
CREATE TYPE guide_level AS ENUM (
  'Guide I',      -- 80% coach, 20% mentor (entry-level, skill-focused)
  'Guide II',     -- 50% coach, 50% mentor (balanced)
  'Guide III'     -- 20% coach, 80% mentor (advanced, mentorship-focused)
);

-- Eligibility tier enum (based on 5-factor assessment)
CREATE TYPE eligibility_tier AS ENUM (
  'TIER_1_EXPLORER',     -- Score 16-19: Foundation building
  'TIER_2_DEVELOPER',    -- Score 20-22: Skill development
  'TIER_3_ACCELERATOR',  -- Score 23-25: Advanced/elite
  'NOT_ELIGIBLE'         -- Score <16: Needs foundational support
);

-- Extend program_type enum with new program tiers
ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'cohort';
ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'accelerator';
ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'fellowship';
ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'elite';

-- =============================================================================
-- GUIDE LEVELS TABLE
-- Defines the characteristics of each guide level
-- =============================================================================

CREATE TABLE IF NOT EXISTS guide_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_code VARCHAR(20) UNIQUE NOT NULL,  -- 'GUIDE_I', 'GUIDE_II', 'GUIDE_III', 'GUIDE_SPECIALIST'
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Role balance (must sum to 100)
  coach_focus_percent INTEGER NOT NULL CHECK (coach_focus_percent >= 0 AND coach_focus_percent <= 100),
  mentor_focus_percent INTEGER NOT NULL CHECK (mentor_focus_percent >= 0 AND mentor_focus_percent <= 100),

  -- Requirements
  min_experience_years INTEGER DEFAULT 0,
  required_certifications TEXT[],

  -- Compensation
  hourly_rate_min NUMERIC(10,2),
  hourly_rate_max NUMERIC(10,2),

  -- Capacity
  max_students INTEGER,
  training_hours_required INTEGER,

  -- Display
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT coach_mentor_sum CHECK (coach_focus_percent + mentor_focus_percent = 100)
);

-- =============================================================================
-- CAREER PATHWAYS - Add guide specialization columns
-- =============================================================================

-- Add columns for guide specialization and grade eligibility
ALTER TABLE career_pathways
  ADD COLUMN IF NOT EXISTS guide_specializations guide_level[],
  ADD COLUMN IF NOT EXISTS min_guide_level guide_level;

-- =============================================================================
-- PROGRAMS - Add guide and eligibility requirements
-- =============================================================================

-- Add columns for guide requirements and eligibility
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS guide_level_required guide_level,
  ADD COLUMN IF NOT EXISTS min_eligibility_score INTEGER CHECK (min_eligibility_score >= 0 AND min_eligibility_score <= 25),
  ADD COLUMN IF NOT EXISTS target_grades INTEGER[];

-- =============================================================================
-- PRODUCTS - Add guide and eligibility tier requirements
-- =============================================================================

-- Add columns to products for tiered access
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS guide_level_required VARCHAR(20),  -- References guide_levels.level_code
  ADD COLUMN IF NOT EXISTS eligibility_tier_required eligibility_tier;

-- =============================================================================
-- STUDENT ELIGIBILITY PROFILES
-- Tracks student assessment scores and tier placement
-- =============================================================================

CREATE TABLE IF NOT EXISTS student_eligibility_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 5-Factor Assessment Scores (1-5 each)
  academic_performance INTEGER CHECK (academic_performance >= 1 AND academic_performance <= 5),
  math_passion INTEGER CHECK (math_passion >= 1 AND math_passion <= 5),
  achievement_level INTEGER CHECK (achievement_level >= 1 AND achievement_level <= 5),
  career_direction INTEGER CHECK (career_direction >= 1 AND career_direction <= 5),
  personal_qualities INTEGER CHECK (personal_qualities >= 1 AND personal_qualities <= 5),

  -- Computed total score (stored for performance)
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(academic_performance, 0) +
    COALESCE(math_passion, 0) +
    COALESCE(achievement_level, 0) +
    COALESCE(career_direction, 0) +
    COALESCE(personal_qualities, 0)
  ) STORED,

  -- Assessment notes
  notes TEXT,
  assessed_by UUID REFERENCES users_profile(id),
  next_assessment_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to compute eligibility tier
CREATE OR REPLACE FUNCTION get_eligibility_tier(score INTEGER)
RETURNS eligibility_tier AS $$
BEGIN
  IF score >= 23 THEN
    RETURN 'TIER_3_ACCELERATOR';
  ELSIF score >= 20 THEN
    RETURN 'TIER_2_DEVELOPER';
  ELSIF score >= 16 THEN
    RETURN 'TIER_1_EXPLORER';
  ELSE
    RETURN 'NOT_ELIGIBLE';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- PROGRAM GUIDES JUNCTION TABLE
-- Links programs to required guide levels with ratios
-- =============================================================================

CREATE TABLE IF NOT EXISTS program_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  guide_level_code VARCHAR(20) NOT NULL REFERENCES guide_levels(level_code),

  min_guides_required INTEGER DEFAULT 1,
  max_guides_allowed INTEGER,
  guide_student_ratio NUMERIC(3,2),  -- e.g., 1:4 = 0.25

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, guide_level_code)
);

-- =============================================================================
-- GUIDE COMPENSATION PLANS
-- Tracks compensation structure per guide level
-- =============================================================================

CREATE TABLE IF NOT EXISTS guide_compensation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_level_code VARCHAR(20) NOT NULL REFERENCES guide_levels(level_code),

  -- Base Compensation
  base_rate_per_hour NUMERIC(10,2) NOT NULL,
  commission_percent NUMERIC(5,2) CHECK (commission_percent >= 0 AND commission_percent <= 100),

  -- Bonuses
  session_bonus NUMERIC(10,2),          -- Bonus after N sessions/month
  retention_bonus NUMERIC(10,2),         -- Bonus for student retention
  outcome_bonus_rules JSONB,             -- Custom outcome-based bonuses

  -- Benefits
  health_stipend NUMERIC(10,2),
  training_budget NUMERIC(10,2),
  technology_allowance NUMERIC(10,2),

  -- Validity
  effective_date DATE NOT NULL,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(guide_level_code, effective_date)
);

-- =============================================================================
-- STUDENT PATHWAY RECOMMENDATIONS
-- Personalized pathway recommendations based on eligibility
-- =============================================================================

CREATE TABLE IF NOT EXISTS student_pathway_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  pathway_id UUID NOT NULL REFERENCES career_pathways(id) ON DELETE CASCADE,

  recommended_guide_level VARCHAR(20) REFERENCES guide_levels(level_code),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reason_codes TEXT[],  -- e.g., {'academic_strength', 'interest_alignment', 'career_goals'}

  suggested_programs UUID[],  -- Program IDs
  recommended_start_date DATE,
  estimated_completion_months INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, pathway_id)
);

-- =============================================================================
-- TUTOR GUIDE PROFILE EXTENSION
-- Extends tutors_profile with guide-specific attributes
-- =============================================================================

ALTER TABLE tutors_profile
  ADD COLUMN IF NOT EXISTS guide_level guide_level,
  ADD COLUMN IF NOT EXISTS guide_level_code VARCHAR(20) REFERENCES guide_levels(level_code),
  ADD COLUMN IF NOT EXISTS career_pathway_specializations UUID[],  -- References career_pathways
  ADD COLUMN IF NOT EXISTS eligible_grades INTEGER[],
  ADD COLUMN IF NOT EXISTS max_concurrent_students INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS guide_certified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS guide_certification_expires_at TIMESTAMPTZ;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_guide_levels_code ON guide_levels(level_code);
CREATE INDEX IF NOT EXISTS idx_guide_levels_active ON guide_levels(is_active);

CREATE INDEX IF NOT EXISTS idx_student_eligibility_student ON student_eligibility_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_eligibility_score ON student_eligibility_profiles(total_score);
CREATE INDEX IF NOT EXISTS idx_student_eligibility_date ON student_eligibility_profiles(assessment_date);

CREATE INDEX IF NOT EXISTS idx_program_guides_program ON program_guides(program_id);
CREATE INDEX IF NOT EXISTS idx_program_guides_level ON program_guides(guide_level_code);

CREATE INDEX IF NOT EXISTS idx_compensation_level ON guide_compensation_plans(guide_level_code);
CREATE INDEX IF NOT EXISTS idx_compensation_active ON guide_compensation_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_pathway_recs_student ON student_pathway_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_pathway_recs_pathway ON student_pathway_recommendations(pathway_id);

CREATE INDEX IF NOT EXISTS idx_tutors_guide_level ON tutors_profile(guide_level_code);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE guide_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_eligibility_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_compensation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_pathway_recommendations ENABLE ROW LEVEL SECURITY;

-- Guide levels: Public read
CREATE POLICY guide_levels_select ON guide_levels
  FOR SELECT USING (TRUE);

CREATE POLICY guide_levels_manage ON guide_levels
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- Student eligibility: Students see own, parents see children, staff see all
CREATE POLICY eligibility_select ON student_eligibility_profiles
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN users_profile up ON up.id = auth.uid()
      WHERE fm.user_id = student_eligibility_profiles.student_id
        AND fm.family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
        AND up.role = 'parent'
    ) OR
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY eligibility_manage ON student_eligibility_profiles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor')
  ));

-- Program guides: Public read, admin manage
CREATE POLICY program_guides_select ON program_guides FOR SELECT USING (TRUE);

CREATE POLICY program_guides_manage ON program_guides
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- Compensation plans: Admin only
CREATE POLICY compensation_select ON guide_compensation_plans
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY compensation_manage ON guide_compensation_plans
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- Pathway recommendations: Students see own, staff see all
CREATE POLICY pathway_recs_select ON student_pathway_recommendations
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY pathway_recs_manage ON student_pathway_recommendations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor')
  ));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_guide_levels_updated_at
  BEFORE UPDATE ON guide_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_eligibility_updated_at
  BEFORE UPDATE ON student_eligibility_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compensation_plans_updated_at
  BEFORE UPDATE ON guide_compensation_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pathway_recs_updated_at
  BEFORE UPDATE ON student_pathway_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE guide_levels IS 'Defines the Math Development Guide levels (I, II, III) with coach/mentor balance';
COMMENT ON TABLE student_eligibility_profiles IS 'Student assessment scores determining program eligibility tier';
COMMENT ON TABLE program_guides IS 'Links programs to required guide levels and ratios';
COMMENT ON TABLE guide_compensation_plans IS 'Compensation structure per guide level';
COMMENT ON TABLE student_pathway_recommendations IS 'Personalized career pathway recommendations';

COMMENT ON COLUMN guide_levels.coach_focus_percent IS 'Percentage of role focused on skill coaching (0-100)';
COMMENT ON COLUMN guide_levels.mentor_focus_percent IS 'Percentage of role focused on mentorship (0-100)';
COMMENT ON COLUMN student_eligibility_profiles.total_score IS 'Sum of 5-factor assessment (5-25 points)';
COMMENT ON COLUMN programs.min_eligibility_score IS 'Minimum eligibility score required (0-25)';
