// src/app/api/dev/setup-demo-accounts/route.ts
// Purpose: DEV ONLY - Sets up demo account roles in users_profile
// This fixes the issue where demo accounts default to 'parent' role

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only allow in development
const isDev = process.env.NODE_ENV !== 'production';

const DEMO_ACCOUNTS = [
  { email: 'demo.admin@mathpivot.com', role: 'admin', full_name: 'Demo Admin' },
  { email: 'demo.tutor@mathpivot.com', role: 'tutor', full_name: 'Demo Tutor' },
  { email: 'demo.parent@mathpivot.com', role: 'parent', full_name: 'Demo Parent' },
  { email: 'demo.student@mathpivot.com', role: 'student', full_name: 'Demo Student' },
];

export async function POST() {
  if (!isDev) {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase admin credentials. Set SUPABASE_SERVICE_ROLE_KEY in .env.local' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const results: { email: string; status: string; error?: string }[] = [];

  for (const account of DEMO_ACCOUNTS) {
    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      results.push({ email: account.email, status: 'error', error: userError.message });
      continue;
    }

    const user = userData.users.find(u => u.email === account.email);

    if (!user) {
      results.push({ email: account.email, status: 'user_not_found' });
      continue;
    }

    // Update or insert users_profile with correct role
    const { error: upsertError } = await supabase
      .from('users_profile')
      .upsert({
        id: user.id,
        email: account.email,
        role: account.role,
        full_name: account.full_name,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (upsertError) {
      results.push({ email: account.email, status: 'error', error: upsertError.message });
    } else {
      results.push({ email: account.email, status: 'updated', role: account.role } as any);
    }
  }

  return NextResponse.json({
    message: 'Demo accounts setup complete',
    results
  });
}

export async function GET() {
  if (!isDev) {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  return NextResponse.json({
    message: 'POST to this endpoint to setup demo accounts',
    accounts: DEMO_ACCOUNTS.map(a => ({ email: a.email, role: a.role }))
  });
}
