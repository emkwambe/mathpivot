import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/update-password',
  '/auth/callback',
  '/auth/confirm',
  '/get-started',
  '/pricing',
];

const ROLE_PREFIXES: Record<string, string> = {
  super_admin: '/admin',
  admin: '/admin',
  tutor: '/tutor',
  parent: '/parent',
  student: '/student',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Unauthenticated — send to login (except public routes)
  if (!user) {
    if (isPublic) return supabaseResponse;
    const url = new URL('/login', request.url);
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Landing page, pricing, get-started — let authenticated users through too
  // (the landing page handles its own redirect client-side)
  if (pathname === '/' || pathname === '/get-started' || pathname === '/pricing') {
    return supabaseResponse;
  }

  // Authenticated on auth routes (login/signup) — redirect to dashboard
  if (isPublic) {
    try {
      const { data: profile, error } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const role = profile?.role ?? 'student';
      const dest = ROLE_PREFIXES[role] ?? '/student';
      return NextResponse.redirect(new URL(dest, request.url));
    } catch (err) {
      console.error('Middleware: failed to fetch user profile', err);
      // Fallback: send to a generic dashboard (student is safest)
      return NextResponse.redirect(new URL('/student', request.url));
    }
  }

  // Role-based access check
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as string | undefined;

  // No profile yet — send to signup to complete
  if (!role) {
    if (pathname.startsWith('/signup')) return supabaseResponse;
    return NextResponse.redirect(new URL('/signup?complete=true', request.url));
  }

  // Super admin and admin can access everything
  if (role === 'super_admin' || role === 'admin') return supabaseResponse;

  // Check role prefix match
  const allowedPrefix = ROLE_PREFIXES[role];
  const settingsOk = pathname.startsWith('/settings') || pathname.startsWith('/messages');

  if (allowedPrefix && (pathname.startsWith(allowedPrefix) || settingsOk)) {
    return supabaseResponse;
  }

  // Wrong role — redirect to their dashboard
  const dest = ROLE_PREFIXES[role] ?? '/student';
  return NextResponse.redirect(new URL(dest, request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

