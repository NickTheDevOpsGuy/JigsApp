import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

test.describe("Packs and Stats", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "25");
    });
  });

  test("Packs list loads and shows packs", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /puzzle packs/i }).click();

    const dialog = page.getByRole("dialog", { name: /choose pack/i });
    await expect(dialog).toBeVisible({
      timeout: 15000,
    });
    await expect(dialog.getByRole("listbox", { name: /choose a pack/i })).toBeVisible();
    await expect(
      dialog.getByRole("option", { name: /nature, .* puzzles/i }),
    ).toBeVisible();
  });

  test("Stats screen loads", async ({ page }) => {
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(
      page
        .getByRole("button", { name: /back/i })
        .or(page.getByRole("button", { name: /close/i }))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Stats screen fits on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(
      page
        .getByRole("button", { name: /back/i })
        .or(page.getByRole("button", { name: /close/i }))
        .first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("stats-card-content")).toBeVisible({ timeout: 10000 });
    // With Supabase: tabs (Profile, Board, Badges). Without: Connect Supabase message.
    await expect(
      page.getByRole("tab", { name: /profile/i }).or(page.getByText(/connect supabase/i)),
    ).toBeVisible({ timeout: 5000 });
  });
});
