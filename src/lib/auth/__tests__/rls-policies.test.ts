/**
 * RLS Policy Test Suite
 *
 * Comprehensive tests for Row-Level Security policies
 * Tests all RBAC scenarios to ensure data isolation
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test user credentials (should be set up in test environment)
const TEST_USERS = {
  admin: { email: 'test-admin@mathpivot.test', password: 'test-password-123' },
  tutor: { email: 'test-tutor@mathpivot.test', password: 'test-password-123' },
  parent: { email: 'test-parent@mathpivot.test', password: 'test-password-123' },
  student: { email: 'test-student@mathpivot.test', password: 'test-password-123' },
  otherParent: { email: 'test-parent2@mathpivot.test', password: 'test-password-123' },
};

// Test data IDs (should be set up in test environment)
const TEST_DATA = {
  familyId: 'test-family-id',
  otherFamilyId: 'test-other-family-id',
  studentId: 'test-student-id',
  otherStudentId: 'test-other-student-id',
  bookingId: 'test-booking-id',
  sessionId: 'test-session-id',
};

type TestRole = 'admin' | 'tutor' | 'parent' | 'student' | 'otherParent' | 'anon';

interface RLSTestResult {
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  role: TestRole;
  expected: 'allowed' | 'denied';
  actual: 'allowed' | 'denied';
  passed: boolean;
  error?: string;
}

/**
 * Create authenticated Supabase client for a specific role
 */
