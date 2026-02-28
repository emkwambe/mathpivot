# ============================================================================
# MATHPIVOT TUTOROS — PHASE 1: SERVICE TIERS FOUNDATION
# PowerShell Automation Script (v1.0)
#
# Purpose: Scaffolds the complete Phase 1 implementation for the tiered
#          service model — database migration, TypeScript types, feature
#          gate utility, admin package CRUD, and seed data.
#
# Usage:   Run from the MathPivot project root directory:
#          .\phase1-service-tiers.ps1
#
# Stack:   Next.js 16 + Supabase + Stripe + TypeScript
# OS:      Windows 11 / PowerShell 7+
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " MATHPIVOT TUTOROS — Phase 1: Service Tiers Foundation" -ForegroundColor Cyan
Write-Host " Generating migration, types, feature gates, admin CRUD" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 0. VERIFY PROJECT ROOT
# ============================================================================
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Run this from the MathPivot project root." -ForegroundColor Red
    exit 1
}

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.name -ne "mathpivot") {
    Write-Host "WARNING: package.json name is '$($packageJson.name)', expected 'mathpivot'." -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/N)"
    if ($confirm -ne "y") { exit 0 }
}

Write-Host "✓ Project root verified: $(Get-Location)" -ForegroundColor Green

# ============================================================================
# 1. DATABASE MIGRATION: 00016_service_tiers.sql
# Purpose: Adds service_packages, family_subscriptions, intake_diagnostics
#          tables plus new enums and alterations to existing tables.
#          Connects to: existing guide_levels, families, products, bookings,
#          sessions, students_profile, tutors_profile tables.
# ============================================================================

Write-Host "`n[1/7] Creating database migration..." -ForegroundColor Yellow

$migrationDir = "supabase/migrations"
if (-not (Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
}

$migrationContent = @'
-- ============================================================================
-- Migration 00016: Service Tiers & Diagnostic Sales Engine
--
-- Adds: service_packages, family_subscriptions, intake_diagnostics
-- Alters: bookings, sessions, purchases, students_profile, families
-- Enums: service_tier, package_billing_type, subscription_status,
--         intake_diagnostic_status
--
-- Connects to: guide_levels (00014), families (00001), products (00001),
--              bookings (00001), sessions (00001), students_profile (00001)
--
-- ZERO BREAKING CHANGES — all additions are additive.
-- ============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Service tier enum — maps to Tutoring/Coaching/Mentorship commercial model
CREATE TYPE service_tier AS ENUM (
  'TIER_TUTORING',      -- Foundation: per-session and bundles
  'TIER_COACHING',      -- Growth: monthly subscriptions with Guide II
  'TIER_MENTORSHIP'     -- Elite: semester/annual with Guide III
);

-- Billing cadence for service packages
CREATE TYPE package_billing_type AS ENUM (
  'one_time',           -- Single purchase (session packs)
  'monthly',            -- Monthly recurring
  'quarterly',          -- Every 3 months
  'semester',           -- ~5 months (academic semester)
  'annual'              -- Yearly
);

-- Stripe subscription lifecycle states
CREATE TYPE subscription_status AS ENUM (
  'active',
  'past_due',
  'canceled',
  'paused',
  'trialing'
);

-- Self-serve intake diagnostic states
CREATE TYPE intake_diagnostic_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'expired'
);

-- =============================================================================
-- TABLE: service_packages
-- Purpose: Tier-aware, feature-gated service offerings. Replaces flat products
--          model for subscription-based services while keeping products table
--          intact for backward compatibility.
-- Connects to: guide_levels.level_code, eligibility_tier enum (from 00014)
-- =============================================================================

CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  tagline TEXT,                                    -- Short marketing copy for UI cards

  -- Tier & Billing
  service_tier service_tier NOT NULL,
  billing_type package_billing_type NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Credits & Sessions
  credits_per_period INTEGER NOT NULL CHECK (credits_per_period > 0),
  rollover_credits BOOLEAN DEFAULT FALSE,
  max_rollover INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 60,

  -- Guide Requirements (references guide_levels from migration 00014)
  guide_level_required VARCHAR(20) REFERENCES guide_levels(level_code),

  -- Eligibility (references eligibility_tier enum from migration 00014)
  min_eligibility_tier eligibility_tier,           -- NULL = no requirement
  requires_diagnostic BOOLEAN DEFAULT FALSE,

  -- Feature Gates — JSONB for flexible per-package feature control
  -- Checked at runtime by lib/features/gate.ts
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

  -- Stripe Integration
  stripe_product_id TEXT,
  stripe_price_id TEXT,

  -- Display & Admin
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: family_subscriptions
-- Purpose: Tracks active subscriptions per family+student. Bridge between
--          Stripe subscription state and platform access/feature gating.
-- Connects to: families (00001), service_packages, tutors_profile (00001)
-- =============================================================================

