/**
 * Unit Tests: Auth Helper Functions
 * Tests pure logic functions in src/lib/auth/index.ts
 */

// Mock the Supabase server client (we only test pure functions here)
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import type { AuthUser, UserRole } from "@/types";

// Import the functions we're testing
// Note: These are imported after mocks are set up
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  hasRole,
  hasAnyRole,
  hasMinimumRole,
  isAdminOrAbove,
  isSuperAdmin,
  getDashboardPath,
} = require("@/lib/auth") as typeof import("@/lib/auth");
/* eslint-enable @typescript-eslint/no-require-imports */

// ============================================================
// Test Data
// ============================================================
const makeUser = (role: UserRole): AuthUser => ({
  id: "test-uuid",
  email: "test@mathpivot.com",
  role,
  fullName: "Test User",
  avatarUrl: undefined,
});

// ============================================================
// hasRole
// ============================================================
describe("hasRole", () => {
  it("returns true when user has the specified role", () => {
    expect(hasRole(makeUser("admin"), "admin")).toBe(true);
    expect(hasRole(makeUser("parent"), "parent")).toBe(true);
    expect(hasRole(makeUser("super_admin"), "super_admin")).toBe(true);
  });

  it("returns false when user has a different role", () => {
    expect(hasRole(makeUser("student"), "admin")).toBe(false);
    expect(hasRole(makeUser("parent"), "tutor")).toBe(false);
  });

  it("returns false for null user", () => {
    expect(hasRole(null, "admin")).toBe(false);
  });
});

// ============================================================
// hasAnyRole
// ============================================================
describe("hasAnyRole", () => {
  it("returns true when user has one of the allowed roles", () => {
    expect(hasAnyRole(makeUser("admin"), ["admin", "super_admin"])).toBe(true);
    expect(hasAnyRole(makeUser("tutor"), ["tutor", "admin"])).toBe(true);
  });

  it("returns false when user role is not in the list", () => {
    expect(hasAnyRole(makeUser("student"), ["admin", "tutor"])).toBe(false);
  });

  it("returns false for null user", () => {
    expect(hasAnyRole(null, ["admin"])).toBe(false);
  });
});

// ============================================================
// hasMinimumRole (role hierarchy)
// ============================================================
describe("hasMinimumRole", () => {
  it("super_admin has minimum role of any level", () => {
    const user = makeUser("super_admin");
    expect(hasMinimumRole(user, "student")).toBe(true);
    expect(hasMinimumRole(user, "parent")).toBe(true);
    expect(hasMinimumRole(user, "tutor")).toBe(true);
    expect(hasMinimumRole(user, "admin")).toBe(true);
    expect(hasMinimumRole(user, "super_admin")).toBe(true);
  });

  it("student cannot meet admin minimum", () => {
    expect(hasMinimumRole(makeUser("student"), "admin")).toBe(false);
    expect(hasMinimumRole(makeUser("student"), "tutor")).toBe(false);
  });

  it("tutor meets tutor minimum but not admin", () => {
    expect(hasMinimumRole(makeUser("tutor"), "tutor")).toBe(true);
    expect(hasMinimumRole(makeUser("tutor"), "admin")).toBe(false);
  });

  it("returns false for null user", () => {
    expect(hasMinimumRole(null, "student")).toBe(false);
  });
});

// ============================================================
// isAdminOrAbove
// ============================================================
describe("isAdminOrAbove", () => {
  it("returns true for admin and super_admin", () => {
    expect(isAdminOrAbove(makeUser("admin"))).toBe(true);
    expect(isAdminOrAbove(makeUser("super_admin"))).toBe(true);
  });

  it("returns false for non-admin roles", () => {
    expect(isAdminOrAbove(makeUser("tutor"))).toBe(false);
    expect(isAdminOrAbove(makeUser("parent"))).toBe(false);
    expect(isAdminOrAbove(makeUser("student"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAdminOrAbove(null)).toBe(false);
  });
});

// ============================================================
// isSuperAdmin
// ============================================================
describe("isSuperAdmin", () => {
  it("returns true only for super_admin", () => {
    expect(isSuperAdmin(makeUser("super_admin"))).toBe(true);
  });

  it("returns false for admin (not super)", () => {
    expect(isSuperAdmin(makeUser("admin"))).toBe(false);
  });
});

// ============================================================
// getDashboardPath
// ============================================================
describe("getDashboardPath", () => {
  it("routes each role to the correct dashboard", () => {
    expect(getDashboardPath("super_admin")).toBe("/admin");
    expect(getDashboardPath("admin")).toBe("/admin");
    expect(getDashboardPath("tutor")).toBe("/tutor");
    expect(getDashboardPath("parent")).toBe("/parent");
    expect(getDashboardPath("student")).toBe("/student");
  });

  it("super_admin uses admin dashboard", () => {
    expect(getDashboardPath("super_admin")).toBe(getDashboardPath("admin"));
  });
});