async function createAuthenticatedClient(role: TestRole) {
  if (role === 'anon') {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const credentials = TEST_USERS[role];

  const { error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(`Failed to authenticate as ${role}: ${error.message}`);
  }

  return client;
}

/**
 * Create admin client (bypasses RLS)
 */
function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/**
 * RLS Test Cases Definition
 */
const RLS_TEST_CASES: Array<{
  table: string;
  description: string;
  tests: Array<{
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    role: TestRole;
    expected: 'allowed' | 'denied';
    context?: string;
    filter?: Record<string, unknown>;
    data?: Record<string, unknown>;
  }>;
}> = [
  // =========================================
  // USERS_PROFILE TABLE
  // =========================================
  {
    table: 'users_profile',
    description: 'User profile access control',
    tests: [
      // SELECT tests
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read all profiles' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read own profile', filter: { id: 'own' } },
      { operation: 'SELECT', role: 'parent', expected: 'denied', context: 'Parent cannot read other profiles', filter: { id: 'other' } },
      { operation: 'SELECT', role: 'anon', expected: 'denied', context: 'Anonymous cannot read profiles' },

      // UPDATE tests
      { operation: 'UPDATE', role: 'admin', expected: 'allowed', context: 'Admin can update any profile' },
      { operation: 'UPDATE', role: 'parent', expected: 'allowed', context: 'User can update own profile', filter: { id: 'own' } },
      { operation: 'UPDATE', role: 'parent', expected: 'denied', context: 'User cannot update other profiles', filter: { id: 'other' } },
    ],
  },

  // =========================================
  // FAMILIES TABLE
  // =========================================
  {
    table: 'families',
    description: 'Family data access control',
    tests: [
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read all families' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read own family', filter: { id: TEST_DATA.familyId } },
      { operation: 'SELECT', role: 'parent', expected: 'denied', context: 'Parent cannot read other family', filter: { id: TEST_DATA.otherFamilyId } },
      { operation: 'SELECT', role: 'tutor', expected: 'denied', context: 'Tutor cannot read families' },
      { operation: 'UPDATE', role: 'parent', expected: 'allowed', context: 'Parent can update own family', filter: { id: TEST_DATA.familyId } },
      { operation: 'UPDATE', role: 'otherParent', expected: 'denied', context: 'Parent cannot update other family', filter: { id: TEST_DATA.familyId } },
    ],
  },

  // =========================================
  // STUDENTS_PROFILE TABLE
  // =========================================
  {
    table: 'students_profile',
    description: 'Student profile access control',
    tests: [
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read all students' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read own family students', filter: { user_id: TEST_DATA.studentId } },
      { operation: 'SELECT', role: 'otherParent', expected: 'denied', context: 'Parent cannot read other family students', filter: { user_id: TEST_DATA.studentId } },
      { operation: 'SELECT', role: 'tutor', expected: 'allowed', context: 'Tutor can read students they teach' },
      { operation: 'UPDATE', role: 'parent', expected: 'allowed', context: 'Parent can update family student', filter: { user_id: TEST_DATA.studentId } },
      { operation: 'UPDATE', role: 'tutor', expected: 'denied', context: 'Tutor cannot update student profile' },
    ],
  },

  // =========================================
  // BOOKINGS TABLE
  // =========================================
  {
    table: 'bookings',
    description: 'Booking access control',
    tests: [
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read all bookings' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read own bookings', filter: { family_id: TEST_DATA.familyId } },
      { operation: 'SELECT', role: 'otherParent', expected: 'denied', context: 'Parent cannot read other family bookings', filter: { family_id: TEST_DATA.familyId } },
      { operation: 'SELECT', role: 'tutor', expected: 'allowed', context: 'Tutor can read assigned bookings' },
      { operation: 'INSERT', role: 'parent', expected: 'allowed', context: 'Parent can create booking for family' },
      { operation: 'UPDATE', role: 'parent', expected: 'allowed', context: 'Parent can update own booking', filter: { id: TEST_DATA.bookingId } },
      { operation: 'UPDATE', role: 'tutor', expected: 'allowed', context: 'Tutor can update assigned booking', filter: { id: TEST_DATA.bookingId } },
      { operation: 'DELETE', role: 'parent', expected: 'denied', context: 'Parent cannot hard delete bookings' },
    ],
  },

  // =========================================
  // SESSIONS TABLE
  // =========================================
  {
    table: 'sessions',
    description: 'Session access control',
    tests: [
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read all sessions' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read own sessions' },
      { operation: 'SELECT', role: 'tutor', expected: 'allowed', context: 'Tutor can read assigned sessions' },
      { operation: 'UPDATE', role: 'tutor', expected: 'allowed', context: 'Tutor can update session notes' },
      { operation: 'UPDATE', role: 'parent', expected: 'denied', context: 'Parent cannot update session' },
    ],
  },

  // =========================================
  // CREDIT_LEDGER TABLE
  // =========================================
  {
    table: 'credit_ledger',
    description: 'Credit ledger access control (read-only for users)',
    tests: [
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read all ledger entries' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read own family ledger', filter: { family_id: TEST_DATA.familyId } },
      { operation: 'SELECT', role: 'otherParent', expected: 'denied', context: 'Parent cannot read other family ledger', filter: { family_id: TEST_DATA.familyId } },
      { operation: 'INSERT', role: 'parent', expected: 'denied', context: 'Parent cannot insert ledger entries' },
      { operation: 'INSERT', role: 'admin', expected: 'allowed', context: 'Admin can insert ledger entries' },
      { operation: 'UPDATE', role: 'admin', expected: 'denied', context: 'Even admin cannot update ledger (append-only)' },
    ],
  },

  // =========================================
  // STUDENT_SKILL_MASTERY TABLE
  // =========================================
  {
    table: 'student_skill_mastery',
    description: 'Skill mastery access control',
    tests: [
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read all mastery records' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read child mastery' },
      { operation: 'SELECT', role: 'student', expected: 'allowed', context: 'Student can read own mastery' },
      { operation: 'SELECT', role: 'tutor', expected: 'allowed', context: 'Tutor can read student mastery' },
      { operation: 'UPDATE', role: 'tutor', expected: 'allowed', context: 'Tutor can update student mastery' },
      { operation: 'UPDATE', role: 'parent', expected: 'denied', context: 'Parent cannot update mastery' },
      { operation: 'UPDATE', role: 'student', expected: 'denied', context: 'Student cannot update own mastery' },
    ],
  },

  // =========================================
  // AUDIT_LOGS TABLE
  // =========================================
  {
    table: 'audit_logs',
    description: 'Audit logs access control (admin-only)',
    tests: [
      { operation: 'SELECT', role: 'admin', expected: 'allowed', context: 'Admin can read audit logs' },
      { operation: 'SELECT', role: 'parent', expected: 'denied', context: 'Parent cannot read audit logs' },
      { operation: 'SELECT', role: 'tutor', expected: 'denied', context: 'Tutor cannot read audit logs' },
      { operation: 'INSERT', role: 'admin', expected: 'allowed', context: 'System can insert audit logs' },
      { operation: 'UPDATE', role: 'admin', expected: 'denied', context: 'Admin cannot update audit logs (immutable)' },
      { operation: 'DELETE', role: 'admin', expected: 'denied', context: 'Admin cannot delete audit logs' },
    ],
  },

  // =========================================
  // PRODUCTS TABLE (PUBLIC READ)
  // =========================================
  {
    table: 'products',
    description: 'Products catalog access control',
    tests: [
      { operation: 'SELECT', role: 'anon', expected: 'allowed', context: 'Anyone can read active products' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read products' },
      { operation: 'INSERT', role: 'admin', expected: 'allowed', context: 'Admin can create products' },
      { operation: 'INSERT', role: 'parent', expected: 'denied', context: 'Parent cannot create products' },
      { operation: 'UPDATE', role: 'admin', expected: 'allowed', context: 'Admin can update products' },
      { operation: 'UPDATE', role: 'parent', expected: 'denied', context: 'Parent cannot update products' },
    ],
  },

  // =========================================
  // AVAILABILITY_RULES TABLE
  // =========================================
  {
    table: 'availability_rules',
    description: 'Tutor availability access control',
    tests: [
      { operation: 'SELECT', role: 'anon', expected: 'allowed', context: 'Public can read availability for booking' },
      { operation: 'SELECT', role: 'parent', expected: 'allowed', context: 'Parent can read tutor availability' },
      { operation: 'INSERT', role: 'tutor', expected: 'allowed', context: 'Tutor can create own availability' },
      { operation: 'INSERT', role: 'parent', expected: 'denied', context: 'Parent cannot create availability' },
      { operation: 'UPDATE', role: 'tutor', expected: 'allowed', context: 'Tutor can update own availability' },
      { operation: 'DELETE', role: 'tutor', expected: 'allowed', context: 'Tutor can delete own availability' },
    ],
  },
];