CREATE TABLE IF NOT EXISTS family_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  student_user_id UUID NOT NULL REFERENCES auth.users(id),
  package_id UUID NOT NULL REFERENCES service_packages(id),

  -- Subscription State
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used_this_period INTEGER NOT NULL DEFAULT 0,

  -- Assigned Guide (matched based on package.guide_level_required)
  assigned_guide_id UUID REFERENCES tutors_profile(user_id),

  -- Stripe
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,

  -- Lifecycle
  started_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  paused_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: intake_diagnostics
-- Purpose: Self-serve diagnostic for parent intake funnel. Unlike the existing
--          diagnostics table (tutor-administered, migration 00001), this is
--          parent-initiated and drives the tier recommendation engine.
-- Connects to: families (00001), service_packages, course_track enum (00001)
-- =============================================================================

CREATE TABLE IF NOT EXISTS intake_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  student_user_id UUID NOT NULL REFERENCES auth.users(id),
  initiated_by UUID NOT NULL REFERENCES auth.users(id),

  -- Student Context (captured during intake form)
  student_grade INTEGER NOT NULL CHECK (student_grade >= 1 AND student_grade <= 12),
  student_goals TEXT,
  current_challenges TEXT,
  course_track course_track,

  -- Assessment Data
  status intake_diagnostic_status DEFAULT 'not_started',
  questions_json JSONB,                            -- AI-generated assessment questions
  responses_json JSONB,                            -- Student answers

  -- AI-Generated Results
  score INTEGER,
  max_score INTEGER,
  gap_analysis_json JSONB,                         -- Skill gaps identified by AI
  strength_areas TEXT[] DEFAULT '{}',
  weakness_areas TEXT[] DEFAULT '{}',

  -- Recommendation (output of lib/diagnostics/recommend-tier.ts)
  recommended_tier service_tier,
  recommended_package_id UUID REFERENCES service_packages(id),
  recommendation_reasoning TEXT,                   -- AI-generated explanation for parent

  -- Lifecycle
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                          -- Diagnostic valid for 30 days

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ALTERATIONS TO EXISTING TABLES
-- All additive — no column drops, no type changes, no constraint removals.
-- =============================================================================

-- Add Stripe customer tracking to families (for subscription billing)
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add subscription context to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES family_subscriptions(id),
  ADD COLUMN IF NOT EXISTS package_session_number INTEGER;

-- Add tier context to sessions (for tutor-side UI enrichment)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS service_tier service_tier;

-- Add subscription/package tracking to purchases
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES family_subscriptions(id),
  ADD COLUMN IF NOT EXISTS service_package_id UUID REFERENCES service_packages(id);

-- Add tier and subscription references to students_profile
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

-- service_packages: Public read for active, admin manages all
CREATE POLICY service_packages_select ON service_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY service_packages_manage ON service_packages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- family_subscriptions: Family members see own, staff sees all
CREATE POLICY family_subs_select ON family_subscriptions
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor')
    )
  );

CREATE POLICY family_subs_manage ON family_subscriptions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- intake_diagnostics: Initiator + family + staff
CREATE POLICY intake_diag_select ON intake_diagnostics
  FOR SELECT USING (
    initiated_by = auth.uid() OR
    student_user_id = auth.uid() OR
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'tutor')
    )
  );

