// src/app/api/dev/setup-demo-accounts/route.ts
// Purpose: DEV ONLY - Sets up demo accounts (creates in auth + updates profiles)
// This ensures demo accounts exist and have correct roles

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only allow in development
const isDev = process.env.NODE_ENV !== 'production';

const DEMO_PASSWORD = 'Demo123!';

const DEMO_ACCOUNTS = [
  { email: 'demo.superadmin@mathpivot.com', role: 'super_admin', full_name: 'Demo Super Admin' },
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

  const results: { email: string; status: string; role?: string; error?: string }[] = [];

  // Get all existing users first
  const { data: userData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return NextResponse.json({ error: `Failed to list users: ${listError.message}` }, { status: 500 });
  }

  for (const account of DEMO_ACCOUNTS) {
    let user = userData.users.find(u => u.email === account.email);

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: account.full_name,
          role: account.role,
        },
      });

      if (createError) {
        results.push({ email: account.email, status: 'create_failed', error: createError.message });
        continue;
      }

      user = newUser.user;
      results.push({ email: account.email, status: 'created', role: account.role });
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
      // Update status if we just created the user
      const existingResult = results.find(r => r.email === account.email);
      if (existingResult) {
        existingResult.status = 'created_profile_failed';
        existingResult.error = upsertError.message;
      } else {
        results.push({ email: account.email, status: 'profile_error', error: upsertError.message });
      }
    } else {
      // Only add 'updated' status if user already existed
      const existingResult = results.find(r => r.email === account.email);
      if (!existingResult) {
        results.push({ email: account.email, status: 'updated', role: account.role });
      }
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
