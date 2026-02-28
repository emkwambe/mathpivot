-- ============================================================================
-- Migration 00016: Service Tiers & Diagnostic Sales Engine
-- ZERO BREAKING CHANGES - all additions are additive.
-- ============================================================================

-- ENUMS
CREATE TYPE service_tier AS ENUM (
  'TIER_TUTORING',
  'TIER_COACHING',
  'TIER_MENTORSHIP'
);

CREATE TYPE package_billing_type AS ENUM (
  'one_time', 'monthly', 'quarterly', 'semester', 'annual'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'past_due', 'canceled', 'paused', 'trialing'
);

CREATE TYPE intake_diagnostic_status AS ENUM (
  'not_started', 'in_progress', 'completed', 'expired'
);

-- =============================================================================
-- TABLE: service_packages
-- Connects to: guide_levels.level_code (00014), eligibility_tier enum (00014)
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  tagline TEXT,
  service_tier service_tier NOT NULL,
  billing_type package_billing_type NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  credits_per_period INTEGER NOT NULL CHECK (credits_per_period > 0),
  rollover_credits BOOLEAN DEFAULT FALSE,
  max_rollover INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 60,
  guide_level_required VARCHAR(20) REFERENCES guide_levels(level_code),
  min_eligibility_tier eligibility_tier,
  requires_diagnostic BOOLEAN DEFAULT FALSE,
  feature_gates JSONB NOT NULL DEFAULT '{
    "ai_tutor": false,
    "career_pathways": false,
    "competition_prep": false,
    "advanced_certifications": false,
    "weekly_reports": false,
    "parent_meetings": false,
    "async_support": false,
    "priority_scheduling": false
  }',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: family_subscriptions
-- Connects to: families (00001), service_packages, tutors_profile (00001)
-- =============================================================================
CREATE TABLE IF NOT EXISTS family_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  student_user_id UUID NOT NULL REFERENCES auth.users(id),
  package_id UUID NOT NULL REFERENCES service_packages(id),
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used_this_period INTEGER NOT NULL DEFAULT 0,
  assigned_guide_id UUID REFERENCES tutors_profile(user_id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: intake_diagnostics
-- Connects to: families (00001), service_packages, course_track enum (00001)
-- =============================================================================
CREATE TABLE IF NOT EXISTS intake_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  student_user_id UUID NOT NULL REFERENCES auth.users(id),
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  student_grade INTEGER NOT NULL CHECK (student_grade >= 1 AND student_grade <= 12),
  student_goals TEXT,
  current_challenges TEXT,
  course_track course_track,
  status intake_diagnostic_status DEFAULT 'not_started',
  questions_json JSONB,
  responses_json JSONB,
  score INTEGER,
  max_score INTEGER,
  gap_analysis_json JSONB,
  strength_areas TEXT[] DEFAULT '{}',
  weakness_areas TEXT[] DEFAULT '{}',
  recommended_tier service_tier,
  recommended_package_id UUID REFERENCES service_packages(id),
  recommendation_reasoning TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ALTERATIONS TO EXISTING TABLES
-- =============================================================================
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES family_subscriptions(id),
  ADD COLUMN IF NOT EXISTS package_session_number INTEGER;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS service_tier service_tier;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES family_subscriptions(id),
  ADD COLUMN IF NOT EXISTS service_package_id UUID REFERENCES service_packages(id);

ALTER TABLE students_profile
  ADD COLUMN IF NOT EXISTS intake_diagnostic_id UUID REFERENCES intake_diagnostics(id),
  ADD COLUMN IF NOT EXISTS current_service_tier service_tier,
  ADD COLUMN IF NOT EXISTS active_subscription_id UUID REFERENCES family_subscriptions(id);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_service_packages_tier ON service_packages(service_tier);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_slug ON service_packages(slug);
CREATE INDEX IF NOT EXISTS idx_family_subs_family ON family_subscriptions(family_id);
CREATE INDEX IF NOT EXISTS idx_family_subs_student ON family_subscriptions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_family_subs_status ON family_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_family_subs_package ON family_subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_family_subs_guide ON family_subscriptions(assigned_guide_id);
CREATE INDEX IF NOT EXISTS idx_family_subs_stripe ON family_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_intake_diag_family ON intake_diagnostics(family_id);
CREATE INDEX IF NOT EXISTS idx_intake_diag_student ON intake_diagnostics(student_user_id);
CREATE INDEX IF NOT EXISTS idx_intake_diag_status ON intake_diagnostics(status);
CREATE INDEX IF NOT EXISTS idx_intake_diag_tier ON intake_diagnostics(recommended_tier);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_packages_select ON service_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY service_packages_manage ON service_packages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY family_subs_select ON family_subscriptions
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY family_subs_manage ON family_subscriptions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY intake_diag_select ON intake_diagnostics
  FOR SELECT USING (
    initiated_by = auth.uid() OR student_user_id = auth.uid()
    OR family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor'))
  );

CREATE POLICY intake_diag_insert ON intake_diagnostics
  FOR INSERT WITH CHECK (
    initiated_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY intake_diag_manage ON intake_diagnostics
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor')
  ));

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_subscriptions_updated_at
  BEFORE UPDATE ON family_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_diagnostics_updated_at
  BEFORE UPDATE ON intake_diagnostics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE service_packages IS 'Tier-aware service offerings with feature gates and Stripe integration';
COMMENT ON TABLE family_subscriptions IS 'Active subscriptions per family+student bridging Stripe state to platform access';
COMMENT ON TABLE intake_diagnostics IS 'Self-serve parent intake diagnostic driving tier recommendations';
