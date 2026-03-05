import { test, expect } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Play screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "25");
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
    await expect(page.getByRole("button", { name: /settings/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows piece tray", async ({ page }) => {
    await page.goto("/play");

    await expect(page.getByRole("list")).toBeVisible({ timeout: 15000 });
  });

  test("tray visible on mobile (board on top, tray below)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/play");

    await expect(
      page.getByRole("status", { name: /pieces remaining/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    // Layout: board on top, tray below; tray always visible
    await expect(page.getByRole("list")).toBeVisible({ timeout: 5000 });
  });

  test("completion overlay shows expected UI when visible", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: /puzzle complete/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole("button", { name: /share result/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /share with people/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("completion overlay fits on mobile without body scroll", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: /puzzle complete/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole("button", { name: /share result/i })).toBeVisible({
      timeout: 10000,
    });

    const before = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        clientHeight: scroller.clientHeight,
        scrollHeight: scroller.scrollHeight,
        scrollY: window.scrollY,
      };
    });

    await page.evaluate(() => window.scrollTo(0, 9999));

    const after = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        clientHeight: scroller.clientHeight,
        scrollHeight: scroller.scrollHeight,
        scrollY: window.scrollY,
      };
    });

    expect(before.scrollHeight - before.clientHeight).toBeLessThanOrEqual(2);
    expect(after.scrollY).toBe(0);
  });
});