CREATE POLICY intake_diag_insert ON intake_diagnostics
  FOR INSERT WITH CHECK (
    initiated_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
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

COMMENT ON TABLE service_packages IS 'Tier-aware service offerings (Tutoring/Coaching/Mentorship) with feature gates and Stripe integration';
COMMENT ON TABLE family_subscriptions IS 'Active subscriptions per family+student, bridging Stripe state to platform access';
COMMENT ON TABLE intake_diagnostics IS 'Self-serve parent intake diagnostic driving tier recommendations';

COMMENT ON COLUMN service_packages.feature_gates IS 'JSONB controlling student dashboard feature access per package';
COMMENT ON COLUMN service_packages.credits_per_period IS 'Number of sessions included per billing cycle';
COMMENT ON COLUMN family_subscriptions.credits_remaining IS 'Sessions left in current billing period';
COMMENT ON COLUMN intake_diagnostics.gap_analysis_json IS 'AI-generated skill gap analysis from diagnostic assessment';
COMMENT ON COLUMN intake_diagnostics.recommendation_reasoning IS 'AI-generated explanation for recommended tier (shown to parent)';
'@

Set-Content -Path "$migrationDir/00016_service_tiers.sql" -Value $migrationContent -Encoding UTF8
Write-Host "  ✓ supabase/migrations/00016_service_tiers.sql" -ForegroundColor Green

# ============================================================================
# 2. SEED DATA: service-packages.sql
# Purpose: Initial package offerings for all three tiers.
# Connects to: service_packages table, guide_levels table (00014)
# ============================================================================

Write-Host "`n[2/7] Creating seed data..." -ForegroundColor Yellow

$seedDir = "supabase/seed"
if (-not (Test-Path $seedDir)) {
    New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
}

$seedContent = @'
-- ============================================================================
-- supabase/seed/service-packages.sql
-- Purpose: Seed initial service packages for all three tiers.
-- Run after migration 00016_service_tiers.sql
-- ============================================================================

-- Clear existing seed data (idempotent re-run)
DELETE FROM service_packages WHERE slug IN (
  'single-session', 'starter-4-pack', 'booster-8-pack',
  'growth-monthly', 'growth-quarterly',
  'elite-monthly', 'elite-semester', 'elite-annual'
);

-- =============================================================================
-- TIER 1: TUTORING — "Get unstuck, stay on track"
-- Guide Level: Guide I (80% coach, 20% mentor)
-- No diagnostic required. No subscription. Credit-based.
-- =============================================================================

INSERT INTO service_packages
  (name, slug, tagline, description, service_tier, billing_type, price_cents,
   credits_per_period, session_duration_minutes, guide_level_required,
   requires_diagnostic, is_active, is_featured, display_order, feature_gates)
VALUES
  ('Single Session', 'single-session',
   'Get unstuck on any math topic',
   'One 60-minute session with a Guide I coach. Perfect for homework help, test prep review, or working through a specific concept.',
   'TIER_TUTORING', 'one_time', 5000, 1, 60, 'GUIDE_I', false, true, false, 10,
   '{"ai_tutor":false,"career_pathways":false,"competition_prep":false,"advanced_certifications":false,"weekly_reports":false,"parent_meetings":false,"async_support":false,"priority_scheduling":false}'),

  ('Starter 4-Pack', 'starter-4-pack',
   'Build momentum with 4 focused sessions',
   'Four 60-minute sessions with a Guide I coach. Use at your own pace. Ideal for targeted test prep or filling specific skill gaps.',
   'TIER_TUTORING', 'one_time', 18000, 4, 60, 'GUIDE_I', false, true, true, 20,
   '{"ai_tutor":false,"career_pathways":false,"competition_prep":false,"advanced_certifications":false,"weekly_reports":false,"parent_meetings":false,"async_support":false,"priority_scheduling":false}'),

  ('Booster 8-Pack', 'booster-8-pack',
   'Serious practice for serious results',
   'Eight 60-minute sessions with a Guide I coach. Best value per session. Great for EOG/EOC prep or sustained skill building.',
   'TIER_TUTORING', 'one_time', 32000, 8, 60, 'GUIDE_I', false, true, false, 30,
   '{"ai_tutor":false,"career_pathways":false,"competition_prep":false,"advanced_certifications":false,"weekly_reports":false,"parent_meetings":false,"async_support":false,"priority_scheduling":false}');

-- =============================================================================
-- TIER 2: COACHING — "Build a plan, own your math"
-- Guide Level: Guide II (50% coach, 50% mentor)
-- Diagnostic required. Monthly/quarterly subscription.
-- =============================================================================

INSERT INTO service_packages
  (name, slug, tagline, description, service_tier, billing_type, price_cents,
   credits_per_period, rollover_credits, max_rollover, session_duration_minutes,
   guide_level_required, requires_diagnostic, is_active, is_featured, display_order, feature_gates)
VALUES
  ('Growth Monthly', 'growth-monthly',
   'Weekly coaching with a personalized plan',
   'Four 60-minute weekly sessions with a dedicated Guide II coach. Includes diagnostic assessment, structured learning plan, weekly progress reports, AI Tutor access, and monthly parent check-in.',
   'TIER_COACHING', 'monthly', 25000, 4, true, 2, 60, 'GUIDE_II', true, true, true, 40,
   '{"ai_tutor":true,"career_pathways":"explore","competition_prep":"group","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"monthly","async_support":false,"priority_scheduling":false}'),

  ('Growth Quarterly', 'growth-quarterly',
   'Commit to a quarter of growth — save 10%',
   'Twelve sessions over 3 months with a dedicated Guide II coach. Same benefits as Growth Monthly with 10% savings. Unused sessions roll over (max 2).',
   'TIER_COACHING', 'quarterly', 67500, 12, true, 2, 60, 'GUIDE_II', true, true, false, 50,
   '{"ai_tutor":true,"career_pathways":"explore","competition_prep":"group","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"monthly","async_support":false,"priority_scheduling":false}');

-- =============================================================================
-- TIER 3: MENTORSHIP — "Shape your future through math"
-- Guide Level: Guide III (20% coach, 80% mentor)
-- Diagnostic required. Min eligibility: TIER_2_DEVELOPER.
-- Monthly/semester/annual subscription.
-- =============================================================================

INSERT INTO service_packages
  (name, slug, tagline, description, service_tier, billing_type, price_cents,
   credits_per_period, rollover_credits, max_rollover, session_duration_minutes,
   guide_level_required, min_eligibility_tier, requires_diagnostic,
   is_active, is_featured, display_order, feature_gates)
VALUES
  ('Elite Monthly', 'elite-monthly',
   'Personalized mentorship for future math leaders',
   'Eight sessions per month (2x/week) with a dedicated Guide III mentor. Full access to AI Tutor, career pathway planning, individual competition prep, advanced certifications, bi-weekly parent meetings, and async support between sessions.',
   'TIER_MENTORSHIP', 'monthly', 50000, 8, true, 2, 60,
   'GUIDE_III', 'TIER_2_DEVELOPER', true, true, false, 60,
   '{"ai_tutor":true,"career_pathways":"full","competition_prep":"individual","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"biweekly","async_support":true,"priority_scheduling":true}'),

  ('Elite Semester', 'elite-semester',
   'A semester of transformation — best value',
   'Forty sessions over 5 months with a dedicated Guide III mentor. All Elite benefits with significant savings. Includes quarterly progress portfolio and college-prep pathway review.',
   'TIER_MENTORSHIP', 'semester', 250000, 40, true, 4, 60,
   'GUIDE_III', 'TIER_2_DEVELOPER', true, true, true, 70,
   '{"ai_tutor":true,"career_pathways":"full","competition_prep":"individual","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"biweekly","async_support":true,"priority_scheduling":true}'),

  ('Elite Annual', 'elite-annual',
   'Full-year mentorship commitment — maximum impact',
   'Eighty sessions over 10 months (academic year) with a dedicated Guide III mentor. All Elite benefits plus priority guide selection, annual progress portfolio, and personalized college/career pathway roadmap.',
   'TIER_MENTORSHIP', 'annual', 450000, 80, true, 4, 60,
   'GUIDE_III', 'TIER_2_DEVELOPER', true, true, false, 80,
   '{"ai_tutor":true,"career_pathways":"full","competition_prep":"individual","advanced_certifications":true,"weekly_reports":true,"parent_meetings":"biweekly","async_support":true,"priority_scheduling":true}');
'@

Set-Content -Path "$seedDir/service-packages.sql" -Value $seedContent -Encoding UTF8
Write-Host "  ✓ supabase/seed/service-packages.sql" -ForegroundColor Green

# ============================================================================
# 3. TYPESCRIPT TYPES: src/types/service-tiers.ts
# Purpose: Strict TypeScript interfaces for all new service tier entities.
#          TYPE SAFETY FIRST — generated before any logic.
# Connects to: src/types/database.ts (existing type system)
# ============================================================================

Write-Host "`n[3/7] Creating TypeScript interfaces (type-safety-first)..." -ForegroundColor Yellow

$typesDir = "src/types"
if (-not (Test-Path $typesDir)) {
    New-Item -ItemType Directory -Path $typesDir -Force | Out-Null
}

$typesContent = @'
// src/types/service-tiers.ts
// Purpose: TypeScript interfaces for the service tier system (migration 00016).
// Connects to: src/types/database.ts for shared types (EligibilityTier, GuideLevelCode, CourseTrack)

import type { EligibilityTier, GuideLevelCode, CourseTrack } from './database';

// =============================================================================
// ENUMS (mirror Postgres enums from 00016_service_tiers.sql)
// =============================================================================

export type ServiceTier = 'TIER_TUTORING' | 'TIER_COACHING' | 'TIER_MENTORSHIP';

export type PackageBillingType = 'one_time' | 'monthly' | 'quarterly' | 'semester' | 'annual';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';

export type IntakeDiagnosticStatus = 'not_started' | 'in_progress' | 'completed' | 'expired';

// =============================================================================
// FEATURE GATES — controls student dashboard feature access per package
// Checked at runtime by lib/features/gate.ts
// =============================================================================

export interface FeatureGates {
  ai_tutor: boolean;
  career_pathways: false | 'explore' | 'full';
  competition_prep: false | 'group' | 'individual';
  advanced_certifications: boolean;
  weekly_reports: boolean;
  parent_meetings: false | 'monthly' | 'biweekly';
  async_support: boolean;
  priority_scheduling: boolean;
}

/** Default feature gates for students with no active subscription (Tutoring-level) */
export const DEFAULT_FEATURE_GATES: FeatureGates = {
  ai_tutor: false,
  career_pathways: false,
  competition_prep: false,
  advanced_certifications: false,
  weekly_reports: false,
  parent_meetings: false,
  async_support: false,
  priority_scheduling: false,
};

// =============================================================================
// TABLE INTERFACES
// =============================================================================

export interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;

  service_tier: ServiceTier;
  billing_type: PackageBillingType;
  price_cents: number;
  currency: string;

  credits_per_period: number;
  rollover_credits: boolean;
  max_rollover: number;
  session_duration_minutes: number;

  guide_level_required: GuideLevelCode | null;
  min_eligibility_tier: EligibilityTier | null;
  requires_diagnostic: boolean;

  feature_gates: FeatureGates;

  stripe_product_id: string | null;
  stripe_price_id: string | null;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface FamilySubscription {
  id: string;
  family_id: string;
  student_user_id: string;
  package_id: string;

  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  credits_remaining: number;
  credits_used_this_period: number;

  assigned_guide_id: string | null;

  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;

  started_at: string;
  canceled_at: string | null;
  cancel_reason: string | null;
  paused_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface IntakeDiagnostic {
  id: string;
  family_id: string;
  student_user_id: string;
  initiated_by: string;

  student_grade: number;
  student_goals: string | null;
  current_challenges: string | null;
  course_track: CourseTrack | null;

  status: IntakeDiagnosticStatus;
  questions_json: Record<string, unknown> | null;
  responses_json: Record<string, unknown> | null;

  score: number | null;
  max_score: number | null;
  gap_analysis_json: Record<string, unknown> | null;
  strength_areas: string[];
  weakness_areas: string[];

  recommended_tier: ServiceTier | null;
  recommended_package_id: string | null;
  recommendation_reasoning: string | null;

  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;

  created_at: string;
  updated_at: string;
}

// =============================================================================
// JOINED/DISPLAY TYPES — for UI components
// =============================================================================

export interface ServicePackageWithStats extends ServicePackage {
  active_subscriptions_count?: number;
  total_revenue_cents?: number;
}

export interface FamilySubscriptionWithDetails extends FamilySubscription {
  package?: ServicePackage;
  student?: { full_name: string; grade: number };
  guide?: { full_name: string; guide_level_code: GuideLevelCode };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Display name for service tier (used in UI badges, cards) */
export function getServiceTierDisplay(tier: ServiceTier): {
  name: string;
  tagline: string;
  color: string;
  bgColor: string;
} {
  switch (tier) {
    case 'TIER_TUTORING':
      return {
        name: 'Tutoring',
        tagline: 'Get unstuck, stay on track',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
      };
    case 'TIER_COACHING':
      return {
        name: 'Coaching',
        tagline: 'Build a plan, own your math',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200',
      };
    case 'TIER_MENTORSHIP':
      return {
        name: 'Mentorship',
        tagline: 'Shape your future through math',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-200',
      };
  }
}

/** Check if a billing type is subscription-based (requires Stripe subscription mode) */
export function isSubscriptionBilling(billingType: PackageBillingType): boolean {
  return billingType !== 'one_time';
}

/** Format price for display */
export function formatPackagePrice(priceCents: number, billingType: PackageBillingType): string {
  const dollars = (priceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  switch (billingType) {
    case 'one_time': return dollars;
    case 'monthly': return `${dollars}/mo`;
    case 'quarterly': return `${dollars}/qtr`;
    case 'semester': return `${dollars}/semester`;
    case 'annual': return `${dollars}/yr`;
  }
}

/** Calculate per-session cost for comparison display */
export function perSessionCost(priceCents: number, credits: number): number {
  return credits > 0 ? Math.round(priceCents / credits) : 0;
}
'@

Set-Content -Path "$typesDir/service-tiers.ts" -Value $typesContent -Encoding UTF8
Write-Host "  ✓ src/types/service-tiers.ts" -ForegroundColor Green

# ============================================================================
# 4. FEATURE GATE UTILITY: src/lib/features/gate.ts
# Purpose: Runtime feature gating based on student's active subscription.
#          Central utility used by student dashboard layout and nav components.
# Connects to: family_subscriptions, service_packages, students_profile
# ============================================================================

Write-Host "`n[4/7] Creating feature gate utility..." -ForegroundColor Yellow

$featuresDir = "src/lib/features"
if (-not (Test-Path $featuresDir)) {
    New-Item -ItemType Directory -Path $featuresDir -Force | Out-Null
}

$gateContent = @'
// src/lib/features/gate.ts
// Purpose: Runtime feature gating based on student's active subscription.
//          Used by student dashboard layout (student/layout.tsx) and nav
//          components to show/hide/lock features per tier.
// Connects to: family_subscriptions, service_packages tables via Supabase

import { createClient } from '@/lib/supabase/server';
import type { FeatureGates, ServiceTier } from '@/types/service-tiers';
import { DEFAULT_FEATURE_GATES } from '@/types/service-tiers';

/**
 * Get the feature gates for a student based on their active subscription.
 * Returns DEFAULT_FEATURE_GATES if no active subscription exists (Tutoring-level access).
 */
export async function getStudentFeatures(studentUserId: string): Promise<FeatureGates> {
  const supabase = await createClient();

  // Find active subscription for this student
  const { data: subscription } = await supabase
    .from('family_subscriptions')
    .select(`
      id,
      status,
      package:service_packages(feature_gates)
    `)
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!subscription?.package) {
    return DEFAULT_FEATURE_GATES;
  }

  // Extract feature_gates from the joined package
  const pkg = subscription.package as { feature_gates: FeatureGates };
  return pkg.feature_gates ?? DEFAULT_FEATURE_GATES;
}

/**
 * Get the active service tier for a student.
 * Returns null if no active subscription.
 */
export async function getStudentTier(studentUserId: string): Promise<ServiceTier | null> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('family_subscriptions')
    .select(`
      package:service_packages(service_tier)
    `)
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!subscription?.package) {
    return null;
  }

  const pkg = subscription.package as { service_tier: ServiceTier };
  return pkg.service_tier;
}

/**
 * Check a specific feature for a student.
 * Returns the feature value (boolean, string, or false).
 */
export async function checkFeature(
  studentUserId: string,
  featureKey: keyof FeatureGates
): Promise<boolean | string> {
  const features = await getStudentFeatures(studentUserId);
  const value = features[featureKey];

  // Any truthy value means the feature is available
  if (value === false) return false;
  if (value === true) return true;
  return value; // string values like 'explore', 'full', 'group', 'individual'
}

/**
 * Get subscription details for a student (for display purposes).
 * Returns null if no active subscription.
 */
export async function getStudentSubscription(studentUserId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('family_subscriptions')
    .select(`
      *,
      package:service_packages(*)
    `)
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}
'@

Set-Content -Path "$featuresDir/gate.ts" -Value $gateContent -Encoding UTF8
Write-Host "  ✓ src/lib/features/gate.ts" -ForegroundColor Green

# ============================================================================
# 5. SERVER ACTIONS: src/app/actions/packages.ts
# Purpose: Admin CRUD for service packages. Create, update, toggle, delete.
# Connects to: service_packages table, Stripe product/price sync
# ============================================================================

Write-Host "`n[5/7] Creating admin package server actions..." -ForegroundColor Yellow

$actionsContent = @'
// src/app/actions/packages.ts
// Purpose: Admin CRUD server actions for service packages.
// Connects to: service_packages table, existing auth system (lib/auth)

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import type { ServiceTier, PackageBillingType } from '@/types/service-tiers';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createPackageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  tagline: z.string().optional(),
  serviceTier: z.enum(['TIER_TUTORING', 'TIER_COACHING', 'TIER_MENTORSHIP']),
  billingType: z.enum(['one_time', 'monthly', 'quarterly', 'semester', 'annual']),
  priceCents: z.coerce.number().min(0, 'Price must be non-negative'),
  creditsPerPeriod: z.coerce.number().min(1, 'Must include at least 1 credit'),
  rolloverCredits: z.coerce.boolean().optional().default(false),
  maxRollover: z.coerce.number().min(0).optional().default(0),
  sessionDurationMinutes: z.coerce.number().min(15).max(180).optional().default(60),
  guideLevelRequired: z.string().optional(),
  minEligibilityTier: z.string().optional(),
  requiresDiagnostic: z.coerce.boolean().optional().default(false),
  isFeatured: z.coerce.boolean().optional().default(false),
  displayOrder: z.coerce.number().optional().default(0),
  // Feature gates as individual fields (assembled into JSONB)
  featureAiTutor: z.coerce.boolean().optional().default(false),
  featureCareerPathways: z.string().optional().default('false'),
  featureCompetitionPrep: z.string().optional().default('false'),
  featureAdvancedCerts: z.coerce.boolean().optional().default(false),
  featureWeeklyReports: z.coerce.boolean().optional().default(false),
  featureParentMeetings: z.string().optional().default('false'),
  featureAsyncSupport: z.coerce.boolean().optional().default(false),
  featurePriorityScheduling: z.coerce.boolean().optional().default(false),
});

