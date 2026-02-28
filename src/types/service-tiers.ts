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
// FEATURE GATES - controls student dashboard feature access per package
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
// JOINED/DISPLAY TYPES - for UI components
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

export function isSubscriptionBilling(billingType: PackageBillingType): boolean {
  return billingType !== 'one_time';
}

export function formatPackagePrice(priceCents: number, billingType: PackageBillingType): string {
  const dollars = (priceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });
  switch (billingType) {
    case 'one_time': return dollars;
    case 'monthly': return dollars + '/mo';
    case 'quarterly': return dollars + '/qtr';
    case 'semester': return dollars + '/semester';
    case 'annual': return dollars + '/yr';
  }
}

export function perSessionCost(priceCents: number, credits: number): number {
  return credits > 0 ? Math.round(priceCents / credits) : 0;
}
