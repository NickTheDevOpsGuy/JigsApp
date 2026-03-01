import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "./helpers";

test.describe("Home / Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "25");
    });
  });

  test("loads the app and shows the menu", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByAltText("Phuzzle logo")).toBeVisible();
  });

  test("shows main action buttons", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("button", { name: /today's puzzle/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /choose photo/i })).toBeVisible();
  });

  test("corner buttons: Stats on left, Help on right", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("button", { name: /today's puzzle/i })).toBeVisible({
      timeout: 15000,
    });
    const statsBtn = page.getByTestId("menu-stats");
    const helpBtn = page.getByTestId("menu-help");
    await expect(statsBtn).toBeVisible({ timeout: 10000 });
    await expect(helpBtn).toBeVisible({ timeout: 10000 });

    await statsBtn.click();
    await expect(page).toHaveURL(/\/stats/, { timeout: 15000 });
  });

  test("help button opens help modal", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("button", { name: /today's puzzle/i })).toBeVisible({
      timeout: 15000,
    });
    await page.getByTestId("menu-help").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /how to play/i })).toBeVisible({
      timeout: 10000,
    });
  });
});