// =============================================================================
// TYPES
// =============================================================================

export type PackageActionResult = {
  success: boolean;
  error?: string;
  packageId?: string;
};

// =============================================================================
// HELPERS
// =============================================================================

function assembleFeatureGates(data: z.infer<typeof createPackageSchema>) {
  return {
    ai_tutor: data.featureAiTutor,
    career_pathways: data.featureCareerPathways === 'false' ? false : data.featureCareerPathways,
    competition_prep: data.featureCompetitionPrep === 'false' ? false : data.featureCompetitionPrep,
    advanced_certifications: data.featureAdvancedCerts,
    weekly_reports: data.featureWeeklyReports,
    parent_meetings: data.featureParentMeetings === 'false' ? false : data.featureParentMeetings,
    async_support: data.featureAsyncSupport,
    priority_scheduling: data.featurePriorityScheduling,
  };
}

function requireAdmin() {
  return getCurrentUser().then(user => {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    return user;
  });
}

// =============================================================================
// ACTIONS
// =============================================================================

/** Admin: Create a new service package */
export async function createServicePackage(formData: FormData): Promise<PackageActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Admin access required' };
  }

  const raw = Object.fromEntries(formData.entries());
  const result = createPackageSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const data = result.data;
  const supabase = await createClient();

  const { data: pkg, error } = await supabase
    .from('service_packages')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      tagline: data.tagline || null,
      service_tier: data.serviceTier as ServiceTier,
      billing_type: data.billingType as PackageBillingType,
      price_cents: data.priceCents,
      credits_per_period: data.creditsPerPeriod,
      rollover_credits: data.rolloverCredits,
      max_rollover: data.maxRollover,
      session_duration_minutes: data.sessionDurationMinutes,
      guide_level_required: data.guideLevelRequired || null,
      min_eligibility_tier: data.minEligibilityTier || null,
      requires_diagnostic: data.requiresDiagnostic,
      feature_gates: assembleFeatureGates(data),
      is_featured: data.isFeatured,
      display_order: data.displayOrder,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create package error:', error);
    if (error.code === '23505') {
      return { success: false, error: 'A package with that slug already exists' };
    }
    return { success: false, error: 'Failed to create package' };
  }

  revalidatePath('/admin/packages');
  return { success: true, packageId: pkg.id };
}

