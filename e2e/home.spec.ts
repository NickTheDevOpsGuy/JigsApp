import { test, expect } from "@playwright/test";

test.describe("Home / Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "14");
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
    await expect(page.getByAltText("Phuzzle logo")).toBeVisible();
    const statsBtn = page.getByTestId("menu-stats");
    const helpBtn = page.getByTestId("menu-help");
    await expect(statsBtn).toBeVisible({ timeout: 10000 });
    await expect(helpBtn).toBeVisible({ timeout: 5000 });

    await statsBtn.click();
    await expect(page).toHaveURL(/\/stats/, { timeout: 10000 });
  });

  test("help button opens help modal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByAltText("Phuzzle logo")).toBeVisible();
    await page.getByTestId("menu-help").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /how to play/i })).toBeVisible({
      timeout: 5000,
    });
  });
});
