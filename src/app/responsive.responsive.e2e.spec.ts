import { expect, test } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Responsive smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "25");
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
      },
      { img: TINY_IMAGE, grid: "4x4" },
    );
  });

  test("home fits current device class without document scroll", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);

    await expect(
      page.getByRole("button", { name: /play today|completed/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /puzzle packs/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /quick play/i })).toBeVisible();

    const metrics = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        scrollHeight: scroller.scrollHeight,
        clientHeight: scroller.clientHeight,
      };
    });

    expect(metrics.scrollHeight - metrics.clientHeight).toBeLessThanOrEqual(2);
  });

  test("stats route keeps header and content visible", async ({ page }) => {
    await page.goto("/stats");

    await expect(
      page
        .getByRole("button", { name: /back/i })
        .or(page.getByRole("button", { name: /close/i }))
        .first(),
    ).toBeVisible();
    await expect(page.getByTestId("stats-card-content")).toBeVisible();
  });

  test("play keeps board square and tray reachable", async ({ page }) => {
    await page.goto("/play");

    const board = page.getByTestId("play-board");
    const tray = page.getByRole("list");

    await expect(board).toBeVisible({ timeout: 15000 });
    await expect(tray).toBeVisible({ timeout: 5000 });

    const boardBox = await board.boundingBox();
    const trayBox = await tray.boundingBox();
    const viewport = page.viewportSize();

    expect(boardBox).not.toBeNull();
    expect(trayBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.abs((boardBox?.width ?? 0) - (boardBox?.height ?? 0))).toBeLessThanOrEqual(
      2,
    );
    expect((trayBox?.y ?? Number.POSITIVE_INFINITY) + (trayBox?.height ?? 0)).toBeLessThan(
      (viewport?.height ?? 0) + 1,
    );
  });
});
