/**
 * Authentication and authorization utilities
 */
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { UserRole, UsersProfile, AuthUser } from '@/types';

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  tutor: 50,
  parent: 25,
  student: 10,
};

/**
 * Get the current authenticated user with their profile
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    role: profile.role as UserRole,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
  };
}

/**
 * Get the current user's profile from the database
 */
export async function getUserProfile(): Promise<UsersProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as UsersProfile | null;
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Require specific role(s) - redirects if user doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]): Promise<AuthUser> {
  const user = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    // Redirect to their appropriate dashboard or show unauthorized
    redirect(getDashboardPath(user.role));
  }

  return user;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthUser | null, roles: UserRole[]): boolean {
  return user !== null && roles.includes(user.role);
}

/**
 * Check if user has at least the specified role level (using hierarchy)
 */
export function hasMinimumRole(user: AuthUser | null, minimumRole: UserRole): boolean {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Get the dashboard path for a specific role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'tutor':
      return '/tutor';
    case 'parent':
      return '/parent';
    case 'student':
      return '/parent'; // Students see parent view in this MVP
    default:
      return '/login';
  }
}

/**
 * Check if the current user can access a specific student's data
 */
export async function canAccessStudent(studentUserId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) return false;

  // Admin can access all
  if (user.role === 'admin') return true;

  // Student can access own data
  if (user.role === 'student' && user.id === studentUserId) return true;

  const supabase = await createServerClient();

  // Parent can access students in their family
  if (user.role === 'parent') {
    const { data } = await supabase
      .from('students_profile')
      .select('family_id')
      .eq('user_id', studentUserId)
      .single();

    if (data) {
      const { data: membership } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', data.family_id)
        .eq('user_id', user.id)
        .eq('member_role', 'parent')
        .single();

      return Boolean(membership);
    }
  }

  // Tutor can access students they have sessions with
  if (user.role === 'tutor') {
    const { data } = await supabase
      .from('bookings')
      .select('id')
      .eq('student_user_id', studentUserId)
      .eq('tutor_user_id', user.id)
      .limit(1)
      .single();

    return Boolean(data);
  }

  return false;
}

/**
 * Check if the current user can access a specific booking
 */
export async function canAccessBooking(bookingId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) return false;

  // Admin can access all
  if (user.role === 'admin') return true;

  const supabase = await createServerClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('tutor_user_id, parent_user_id, student_user_id, family_id')
    .eq('id', bookingId)
    .single();

  if (!booking) return false;

  // Direct match
  if (
    booking.tutor_user_id === user.id ||
    booking.parent_user_id === user.id ||
    booking.student_user_id === user.id
  ) {
    return true;
  }

  // Parent in the same family
  if (user.role === 'parent') {
    const { data: membership } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', booking.family_id)
      .eq('user_id', user.id)
      .eq('member_role', 'parent')
      .single();

    return Boolean(membership);
  }

  return false;
}
