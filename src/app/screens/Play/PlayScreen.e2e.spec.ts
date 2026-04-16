import { test, expect } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const COMPLETE_HEADING = /^complete$/i;
const SHARE_RESULT_MENU_ITEM = /share your result/i;
const CHALLENGE_MENU_ITEM = /challenge a friend/i;

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
      page.getByRole("status", { name: /pieces placed/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: /open menu/i })).toBeVisible({
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
      page.getByRole("status", { name: /pieces placed/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    // Layout: board on top, tray below; tray always visible
    await expect(page.getByRole("list")).toBeVisible({ timeout: 5000 });
  });

  test("completion overlay shows expected UI when visible", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeVisible({
      timeout: 20000,
    });
    const optionsTrigger = page.getByRole("button", { name: /options/i });
    await expect(optionsTrigger).toBeVisible({
      timeout: 10000,
    });
    await optionsTrigger.click();
    await expect(
      page.getByRole("menuitem", { name: SHARE_RESULT_MENU_ITEM }),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("menuitem", { name: CHALLENGE_MENU_ITEM })).toBeVisible({
      timeout: 10000,
    });
  });

  test("completion overlay fits on mobile without body scroll", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeVisible({
      timeout: 20000,
    });
    const optionsTrigger = page.getByRole("button", { name: /options/i });
    await expect(optionsTrigger).toBeVisible({
      timeout: 10000,
    });
    await optionsTrigger.click();
    await expect(
      page.getByRole("menuitem", { name: SHARE_RESULT_MENU_ITEM }),
    ).toBeVisible({
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

    const completionCard = page.getByRole("dialog", { name: /dialog/i });
    const cardBounds = await completionCard.boundingBox();
    expect(cardBounds).not.toBeNull();
    expect(cardBounds!.y).toBeGreaterThan(0);
  });

  test("mobile completion options menu lists share actions", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await expect(
      page.getByRole("menuitem", { name: SHARE_RESULT_MENU_ITEM }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: CHALLENGE_MENU_ITEM })).toBeVisible();
  });

  test("short mobile completion overlay keeps the card on-screen", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 360, height: 480 });
    await page.goto("/play?e2eCompletion=1");

    const dialog = page.getByRole("dialog", { name: /dialog/i });
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog).toBeInViewport();
    await expect(page.getByRole("button", { name: /options/i })).toBeVisible();
  });

  test("mobile replay opens from completion options and stays dismissed after close", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    const replayItem = page.getByRole("menuitem", { name: /replay solve/i });
    await expect(replayItem).toBeVisible({ timeout: 10000 });
    await replayItem.click();

    const replayHeading = page.getByRole("heading", { name: /replay solve/i });
    const replayClose = page.getByRole("button", { name: /close replay/i });
    const replayProgress = page.getByRole("slider", { name: /replay progress/i });

    await expect(replayHeading).toBeVisible({ timeout: 10000 });
    await expect(replayClose).toBeInViewport();
    await expect(replayProgress).toBeInViewport();
    await expect(page.locator("[data-cutout-panel]")).toHaveCount(4);
    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeHidden();

    await replayClose.click();

    await expect(replayHeading).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeHidden();
    await expect(
      page.getByRole("status", { name: /pieces placed/i }).first(),
    ).toBeVisible();
  });

  test("short mobile replay keeps header and controls inside the viewport", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: /replay solve/i }).click();

    await expect(page.getByRole("heading", { name: /replay solve/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /close replay/i })).toBeInViewport();
    await expect(page.getByRole("slider", { name: /replay progress/i })).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeInViewport();

    const liveBoard = page.getByTestId("play-board");
    const liveBoardBox = await liveBoard.boundingBox();
    expect(liveBoardBox).not.toBeNull();
    expect(
      Math.abs((liveBoardBox?.width ?? 0) - (liveBoardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
  });

  test("desktop completion options menu lists share actions", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await expect(
      page.getByRole("menuitem", { name: SHARE_RESULT_MENU_ITEM }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: CHALLENGE_MENU_ITEM })).toBeVisible();
  });
});

test.describe("Play screen tablet touch", () => {
  test.use({ viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true });

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

  test("tablet gameplay keeps board square and tray reachable", async ({ page }) => {
    await page.goto("/play");

    const liveBoard = page.getByTestId("play-board");
    await expect(liveBoard).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("list")).toBeVisible({ timeout: 5000 });

    const liveBoardBox = await liveBoard.boundingBox();
    expect(liveBoardBox).not.toBeNull();
    expect(
      Math.abs((liveBoardBox?.width ?? 0) - (liveBoardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);

    const trayBox = await page.getByRole("list").boundingBox();
    expect(trayBox).not.toBeNull();
    expect((trayBox?.y ?? Number.POSITIVE_INFINITY) + (trayBox?.height ?? 0)).toBeLessThan(
      1024,
    );
  });

  test("tablet replay keeps live board square and controls visible", async ({ page }) => {
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: /replay solve/i }).click();

    await expect(page.getByRole("heading", { name: /replay solve/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /close replay/i })).toBeInViewport();
    await expect(page.getByRole("slider", { name: /replay progress/i })).toBeInViewport();

    const liveBoard = page.getByTestId("play-board");
    const liveBoardBox = await liveBoard.boundingBox();
    expect(liveBoardBox).not.toBeNull();
    expect(
      Math.abs((liveBoardBox?.width ?? 0) - (liveBoardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
  });
});

test.describe("Play screen landscape phone", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

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

  test("landscape completion card stays on-screen", async ({ page }) => {
    await page.goto("/play?e2eCompletion=1");

    const dialog = page.getByRole("dialog", { name: /dialog/i });
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog).toBeInViewport();
    await expect(page.getByRole("button", { name: /options/i })).toBeInViewport();
  });

  test("landscape replay keeps controls visible", async ({ page }) => {
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: /replay solve/i }).click();

    await expect(page.getByRole("button", { name: /close replay/i })).toBeInViewport();
    await expect(page.getByRole("slider", { name: /replay progress/i })).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeInViewport();
  });
});
