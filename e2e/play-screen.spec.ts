import { test, expect } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Play screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "8");
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
      },
      { img: TINY_IMAGE, grid: "3x3" },
    );
  });

  test("loads play screen with puzzle", async ({ page }) => {
    await page.goto("/play");

    await expect(
      page.getByRole("status", { name: /pieces remaining/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows piece tray", async ({ page }) => {
    await page.goto("/play");

    await expect(page.getByRole("list")).toBeVisible({ timeout: 15000 });
  });

  test("tray visible on mobile (sidebar layout)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/play");

    await expect(
      page.getByRole("status", { name: /pieces remaining/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    // Unified layout: tray in left sidebar, always visible (no collapse handle)
    await expect(page.getByRole("list")).toBeVisible({ timeout: 5000 });
  });
});
