import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/auth/confirm'];

// Routes by role
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/admin'],
  tutor: ['/tutor'],
  parent: ['/parent'],
  student: ['/student'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update session (refresh token if needed)
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // Redirect authenticated users away from login/signup
    if (user && (pathname === '/login' || pathname === '/signup')) {
      // Get user role to redirect to correct dashboard
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        const dashboardPath = getDashboardPath(profile.role);
        // Only redirect if we have a valid dashboard path (not login itself)
        if (dashboardPath !== '/login') {
          return NextResponse.redirect(new URL(dashboardPath, request.url));
        }
      }
    }
    return supabaseResponse;
  }

  // Check if user is authenticated for protected routes
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user role for RBAC
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role) {
    // User exists but no profile - redirect to complete signup
    return NextResponse.redirect(new URL('/signup?complete=true', request.url));
  }

  // Check role-based access
  const userRole = profile.role as string;

  // Root redirect to appropriate dashboard
  if (pathname === '/') {
    const dashboardPath = getDashboardPath(userRole);
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  // Check if user can access the requested route
  const allowedPrefixes = ROLE_ROUTES[userRole] || [];
  const isAllowed =
    userRole === 'admin' || // Admin can access everything
    allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isAllowed) {
    // Redirect to user's dashboard
    const dashboardPath = getDashboardPath(userRole);
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return supabaseResponse;
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'tutor':
      return '/tutor';
    case 'parent':
      return '/parent';
    case 'student':
      return '/student';
    default:
      // Default to student dashboard instead of login to prevent redirect loops
      return '/student';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
