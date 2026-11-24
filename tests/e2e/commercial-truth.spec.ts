/**
 * E2E: commercial truth (MP-M1 S1 task 7)
 * Public tier pages show the current Foundation price ($379) and never the
 * retired $349 subscription price. Summer clinic pages are excluded because
 * Advantage Math 8 is legitimately $349.
 */
import { test, expect } from "@playwright/test";

const FOUNDATION_PRICE = /\$\s*379\b/;
const RETIRED_FOUNDATION_PRICE = /\$\s*349\b/;
const RETIRED_ADVANCED_PRICE = /\$\s*799\b/;

const PRICE_PAGES = ["/pricing", "/compare", "/enroll/foundation"];
const TIER_PAGES = [...PRICE_PAGES, "/", "/for", "/signup"];

test.describe("Commercial truth", () => {
  for (const path of PRICE_PAGES) {
    test(`${path} shows Foundation at $379`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).toContainText(FOUNDATION_PRICE);
    });
  }

  for (const path of TIER_PAGES) {
    test(`${path} shows no retired tier price`, async ({ page }) => {
      await page.goto(path);
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(RETIRED_FOUNDATION_PRICE);
      expect(text).not.toMatch(RETIRED_ADVANCED_PRICE);
    });
  }
});
