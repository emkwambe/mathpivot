/**
 * E2E Tests: Lead Capture Flow
 * Tests the public get-started form → admin pipeline
 */
import { test, expect } from '@playwright/test';

test.describe('Lead Capture Flow', () => {
  test('submitting get-started form shows success message', async ({ page }) => {
    await page.goto('/get-started');

    // Fill required fields
    await page.fill('input[name="parentName"]', 'E2E Test Parent');
    await page.fill('input[name="parentEmail"]', `e2e-${Date.now()}@test.com`);
    await page.fill('input[name="parentPhone"]', '555-0123');

    // Fill optional fields
    await page.fill('input[name="studentName"]', 'E2E Test Student');
    await page.selectOption('select[name="studentGrade"]', '9');

    // Fill goals
    await page.fill('textarea[name="goals"]', 'E2E test — improve algebra');

    // Submit
    await page.click('button[type="submit"]');

    // Should show thank you message
    await expect(page.locator('text=Thank You')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=24 hours')).toBeVisible();
  });

  test('form validates required fields', async ({ page }) => {
    await page.goto('/get-started');

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Browser validation should prevent submission (required fields)
    // The page should NOT show the thank you message
    await expect(page.locator('text=Thank You')).not.toBeVisible();
  });
});