/** Admin: Update an existing service package */
export async function updateServicePackage(formData: FormData): Promise<PackageActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Admin access required' };
  }

  const packageId = formData.get('packageId') as string;
  if (!packageId) {
    return { success: false, error: 'Package ID required' };
  }

  const raw = Object.fromEntries(formData.entries());
  const result = createPackageSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const data = result.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from('service_packages')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      tagline: data.tagline || null,
      service_tier: data.serviceTier as ServiceTier,
      billing_type: data.billingType as PackageBillingType,
      price_cents: data.priceCents,
      credits_per_period: data.creditsPerPeriod,
      rollover_credits: data.rolloverCredits,
      max_rollover: data.maxRollover,
      session_duration_minutes: data.sessionDurationMinutes,
      guide_level_required: data.guideLevelRequired || null,
      min_eligibility_tier: data.minEligibilityTier || null,
      requires_diagnostic: data.requiresDiagnostic,
      feature_gates: assembleFeatureGates(data),
      is_featured: data.isFeatured,
      display_order: data.displayOrder,
    })
    .eq('id', packageId);

  if (error) {
    console.error('Update package error:', error);
    return { success: false, error: 'Failed to update package' };
  }

  revalidatePath('/admin/packages');
  return { success: true, packageId };
}

/** Admin: Toggle package active/inactive */
export async function togglePackageActive(
  packageId: string,
  isActive: boolean
): Promise<PackageActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Admin access required' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('service_packages')
    .update({ is_active: isActive })
    .eq('id', packageId);

  if (error) {
    return { success: false, error: 'Failed to update package' };
  }

  revalidatePath('/admin/packages');
  return { success: true };
}

