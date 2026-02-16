import { test, expect } from "@playwright/test";

test.describe("Theme", () => {
  // TODO: Fails when reusing dev server; try with fresh `npm run dev` or CI
  test.skip("opens theme modal from hamburger and switches theme", async ({ page }) => {
    // Start a puzzle via gallery
    await page.goto("/new");
    await page.locator("button:has(img)").first().click();
    await page.getByRole("button", { name: /start puzzle/i }).click();

    // Wait for play screen and puzzle to load
    await expect(page).toHaveURL(/\/play/, { timeout: 15000 });
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible({
      timeout: 15000,
    });

    // Open hamburger menu
    await page.getByRole("button", { name: /menu/i }).click();

    // Open Display submenu
    await page.getByRole("menuitem", { name: /display/i }).click();
    // Click Theme to open modal
    await page.getByTestId("open-theme-modal").click();

    // Theme modal should be visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText(/theme|dark|light/i);

    // Select Dark theme
    await page.getByRole("button", { name: /^dark$/i }).click();

    // Document should have dark theme class
    await expect(page.locator("html")).toHaveClass(/theme-dark/);
  });
});
