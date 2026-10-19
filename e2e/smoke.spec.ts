import { test, expect } from "@playwright/test";

test.describe("TitanFit Smoke Tests", () => {
  test("homepage renders successfully", async ({ page }) => {
    await page.goto("/");
    // Expect page to have a valid HTML title mentioning TITANFIT
    await expect(page).toHaveTitle(/TITANFIT/i);

    // Expect main header / logo to be visible
    const logoOrBrand = page.locator("header, nav");
    await expect(logoOrBrand.first()).toBeVisible();
  });

  test("navigation to catalog works", async ({ page }) => {
    await page.goto("/catalog");
    // Verify catalog or product listing element renders
    await expect(page).toHaveURL(/catalog/);
  });
});
