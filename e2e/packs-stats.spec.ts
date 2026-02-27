import { test, expect } from "@playwright/test";

test.describe("Packs and Stats", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "14");
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

  test("Stats screen fits on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(page.getByRole("button", { name: /back/i }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("stats-card-content")).toBeVisible({ timeout: 5000 });
    // With Supabase: tabs (Dashboard, etc.). Without: Connect Supabase message.
    await expect(
      page
        .getByRole("tab", { name: /dashboard|dash/i })
        .or(page.getByText(/connect supabase/i)),
    ).toBeVisible({ timeout: 5000 });
  });
});
