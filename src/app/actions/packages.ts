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

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    throw new Error('Admin access required');
  }
  return user;
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

  const { count } = await supabase
    .from('family_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('package_id', packageId)
    .eq('status', 'active');

  if (count && count > 0) {
    return { success: false, error: 'Cannot delete: ' + count + ' active subscription(s) use this package' };
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

/** Get all packages (admin view includes inactive) */
export async function getAllPackages() {
  const user = await getCurrentUser();
  if (!user) return { packages: [], error: 'Not authenticated' };

  const supabase = await createClient();

  const query = supabase
    .from('service_packages')
    .select('*')
    .order('display_order', { ascending: true });

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    return { packages: [], error: 'Failed to fetch packages' };
  }

  return { packages: data || [] };
}