/** Admin: Delete a package (only if no active subscriptions reference it) */
export async function deleteServicePackage(packageId: string): Promise<PackageActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Admin access required' };
  }

  const supabase = await createClient();

  // Check for active subscriptions
  const { count } = await supabase
    .from('family_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('package_id', packageId)
    .eq('status', 'active');

  if (count && count > 0) {
    return { success: false, error: `Cannot delete: ${count} active subscription(s) use this package` };
  }

  const { error } = await supabase
    .from('service_packages')
    .delete()
    .eq('id', packageId);

  if (error) {
    return { success: false, error: 'Failed to delete package' };
  }

  revalidatePath('/admin/packages');
  return { success: true };
}

/** Get all packages (admin view — includes inactive) */
export async function getAllPackages() {
  const user = await getCurrentUser();
  if (!user) return { packages: [], error: 'Not authenticated' };

  const supabase = await createClient();

  const query = supabase
    .from('service_packages')
    .select('*')
    .order('display_order', { ascending: true });

  // Non-admins only see active packages
  if (user.role !== 'admin') {
    query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    return { packages: [], error: 'Failed to fetch packages' };
  }

  return { packages: data || [] };
}
'@

Set-Content -Path "src/app/actions/packages.ts" -Value $actionsContent -Encoding UTF8
Write-Host "  ✓ src/app/actions/packages.ts" -ForegroundColor Green

