import { test, expect } from "@playwright/test";

test.describe("Setup → Play flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "6");
    });
  });

  test("navigates to setup and shows image source tabs", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /choose photo/i }).click();

    await expect(page).toHaveURL(/\/new/);
    await expect(page.getByRole("tab", { name: /gallery/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /upload/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /camera/i })).toBeVisible();
  });

  test("selects gallery puzzle and starts game", async ({ page }) => {
    await page.goto("/new");

    const galleryTab = page.getByRole("tab", { name: /gallery/i });
    await galleryTab.click();

    const firstPuzzle = page.getByTestId("gallery-item").first();
    await firstPuzzle.click();

    await expect(page.getByRole("button", { name: /start puzzle/i })).toBeEnabled();
    await page.getByRole("button", { name: /start puzzle/i }).click();

    await expect(page).toHaveURL(/\/play/);
    await expect(page.getByRole("status", { name: /pieces remaining/i }).first()).toBeVisible();
  });
});
