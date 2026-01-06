import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardPath } from '@/lib/auth';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user role and redirect to appropriate dashboard
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  const dashboardPath = getDashboardPath(
    (profile?.role as 'admin' | 'tutor' | 'parent' | 'student') || 'parent'
  );

  redirect(dashboardPath);
}