# ============================================================================
# 6. ADMIN PACKAGES PAGE: src/app/(dashboard)/admin/packages/page.tsx
# Purpose: Admin UI to view, create, edit, and manage service packages.
# Connects to: actions/packages.ts, service_packages table
# ============================================================================

Write-Host "`n[6/7] Creating admin packages page..." -ForegroundColor Yellow

$adminPkgDir = "src/app/(dashboard)/admin/packages"
if (-not (Test-Path $adminPkgDir)) {
    New-Item -ItemType Directory -Path $adminPkgDir -Force | Out-Null
}

$adminPageContent = @'
// src/app/(dashboard)/admin/packages/page.tsx
// Purpose: Admin page for viewing and managing service packages across all tiers.
// Connects to: actions/packages.ts server actions, service_packages table

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { togglePackageActive, deleteServicePackage } from '@/app/actions/packages';
import Link from 'next/link';

const tierColors: Record<string, { badge: string; border: string }> = {
  'TIER_TUTORING': { badge: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
  'TIER_COACHING': { badge: 'bg-purple-100 text-purple-800', border: 'border-purple-200' },
  'TIER_MENTORSHIP': { badge: 'bg-amber-100 text-amber-800', border: 'border-amber-200' },
};

const tierNames: Record<string, string> = {
  'TIER_TUTORING': 'Tutoring',
  'TIER_COACHING': 'Coaching',
  'TIER_MENTORSHIP': 'Mentorship',
};

const billingLabels: Record<string, string> = {
  'one_time': 'One-Time',
  'monthly': 'Monthly',
  'quarterly': 'Quarterly',
  'semester': 'Semester',
  'annual': 'Annual',
};

export default async function AdminPackagesPage() {
  await requireRole('admin');
  const supabase = await createClient();

  const { data: packages } = await supabase
    .from('service_packages')
    .select('*')
    .order('display_order', { ascending: true });

  // Group by tier
  const grouped = {
    TIER_TUTORING: packages?.filter(p => p.service_tier === 'TIER_TUTORING') || [],
    TIER_COACHING: packages?.filter(p => p.service_tier === 'TIER_COACHING') || [],
    TIER_MENTORSHIP: packages?.filter(p => p.service_tier === 'TIER_MENTORSHIP') || [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Packages</h1>
          <p className="text-slate-600">Manage tutoring, coaching, and mentorship offerings</p>
        </div>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Package
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Packages</p>
              <p className="text-3xl font-bold text-slate-900">{packages?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(grouped).map(([tier, pkgs]) => (
          <Card key={tier}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600">{tierNames[tier]}</p>
                <p className="text-3xl font-bold text-slate-900">{pkgs.length}</p>
                <p className="text-xs text-slate-500">{pkgs.filter(p => p.is_active).length} active</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Package Lists by Tier */}
      {Object.entries(grouped).map(([tier, pkgs]) => (
        <Card key={tier} className={`border-2 ${tierColors[tier]?.border || 'border-slate-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Badge className={tierColors[tier]?.badge}>
                {tierNames[tier]}
              </Badge>
              <span className="text-lg">{tierNames[tier]} Packages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pkgs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Package</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Billing</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Price</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Credits</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">$/Session</th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-slate-600">Featured</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkgs.map((pkg) => {
                      const perSession = pkg.credits_per_period > 0
                        ? (pkg.price_cents / pkg.credits_per_period / 100).toFixed(0)
                        : '—';

                      return (
                        <tr key={pkg.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">{pkg.name}</p>
                              <p className="text-xs text-slate-500">{pkg.slug}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{billingLabels[pkg.billing_type]}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatCurrency(pkg.price_cents)}
                          </td>
                          <td className="py-3 px-4 text-right">{pkg.credits_per_period}</td>
                          <td className="py-3 px-4 text-right text-slate-500">${perSession}</td>
                          <td className="py-3 px-4 text-center">
                            <form action={async () => {
                              'use server';
                              await togglePackageActive(pkg.id, !pkg.is_active);
                            }}>
                              <button
                                type="submit"
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                  pkg.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {pkg.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </form>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {pkg.is_featured && (
                              <span className="text-amber-500">★</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/packages/${pkg.id}/edit`}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6">No {tierNames[tier].toLowerCase()} packages yet</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
'@

Set-Content -Path "$adminPkgDir/page.tsx" -Value $adminPageContent -Encoding UTF8
Write-Host "  ✓ src/app/(dashboard)/admin/packages/page.tsx" -ForegroundColor Green

# ============================================================================
# 7. EXPORT BARREL: src/types/index.ts UPDATE
# Purpose: Re-export service-tiers types from the barrel file.
# Connects to: src/types/service-tiers.ts, existing src/types/index.ts
# ============================================================================

Write-Host "`n[7/7] Updating types barrel export..." -ForegroundColor Yellow

$indexTypesPath = "src/types/index.ts"
if (Test-Path $indexTypesPath) {
    $existingContent = Get-Content $indexTypesPath -Raw
    $exportLine = "export * from './service-tiers';"

    if ($existingContent -notmatch [regex]::Escape($exportLine)) {
        Add-Content -Path $indexTypesPath -Value "`n// Service Tiers (migration 00016)`n$exportLine"
        Write-Host "  ✓ Added service-tiers export to src/types/index.ts" -ForegroundColor Green
    } else {
        Write-Host "  ○ src/types/index.ts already exports service-tiers (skipped)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  ○ src/types/index.ts not found — create it manually if needed" -ForegroundColor DarkGray
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " PHASE 1 COMPLETE — Service Tiers Foundation" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  FILES GENERATED:" -ForegroundColor White
Write-Host "  ├── supabase/migrations/00016_service_tiers.sql  (migration)" -ForegroundColor Green
Write-Host "  ├── supabase/seed/service-packages.sql           (seed data)" -ForegroundColor Green
Write-Host "  ├── src/types/service-tiers.ts                   (TypeScript interfaces)" -ForegroundColor Green
Write-Host "  ├── src/lib/features/gate.ts                     (feature gate utility)" -ForegroundColor Green
Write-Host "  ├── src/app/actions/packages.ts                  (admin CRUD actions)" -ForegroundColor Green
Write-Host "  └── src/app/(dashboard)/admin/packages/page.tsx  (admin UI)" -ForegroundColor Green
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Review the migration:  supabase/migrations/00016_service_tiers.sql" -ForegroundColor White
Write-Host "  2. Apply migration:       npx supabase db push" -ForegroundColor White
Write-Host "  3. Run seed data:         npx supabase db seed --seed-file supabase/seed/service-packages.sql" -ForegroundColor White
Write-Host "  4. Verify admin page:     http://localhost:3000/admin/packages" -ForegroundColor White
Write-Host "  5. Run Phase 2 script:    .\phase2-diagnostic-engine.ps1 (coming next)" -ForegroundColor White
Write-Host ""
Write-Host "  ZERO BREAKING CHANGES — existing credit system untouched." -ForegroundColor DarkGray
Write-Host ""
