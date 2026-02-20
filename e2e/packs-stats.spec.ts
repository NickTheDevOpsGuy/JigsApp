import { test, expect } from "@playwright/test";

test.describe("Packs and Stats", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "6");
    });
  });

  test("Packs list loads and shows packs", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /puzzle packs/i }).click();

    await expect(page).toHaveURL(/\/packs/);
    await expect(page.getByRole("heading", { name: /puzzle packs/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /back to menu/i })).toBeVisible();
  });

  test("Stats screen loads", async ({ page }) => {
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(page.getByRole("button", { name: /back/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
