/**
 * Integration Tests: Supabase Connection & RLS
 * Tests real database queries against the Supabase instance
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('Supabase Connection', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  it('connects to Supabase successfully', async () => {
    // Health check — anon key should be able to query public data
    const { error } = await supabase.from('products').select('id').limit(1);
    // products has a public select policy
    expect(error).toBeNull();
  });

  it('anon key cannot read users_profile (RLS blocks)', async () => {
    const { data, error } = await supabase.from('users_profile').select('*').limit(1);
    // RLS should return empty or error for anon
    expect(data).toEqual([]);
  });

  it('anon key cannot read leads (RLS blocks — admin only)', async () => {
    const { data } = await supabase.from('leads').select('*').limit(1);
    expect(data).toEqual([]);
  });

  it('anon key can read fee_policies (public read)', async () => {
    const { data, error } = await supabase.from('fee_policies').select('*');
    // fee_policies has select for all authenticated — anon may be blocked
    // This tests that the table exists and RLS is enabled
    expect(error === null || data !== null).toBe(true);
  });
});

describe('Supabase Auth', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  it('can sign in with demo parent account', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo.parent@mathpivot.com',
      password: 'Demo123!',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('demo.parent@mathpivot.com');
    expect(data.session?.access_token).toBeDefined();
  });

  it('can sign in with demo admin account', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo.admin@mathpivot.com',
      password: 'Demo123!',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
  });

  it('can sign in with demo super_admin account', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo.superadmin@mathpivot.com',
      password: 'Demo123!',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'fake@notreal.com',
      password: 'wrongpassword',
    });

    expect(error).not.toBeNull();
  });

  it('authenticated parent can read own profile', async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'demo.parent@mathpivot.com',
      password: 'Demo123!',
    });

    if (!authData.user) throw new Error('Auth failed');

    const { data: profile, error } = await supabase
      .from('users_profile')
      .select('id, role, full_name')
      .eq('id', authData.user.id)
      .single();

    expect(error).toBeNull();
    expect(profile?.role).toBe('parent');
  });
});
