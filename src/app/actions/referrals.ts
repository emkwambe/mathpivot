'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export type ReferralResult = { success: boolean; error?: string };

// ============================================================
// GET MY REFERRAL CODE (parent — auto-creates if missing)
// ============================================================
export async function getMyReferralCode() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { code: null, stats: null, error: 'Not authenticated' };

  // Get family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('member_role', 'parent')
    .single();

  if (!membership) return { code: null, stats: null, error: 'No family found' };

  // Check for existing code
  let { data: codeRow } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('family_id', membership.family_id)
    .single();

  // Generate if missing (via admin client to bypass RLS for insert)
  if (!codeRow) {
    const admin = createAdminClient();
    const { data: generated } = await admin.rpc('generate_referral_code', {
      p_family_id: membership.family_id,
    });

    if (generated) {
      const { data: newRow } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('family_id', membership.family_id)
        .single();
      codeRow = newRow;
    }
  }

  return { code: codeRow, stats: codeRow, error: null };
}

// ============================================================
// GET MY REFERRALS (parent)
// ============================================================
export async function getMyReferrals() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { referrals: [], error: 'Not authenticated' };

  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('member_role', 'parent')
    .single();

  if (!membership) return { referrals: [], error: null };

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_family_id', membership.family_id)
    .order('created_at', { ascending: false });

  if (error) return { referrals: [], error: error.message };
  return { referrals: data || [], error: null };
}

// ============================================================
// SUBMIT REFERRAL (parent sends a referral)
// ============================================================
const submitReferralSchema = z.object({
  referredName: z.string().min(2),
  referredEmail: z.string().email(),
});

export async function submitReferral(formData: FormData): Promise<ReferralResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const parsed = submitReferralSchema.safeParse({
    referredName: formData.get('referredName'),
    referredEmail: formData.get('referredEmail'),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Get family + referral code
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('member_role', 'parent')
    .single();

  if (!membership) return { success: false, error: 'No family found' };

  const { data: codeRow } = await supabase
    .from('referral_codes')
    .select('id')
    .eq('family_id', membership.family_id)
    .single();

  if (!codeRow) return { success: false, error: 'No referral code found. Please refresh.' };

  // Check for duplicate
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('referrals')
    .select('id')
    .eq('referral_code_id', codeRow.id)
    .eq('referred_email', parsed.data.referredEmail.toLowerCase())
    .maybeSingle();

  if (existing) return { success: false, error: 'This person has already been referred.' };

  // Create referral
  const { error } = await admin
    .from('referrals')
    .insert({
      referral_code_id: codeRow.id,
      referrer_family_id: membership.family_id,
      referred_name: parsed.data.referredName,
      referred_email: parsed.data.referredEmail.toLowerCase(),
    });

  if (error) return { success: false, error: error.message };

  // Also create a lead from this referral
  await admin.from('leads').insert({
    parent_name: parsed.data.referredName,
    parent_email: parsed.data.referredEmail.toLowerCase(),
    source: 'referral',
    source_detail: `Referred by family ${membership.family_id}`,
  });

  // Increment referral count
  await admin
    .from('referral_codes')
    .update({ total_referrals: (await admin.from('referral_codes').select('total_referrals').eq('id', codeRow.id).single()).data?.total_referrals + 1 || 1 })
    .eq('id', codeRow.id);

  revalidatePath('/parent/referrals');
  return { success: true };
}

// ============================================================
// ADMIN: GET ALL REFERRALS
// ============================================================
export async function getAllReferrals() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referral_code:referral_code_id (code, family_id)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return { referrals: [], error: error.message };
  return { referrals: data || [], error: null };
}

// ============================================================
// ADMIN: MARK REFERRAL AS CONVERTED
// ============================================================
export async function convertReferral(referralId: string, referredFamilyId?: string): Promise<ReferralResult> {
  const admin = createAdminClient();

  const { error } = await admin
    .from('referrals')
    .update({
      status: 'converted',
      referred_family_id: referredFamilyId || null,
      converted_at: new Date().toISOString(),
    })
    .eq('id', referralId)
    .in('status', ['pending', 'trial_completed']);

  if (error) return { success: false, error: error.message };

  // Apply reward
  await admin.rpc('apply_referral_reward', { p_referral_id: referralId });

  revalidatePath('/admin/leads');
  return { success: true };
}

// ============================================================
// GET REWARD POLICY
// ============================================================
export async function getRewardPolicy() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('referral_reward_policies')
    .select('*')
    .eq('is_active', true)
    .single();
  return data;
}
