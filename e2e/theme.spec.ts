import { test, expect } from "@playwright/test";

test.describe("Theme", () => {
  test("opens theme modal from hamburger and switches theme", async ({ page }) => {
    // Start a puzzle via gallery
    await page.goto("/new");
    await page.getByRole("button", { name: /gallery/i }).click();
    await page.locator("button:has(img)").first().click();
    await page.getByRole("button", { name: /start puzzle/i }).click();

    // Wait for play screen
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible({
      timeout: 10000,
    });

    // Open hamburger menu
    await page.getByRole("button", { name: /menu/i }).click();

    // Open Display submenu
    await page.getByRole("menuitem", { name: /display/i }).click();

    // Open Theme (opens modal)
    await page.getByRole("menuitem", { name: /theme/i }).click();

    // Theme modal should be visible
    await expect(page.getByRole("dialog", { name: /theme/i })).toBeVisible();

    // Select Dark theme
    await page.getByRole("button", { name: /dark/i }).click();

    // Dark should show as selected
    await expect(page.getByRole("button", { name: /dark.*selected/i })).toBeVisible();

    // Document should have dark theme class
    await expect(page.locator("html")).toHaveClass(/theme-dark/);
  });
});
