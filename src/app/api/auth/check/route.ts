import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'student';
  const redirectMap: Record<string, string> = {
    super_admin: '/admin',
    admin: '/admin',
    tutor: '/tutor',
    parent: '/parent',
    student: '/student',
  };
  const redirectTo = redirectMap[role] || '/student';

  return NextResponse.json({ authenticated: true, redirectTo });
}
