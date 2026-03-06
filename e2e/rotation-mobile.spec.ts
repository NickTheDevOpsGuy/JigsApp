import { test, expect } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function getPieceRotation(page: import("@playwright/test").Page, pieceId: string) {
  return await page.evaluate((id) => {
    const raw = localStorage.getItem("phuzzle:puzzleState");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as {
        pieces?: Array<{ id: string; rotation: number }>;
      };
      const piece = parsed.pieces?.find((p) => p.id === id);
      return typeof piece?.rotation === "number" ? piece.rotation : null;
    } catch {
      return null;
    }
  }, pieceId);
}

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

  test("tray pieces can be moved to board and rotated repeatedly", async ({ page }) => {
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

    // Rotate a representative set from tray -> board to catch intermittent tap/selection misses.
    const attempts = Math.min(initialCount, 6);
    for (let i = 0; i < attempts; i++) {
      const btn = trayButtons.first();
      const label = await btn.getAttribute("aria-label");
      expect(label).toBeTruthy();
      const pieceId = String(label)
        .replace(/^Place piece\s+/, "")
        .trim();

      await btn.click();

      await expect
        .poll(async () => await getPieceRotation(page, pieceId), {
          timeout: 5000,
          intervals: [200, 300, 500],
        })
        .not.toBeNull();

      const beforeRotation = (await getPieceRotation(page, pieceId)) as number;
      await page.keyboard.press("r");

      await expect
        .poll(async () => await getPieceRotation(page, pieceId), {
          timeout: 5000,
          intervals: [200, 300, 500],
        })
        .not.toBe(beforeRotation);

      const afterRotation = (await getPieceRotation(page, pieceId)) as number;
      const delta = (afterRotation - beforeRotation + 360) % 360;
      expect(delta % 90).toBe(0);
    }
  });
});
