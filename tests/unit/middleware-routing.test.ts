/**
 * Unit Tests: Middleware Routing Logic
 * Tests RBAC route matching without actual HTTP requests
 */

// Replicate the routing logic from middleware.ts for pure testing
const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/auth/confirm', '/get-started', '/reset-password', '/update-password', '/pricing'];

const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ['/admin', '/settings', '/messages'],
  admin: ['/admin', '/settings', '/messages'],
  tutor: ['/tutor', '/settings', '/messages'],
  parent: ['/parent', '/settings', '/messages'],
  student: ['/student', '/settings', '/messages'],
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isAllowedForRole(pathname: string, role: string): boolean {
  const allowedPrefixes = ROLE_ROUTES[role] || [];
  return allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin';
    case 'tutor':
      return '/tutor';
    case 'parent':
      return '/parent';
    case 'student':
      return '/student';
    default:
      return '/student';
  }
}

// ============================================================
// Public Route Detection
// ============================================================
describe('Public Routes', () => {
  it('identifies login and signup as public', () => {
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/signup')).toBe(true);
  });

  it('identifies marketing pages as public', () => {
    expect(isPublicRoute('/get-started')).toBe(true);
    expect(isPublicRoute('/pricing')).toBe(true);
  });

  it('identifies auth routes as public', () => {
    expect(isPublicRoute('/auth/callback')).toBe(true);
    expect(isPublicRoute('/auth/confirm')).toBe(true);
    expect(isPublicRoute('/reset-password')).toBe(true);
    expect(isPublicRoute('/update-password')).toBe(true);
  });

  it('does NOT identify dashboard routes as public', () => {
    expect(isPublicRoute('/admin')).toBe(false);
    expect(isPublicRoute('/parent')).toBe(false);
    expect(isPublicRoute('/tutor')).toBe(false);
    expect(isPublicRoute('/student')).toBe(false);
  });
});

// ============================================================
// RBAC Route Checks
// ============================================================
describe('RBAC Route Access', () => {
  it('parent can access /parent routes', () => {
    expect(isAllowedForRole('/parent', 'parent')).toBe(true);
    expect(isAllowedForRole('/parent/book', 'parent')).toBe(true);
    expect(isAllowedForRole('/parent/referrals', 'parent')).toBe(true);
  });

  it('parent CANNOT access /admin routes', () => {
    expect(isAllowedForRole('/admin', 'parent')).toBe(false);
    expect(isAllowedForRole('/admin/users', 'parent')).toBe(false);
  });

  it('student CANNOT access /tutor routes', () => {
    expect(isAllowedForRole('/tutor', 'student')).toBe(false);
    expect(isAllowedForRole('/tutor/earnings', 'student')).toBe(false);
  });

  it('admin can access /admin routes', () => {
    expect(isAllowedForRole('/admin', 'admin')).toBe(true);
    expect(isAllowedForRole('/admin/payroll', 'admin')).toBe(true);
    expect(isAllowedForRole('/admin/leads', 'admin')).toBe(true);
  });

  it('super_admin can access /admin routes', () => {
    expect(isAllowedForRole('/admin', 'super_admin')).toBe(true);
    expect(isAllowedForRole('/admin/users', 'super_admin')).toBe(true);
  });

  it('all roles can access /settings and /messages', () => {
    const roles = ['super_admin', 'admin', 'tutor', 'parent', 'student'];
    for (const role of roles) {
      expect(isAllowedForRole('/settings', role)).toBe(true);
      expect(isAllowedForRole('/messages', role)).toBe(true);
    }
  });

  it('no role can access unknown routes', () => {
    expect(isAllowedForRole('/unknown', 'admin')).toBe(false);
    expect(isAllowedForRole('/api/hack', 'super_admin')).toBe(false);
  });
});

// ============================================================
// Dashboard Path Mapping
// ============================================================
describe('getDashboardPath', () => {
  it('maps all 5 roles correctly', () => {
    expect(getDashboardPath('super_admin')).toBe('/admin');
    expect(getDashboardPath('admin')).toBe('/admin');
    expect(getDashboardPath('tutor')).toBe('/tutor');
    expect(getDashboardPath('parent')).toBe('/parent');
    expect(getDashboardPath('student')).toBe('/student');
  });

  it('unknown role defaults to /student', () => {
    expect(getDashboardPath('unknown')).toBe('/student');
    expect(getDashboardPath('')).toBe('/student');
  });
});
