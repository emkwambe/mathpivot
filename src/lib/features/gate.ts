// src/lib/features/gate.ts
// Purpose: Runtime feature gating based on student's active subscription.
//          Used by student dashboard layout and nav components to show/hide/lock features.
// Connects to: family_subscriptions, service_packages tables via Supabase

import { createClient } from '@/lib/supabase/server';
import type { FeatureGates, ServiceTier } from '@/types/service-tiers';
import { DEFAULT_FEATURE_GATES } from '@/types/service-tiers';

/**
 * Get the feature gates for a student based on their active subscription.
 * Returns DEFAULT_FEATURE_GATES if no active subscription (Tutoring-level access).
 */
export async function getStudentFeatures(studentUserId: string): Promise<FeatureGates> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('family_subscriptions')
    .select('id, status, package:service_packages(feature_gates)')
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!subscription?.package) {
    return DEFAULT_FEATURE_GATES;
  }

  // Handle Supabase relation which may be array or object depending on type inference
  const pkgData = Array.isArray(subscription.package)
    ? subscription.package[0]
    : subscription.package;
  const pkg = pkgData as { feature_gates: FeatureGates };
  return pkg?.feature_gates ?? DEFAULT_FEATURE_GATES;
}

/**
 * Get the active service tier for a student.
 * Returns null if no active subscription.
 */
export async function getStudentTier(studentUserId: string): Promise<ServiceTier | null> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('family_subscriptions')
    .select('package:service_packages(service_tier)')
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!subscription?.package) {
    return null;
  }

  // Handle Supabase relation which may be array or object depending on type inference
  const pkgData = Array.isArray(subscription.package)
    ? subscription.package[0]
    : subscription.package;
  const pkg = pkgData as { service_tier: ServiceTier };
  return pkg?.service_tier ?? null;
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
  if (value === false) return false;
  if (value === true) return true;
  return value;
}

/**
 * Get full subscription details for a student (for display purposes).
 * Returns null if no active subscription.
 */
export async function getStudentSubscription(studentUserId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('family_subscriptions')
    .select('*, package:service_packages(*)')
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}