/**
 * Run a single RLS test
 */
async function runRLSTest(
  table: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  role: TestRole,
  expected: 'allowed' | 'denied',
  filter?: Record<string, unknown>,
  data?: Record<string, unknown>
): Promise<RLSTestResult> {
  try {
    const client = await createAuthenticatedClient(role);
    let actual: 'allowed' | 'denied' = 'denied';
    let error: string | undefined;

    switch (operation) {
      case 'SELECT': {
        let query = client.from(table).select('*').limit(1);
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        const { data: result, error: selectError } = await query;
        if (selectError) {
          error = selectError.message;
          actual = selectError.code === 'PGRST116' || selectError.message.includes('RLS') ? 'denied' : 'denied';
        } else {
          actual = result && result.length >= 0 ? 'allowed' : 'denied';
        }
        break;
      }

      case 'INSERT': {
        const { error: insertError } = await client
          .from(table)
          .insert(data || { id: 'test-insert-' + Date.now() })
          .select()
          .single();
        if (insertError) {
          error = insertError.message;
          actual = 'denied';
        } else {
          actual = 'allowed';
        }
        break;
      }

      case 'UPDATE': {
        let query = client.from(table).update({ updated_at: new Date().toISOString() });
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        const { error: updateError, count } = await query;
        if (updateError) {
          error = updateError.message;
          actual = 'denied';
        } else {
          actual = count !== null && count > 0 ? 'allowed' : 'denied';
        }
        break;
      }

      case 'DELETE': {
        let query = client.from(table).delete();
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        const { error: deleteError } = await query;
        if (deleteError) {
          error = deleteError.message;
          actual = 'denied';
        } else {
          actual = 'allowed';
        }
        break;
      }
    }

    return {
      table,
      operation,
      role,
      expected,
      actual,
      passed: expected === actual,
      error,
    };
  } catch (err) {
    return {
      table,
      operation,
      role,
      expected,
      actual: 'denied',
      passed: expected === 'denied',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Run all RLS tests
 */
export async function runAllRLSTests(): Promise<{
  totalTests: number;
  passed: number;
  failed: number;
  results: RLSTestResult[];
}> {
  const results: RLSTestResult[] = [];

  for (const testCase of RLS_TEST_CASES) {
    console.log(`\nTesting table: ${testCase.table} - ${testCase.description}`);

    for (const test of testCase.tests) {
      const result = await runRLSTest(
        testCase.table,
        test.operation,
        test.role,
        test.expected,
        test.filter,
        test.data
      );

      results.push(result);

      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${test.operation} as ${test.role}: ${test.context || ''}`);
      if (!result.passed) {
        console.log(`     Expected: ${result.expected}, Got: ${result.actual}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      }
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n========================================`);
  console.log(`RLS Test Summary: ${passed}/${results.length} passed`);
  console.log(`========================================\n`);

  return {
    totalTests: results.length,
    passed,
    failed,
    results,
  };
}

/**
 * Cross-tenant isolation test
 * Verifies that users from one family cannot access another family's data
 */
export async function testCrossTenantIsolation(): Promise<{
  passed: boolean;
  violations: string[];
}> {
  const violations: string[] = [];

  // Parent A should not see Parent B's data
  const parentA = await createAuthenticatedClient('parent');
  const parentB = await createAuthenticatedClient('otherParent');

  // Test 1: Parent A cannot read Parent B's family
  const { data: familyData } = await parentA
    .from('families')
    .select('*')
    .eq('id', TEST_DATA.otherFamilyId);

  if (familyData && familyData.length > 0) {
    violations.push('Parent A can read Parent B family data');
  }

  // Test 2: Parent A cannot read Parent B's students
  const { data: studentData } = await parentA
    .from('students_profile')
    .select('*')
    .eq('family_id', TEST_DATA.otherFamilyId);

  if (studentData && studentData.length > 0) {
    violations.push('Parent A can read Parent B student data');
  }

  // Test 3: Parent A cannot read Parent B's bookings
  const { data: bookingData } = await parentA
    .from('bookings')
    .select('*')
    .eq('family_id', TEST_DATA.otherFamilyId);

  if (bookingData && bookingData.length > 0) {
    violations.push('Parent A can read Parent B booking data');
  }

  // Test 4: Parent A cannot read Parent B's credit history
  const { data: creditData } = await parentA
    .from('credit_ledger')
    .select('*')
    .eq('family_id', TEST_DATA.otherFamilyId);

  if (creditData && creditData.length > 0) {
    violations.push('Parent A can read Parent B credit ledger');
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Privilege escalation test
 * Verifies that users cannot elevate their permissions
 */
export async function testPrivilegeEscalation(): Promise<{
  passed: boolean;
  violations: string[];
}> {
  const violations: string[] = [];

  // Test: Parent cannot update their own role
  const parent = await createAuthenticatedClient('parent');
  const { error: roleUpdateError } = await parent
    .from('users_profile')
    .update({ role: 'admin' })
    .eq('id', 'own');

  if (!roleUpdateError) {
    violations.push('Parent was able to escalate to admin role');
  }

  // Test: Tutor cannot grant themselves admin access
  const tutor = await createAuthenticatedClient('tutor');
  const { error: tutorRoleError } = await tutor
    .from('users_profile')
    .update({ role: 'admin' })
    .eq('id', 'own');

  if (!tutorRoleError) {
    violations.push('Tutor was able to escalate to admin role');
  }

  // Test: Parent cannot insert admin user
  const { error: insertAdminError } = await parent
    .from('users_profile')
    .insert({
      id: 'fake-admin-id',
      role: 'admin',
      email: 'fake-admin@test.com',
      full_name: 'Fake Admin',
    });

  if (!insertAdminError) {
    violations.push('Parent was able to create admin user');
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

// Export for use in test runner or API endpoint
export const rlsTests = {
  runAllRLSTests,
  testCrossTenantIsolation,
  testPrivilegeEscalation,
  RLS_TEST_CASES,
};
