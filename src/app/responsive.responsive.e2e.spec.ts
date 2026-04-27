import { expect, test } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const BOARD_SQUARE_TOLERANCE_PX = 4;

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
    expect(
      Math.abs((boardBox?.width ?? 0) - (boardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(BOARD_SQUARE_TOLERANCE_PX);
    expect(
      (trayBox?.y ?? Number.POSITIVE_INFINITY) + (trayBox?.height ?? 0),
    ).toBeLessThan((viewport?.height ?? 0) + 1);
  });

  test("play keeps touch-first tray flow and clamps tray scroll at both edges", async ({
    page,
    browserName,
  }) => {
    await page.goto("/play");

    const tray = page.getByRole("list");
    await expect(tray).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole("button", { name: /scroll left/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /scroll right/i })).toHaveCount(0);

    const right = await tray.evaluate((node) => {
      const el = node as HTMLDivElement;
      const paddingStart = 12;
      const paddingEnd = 12;
      const row = el.firstElementChild as HTMLElement | null;
      const contentWidth =
        row && row.offsetWidth > 0
          ? paddingStart + row.offsetWidth + paddingEnd
          : el.scrollWidth;
      const max = Math.max(0, contentWidth - el.clientWidth);
      const before = el.scrollLeft;
      el.scrollTo({ left: max });
      el.scrollBy({ left: 2000 });
      return {
        before,
        max,
        after: el.scrollLeft,
      };
    });

    expect(right.max).toBeGreaterThan(0);
    expect(right.after).toBeGreaterThanOrEqual(right.before);
    expect(right.after).toBeLessThanOrEqual(right.max + 1);

    const left = await tray.evaluate(async (node) => {
      const el = node as HTMLDivElement;
      el.scrollLeft = 0;
      el.scrollBy({ left: -2000 });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return el.scrollLeft;
    });

    // WebKit can report transient rubber-band overscroll before it settles/clamps.
    const minLeft = browserName === "webkit" ? -48 : 0;
    expect(left).toBeGreaterThanOrEqual(minLeft);
  });
});
