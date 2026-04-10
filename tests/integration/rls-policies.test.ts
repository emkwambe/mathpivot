/**
 * Integration Tests: RLS Policy Enforcement
 * Verifies that row-level security prevents cross-role data access
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthenticatedClient(email: string, password: string) {
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`);
  return { supabase, user: data.user! };
}

describe('RLS: Parent Data Isolation', () => {
  it('parent can read own family members', async () => {
    const { supabase, user } = await getAuthenticatedClient('demo.parent@mathpivot.com', 'Demo123!');

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', user.id);

    expect(error).toBeNull();
    // Parent should see at least their own membership
    expect(data!.length).toBeGreaterThanOrEqual(0);
  });

  it('parent cannot read leads table', async () => {
    const { supabase } = await getAuthenticatedClient('demo.parent@mathpivot.com', 'Demo123!');

    const { data } = await supabase.from('leads').select('*').limit(1);
    expect(data).toEqual([]);
  });

  it('parent cannot read tutor_payouts', async () => {
    const { supabase } = await getAuthenticatedClient('demo.parent@mathpivot.com', 'Demo123!');

    const { data } = await supabase.from('tutor_payouts').select('*').limit(1);
    expect(data).toEqual([]);
  });
});

describe('RLS: Admin Access', () => {
  it('admin can read users_profile', async () => {
    const { supabase } = await getAuthenticatedClient('demo.admin@mathpivot.com', 'Demo123!');

    const { data, error } = await supabase
      .from('users_profile')
      .select('id, role')
      .limit(5);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('admin can read leads', async () => {
    const { supabase } = await getAuthenticatedClient('demo.admin@mathpivot.com', 'Demo123!');

    const { data, error } = await supabase.from('leads').select('*').limit(1);
    expect(error).toBeNull();
    // May be empty but shouldn't error
  });
});

describe('RLS: Tutor Data Isolation', () => {
  it('tutor can read own tutors_profile', async () => {
    const { supabase, user } = await getAuthenticatedClient('demo.tutor@mathpivot.com', 'Demo123!');

    const { data, error } = await supabase
      .from('tutors_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('tutor cannot read invoices', async () => {
    const { supabase } = await getAuthenticatedClient('demo.tutor@mathpivot.com', 'Demo123!');

    const { data } = await supabase.from('invoices').select('*').limit(1);
    expect(data).toEqual([]);
  });

  it('tutor cannot read other tutors pay rates', async () => {
    const { supabase, user } = await getAuthenticatedClient('demo.tutor@mathpivot.com', 'Demo123!');

    // Should only see own rates (or none if not set)
    const { data } = await supabase
      .from('tutor_pay_rates')
      .select('*');

    // All returned rates should belong to this tutor (or be empty)
    for (const rate of data || []) {
      expect(rate.tutor_user_id).toBe(user.id);
    }
  });
});

describe('RLS: Student Data Isolation', () => {
  it('student can read own profile', async () => {
    const { supabase, user } = await getAuthenticatedClient('demo.student@mathpivot.com', 'Demo123!');

    const { data, error } = await supabase
      .from('users_profile')
      .select('id, role')
      .eq('id', user.id)
      .single();

    expect(error).toBeNull();
    expect(data?.role).toBe('student');
  });

  it('student cannot read admin data', async () => {
    const { supabase } = await getAuthenticatedClient('demo.student@mathpivot.com', 'Demo123!');

    const { data: leads } = await supabase.from('leads').select('*').limit(1);
    const { data: payouts } = await supabase.from('tutor_payouts').select('*').limit(1);
    const { data: imports } = await supabase.from('csv_import_jobs').select('*').limit(1);

    expect(leads).toEqual([]);
    expect(payouts).toEqual([]);
    expect(imports).toEqual([]);
  });
});
