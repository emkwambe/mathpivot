/**
 * E2E Tests: Authentication Flows
 * Tests login, signup, password reset, and role-based routing
 */
import { test, expect } from '@playwright/test';

const DEMO_ACCOUNTS = {
  parent: { email: 'demo.parent@mathpivot.com', password: 'Demo123!', dashboard: '/parent' },
  tutor: { email: 'demo.tutor@mathpivot.com', password: 'Demo123!', dashboard: '/tutor' },
  admin: { email: 'demo.admin@mathpivot.com', password: 'Demo123!', dashboard: '/admin' },
  superadmin: { email: 'demo.superadmin@mathpivot.com', password: 'Demo123!', dashboard: '/admin' },
  student: { email: 'demo.student@mathpivot.com', password: 'Demo123!', dashboard: '/student' },
};

test.describe('Login Flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('parent can log in and reaches parent dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', DEMO_ACCOUNTS.parent.email);
    await page.fill('input[name="password"]', DEMO_ACCOUNTS.parent.password);
    await page.click('button[type="submit"]');

    // Should redirect to parent dashboard
    await page.waitForURL('**/parent**', { timeout: 15000 });
    await expect(page).toHaveURL(/\/parent/);
  });

  test('tutor can log in and reaches tutor dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', DEMO_ACCOUNTS.tutor.email);
    await page.fill('input[name="password"]', DEMO_ACCOUNTS.tutor.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/tutor**', { timeout: 15000 });
    await expect(page).toHaveURL(/\/tutor/);
  });

  test('admin can log in and reaches admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', DEMO_ACCOUNTS.admin.email);
    await page.fill('input[name="password"]', DEMO_ACCOUNTS.admin.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin**', { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('invalid credentials show error (no enumeration)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'fake@notreal.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show generic error — not "user not found" or "wrong password"
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Public Pages', () => {
  test('marketing homepage loads for unauthenticated visitors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Expert Math Tutoring')).toBeVisible();
    await expect(page.locator('text=Get Started Free')).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('text=Simple, Transparent Pricing')).toBeVisible();
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Growth')).toBeVisible();
    await expect(page.locator('text=Accelerator')).toBeVisible();
  });

  test('get-started lead capture form loads', async ({ page }) => {
    await page.goto('/get-started');
    await expect(page.locator('text=Unlock Your Student')).toBeVisible();
    await expect(page.locator('input[name="parentName"]')).toBeVisible();
    await expect(page.locator('input[name="parentEmail"]')).toBeVisible();
  });
});

test.describe('RBAC Enforcement', () => {
  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/parent');
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('parent cannot access /admin', async ({ page }) => {
    // Login as parent
    await page.goto('/login');
    await page.fill('input[name="email"]', DEMO_ACCOUNTS.parent.email);
    await page.fill('input[name="password"]', DEMO_ACCOUNTS.parent.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/parent**', { timeout: 15000 });

    // Try to access admin
    await page.goto('/admin');
    // Should be redirected back to parent dashboard
    await page.waitForURL('**/parent**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/parent/);
  });
});

test.describe('Password Reset', () => {
  test('reset password page loads', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
