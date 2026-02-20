import { test, expect } from "@playwright/test";

test.describe("Home / Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "6");
    });
  });

  test("loads the app and shows the menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByAltText("Phuzzle logo")).toBeVisible();
  });

  test("shows main action buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /today's puzzle/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /choose photo/i })).toBeVisible();
  });

  test("corner buttons: Stats on left, Help on right", async ({ page }) => {
    await page.goto("/");
    const statsBtn = page.getByRole("button", { name: /stats and leaderboard/i });
    const helpBtn = page.getByRole("button", { name: /help/i });
    await expect(statsBtn).toBeVisible();
    await expect(helpBtn).toBeVisible();

    await statsBtn.click();
    await expect(page).toHaveURL(/\/stats/);
  });

  test("help button opens help modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /help/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: /how to play/i })).toBeVisible();
  });
});
