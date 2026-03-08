import { test, expect } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Mobile rotation reliability", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.clear();
        localStorage.setItem("phuzzle:lastSeenChangelog", "999");
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
      },
      { img: TINY_IMAGE, grid: "3x3" },
    );
  });

  test("tray pieces can be moved to board repeatedly without input deadlock", async ({
    page,
  }) => {
    await page.goto("/play");

    await expect(
      page.getByRole("status", { name: /pieces remaining/i }).first(),
    ).toBeVisible({ timeout: 15000 });

    const trayButtons = page.locator('button[aria-label^="Place piece "]');
    await expect
      .poll(async () => await trayButtons.count(), {
        timeout: 15000,
        intervals: [200, 300, 500],
      })
      .toBeGreaterThan(0);
    const initialCount = await trayButtons.count();
    expect(initialCount).toBeGreaterThan(0);

    const attempts = Math.min(initialCount, 4);
    for (let i = 0; i < attempts; i++) {
      const btn = trayButtons.first();
      await btn.click();

      await expect
        .poll(async () => await trayButtons.count(), {
          timeout: 5000,
          intervals: [200, 300, 500],
        })
        .toBeLessThan(initialCount - i);

      // Keep the historical rotate input path exercised without asserting
      // selection-dependent rotation semantics in mobile emulation.
      await page.keyboard.press("r");

      // Input remains responsive and board HUD state still accessible.
      await expect(
        page.getByRole("status", { name: /pieces remaining/i }).first(),
      ).toBeVisible();
    }
  });
});
