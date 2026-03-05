import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "./helpers";

test.describe("Setup → Play flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "25");
    });
  });

  test("navigates to setup and shows image source tabs", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /choose photo/i }).click();

    await expect(page).toHaveURL(/\/new/, { timeout: 15000 });
    await expect(page.getByRole("tab", { name: /gallery/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("tab", { name: /upload/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("tab", { name: /camera/i })).toBeVisible({
      timeout: 5000,
    });
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
    await expect(
      page.getByRole("status", { name: /pieces remaining/i }).first(),
    ).toBeVisible();
  });

  test("Setup supports 9×9 (81 pieces) via grid query", async ({ page }) => {
    await page.goto("/new?grid=9x9");
    await page.getByRole("tab", { name: /gallery/i }).click();
    const firstPuzzle = page.getByTestId("gallery-item").first();
    await expect(firstPuzzle).toBeVisible();
    await expect(firstPuzzle).toContainText(/81 pieces/i);
  });
});
