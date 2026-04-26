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

  test("mobile replay returns to the current completion overlay after close", async ({
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
    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeVisible();
  });

  test("mobile replay transport buttons keep a consistent size", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: /replay solve/i }).click();

    const restartButton = page.getByRole("button", { name: /restart/i });
    const playButton = page.getByRole("button", { name: "Play", exact: true });

    await expect(restartButton).toBeInViewport();
    await expect(playButton).toBeInViewport();

    const restartBox = await restartButton.boundingBox();
    const playBox = await playButton.boundingBox();

    expect(restartBox).not.toBeNull();
    expect(playBox).not.toBeNull();
    expect(
      Math.abs((playBox?.width ?? 0) - (restartBox?.width ?? 0)),
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs((playBox?.height ?? 0) - (restartBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
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

  test("mobile replay puts playback options (cog) in the timeline row, not under transport", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: /replay solve/i }).click();

    const playButton = page.getByRole("button", { name: "Play", exact: true });
    const optionsButton = page.getByRole("button", {
      name: /replay and playback options/i,
    });

    await expect(playButton).toBeInViewport();
    await expect(optionsButton).toBeInViewport();

    const playBox = await playButton.boundingBox();
    const optionsBox = await optionsButton.boundingBox();

    expect(playBox).not.toBeNull();
    expect(optionsBox).not.toBeNull();
    /* Cog sits in the seek meta row above the transport strip — higher on screen than Play */
    expect((playBox?.y ?? 0) - (optionsBox?.y ?? 0)).toBeGreaterThan(24);
  });

  test("tablet landscape replay keeps the dock on-screen and attached to the board", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: /replay solve/i }).click();

    const replayHeading = page.getByRole("heading", { name: /replay solve/i });
    const replayClose = page.getByRole("button", { name: /close replay/i });
    const replayProgress = page.getByRole("slider", { name: /replay progress/i });
    const dock = page.locator('[data-replay-dock="true"]');

    await expect(replayHeading).toBeVisible({ timeout: 10000 });
    await expect(replayClose).toBeInViewport();
    await expect(replayProgress).toBeInViewport();
    await expect(dock).toBeInViewport();

    const viewport = page.viewportSize();
    const dockBox = await dock.boundingBox();
    const boardBox = await page.getByTestId("play-board").boundingBox();

    expect(viewport).not.toBeNull();
    expect(dockBox).not.toBeNull();
    expect(boardBox).not.toBeNull();
    expect((dockBox?.x ?? 0) + (dockBox?.width ?? 0)).toBeLessThanOrEqual(
      (viewport?.width ?? 0) + 1,
    );
    expect((dockBox?.y ?? 0) + (dockBox?.height ?? 0)).toBeLessThanOrEqual(
      (viewport?.height ?? 0) + 1,
    );
    expect(Math.abs((dockBox?.x ?? 0) - (boardBox?.x ?? 0))).toBeLessThanOrEqual(
      (boardBox?.width ?? 0) + 32,
    );
  });

  test("short desktop replay keeps header, slider, and controls reachable", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/play?e2eCompletion=1");

    await page.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: /replay solve/i }).click();

    const replayClose = page.getByRole("button", { name: /close replay/i });
    const replayProgress = page.getByRole("slider", { name: /replay progress/i });
    const playButton = page.getByRole("button", { name: "Play", exact: true });
    const optionsButton = page.getByRole("button", {
      name: /replay and playback options/i,
    });
    const dock = page.locator('[data-replay-dock="true"]');

    await expect(replayClose).toBeInViewport();
    await expect(replayProgress).toBeInViewport();
    await expect(playButton).toBeInViewport();
    await expect(optionsButton).toBeInViewport();
    await expect(dock).toBeInViewport();

    const dockCompact = await dock.getAttribute("data-dock-compact");
    expect(dockCompact).toBe("true");
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

  test("starting a new puzzle from play applies the newly selected grid", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeVisible({
      timeout: 20000,
    });

    await page
      .getByRole("button", { name: /options: next puzzle, replay, share/i })
      .click();
    await page.getByRole("menuitem", { name: /new puzzle/i }).click();

    await expect(page.getByRole("dialog", { name: /choose category/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /nature/i }).click();
    await expect(page.getByRole("dialog", { name: /choose puzzle/i })).toBeVisible();

    await page
      .getByRole("option", { name: /select /i })
      .first()
      .click();
    await expect(page.getByRole("dialog", { name: /puzzle setup/i })).toBeVisible();
    await page.getByRole("button", { name: /hard, 25 pieces/i }).click();
    await page.getByRole("button", { name: /start puzzle/i }).click();

    await expect(
      page.getByRole("status", { name: /pieces placed/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });

    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("phuzzle:gridSize")))
      .toBe("5x5");
  });
});

test.describe("Play screen tablet touch", () => {
  test.use({ viewport: { width: 768, height: 1024 }, hasTouch: true });

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
    expect(
      (trayBox?.y ?? Number.POSITIVE_INFINITY) + (trayBox?.height ?? 0),
    ).toBeLessThan(1024);
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

  test("tablet landscape keeps the tray dock below the board without clipping", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/play");

    const liveBoard = page.getByTestId("play-board");
    const tray = page.getByRole("list");
    await expect(liveBoard).toBeVisible({ timeout: 15000 });
    await expect(tray).toBeVisible({ timeout: 5000 });

    const liveBoardBox = await liveBoard.boundingBox();
    const trayBox = await tray.boundingBox();
    expect(liveBoardBox).not.toBeNull();
    expect(trayBox).not.toBeNull();
    expect(trayBox?.y ?? 0).toBeGreaterThanOrEqual(
      (liveBoardBox?.y ?? 0) + (liveBoardBox?.height ?? 0) - 2,
    );
    expect((trayBox?.y ?? 0) + (trayBox?.height ?? 0)).toBeLessThanOrEqual(768);
  });

  test("tablet rotate keeps the board square and tray visible", async ({ page }) => {
    await page.goto("/play");

    const liveBoard = page.getByTestId("play-board");
    const tray = page.getByRole("list");
    await expect(liveBoard).toBeVisible({ timeout: 15000 });
    await expect(tray).toBeVisible({ timeout: 5000 });

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(liveBoard).toBeVisible();
    await expect(tray).toBeVisible();

    const landscapeBoardBox = await liveBoard.boundingBox();
    const landscapeTrayBox = await tray.boundingBox();
    expect(landscapeBoardBox).not.toBeNull();
    expect(landscapeTrayBox).not.toBeNull();
    expect(
      Math.abs((landscapeBoardBox?.width ?? 0) - (landscapeBoardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
    expect(landscapeTrayBox?.y ?? 0).toBeGreaterThanOrEqual(
      (landscapeBoardBox?.y ?? 0) + (landscapeBoardBox?.height ?? 0) - 2,
    );

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(liveBoard).toBeVisible();
    await expect(tray).toBeVisible();

    const portraitBoardBox = await liveBoard.boundingBox();
    expect(portraitBoardBox).not.toBeNull();
    expect(
      Math.abs((portraitBoardBox?.width ?? 0) - (portraitBoardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
  });
});

test.describe("Play screen landscape phone", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

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

  test("landscape gameplay keeps board usable and tray below", async ({ page }) => {
    await page.goto("/play");

    const liveBoard = page.getByTestId("play-board");
    const tray = page.getByRole("list");
    await expect(liveBoard).toBeVisible({ timeout: 15000 });
    await expect(tray).toBeVisible({ timeout: 5000 });

    const liveBoardBox = await liveBoard.boundingBox();
    const trayBox = await tray.boundingBox();
    expect(liveBoardBox).not.toBeNull();
    expect(trayBox).not.toBeNull();
    expect(liveBoardBox?.width ?? 0).toBeGreaterThanOrEqual(160);
    expect(
      Math.abs((liveBoardBox?.width ?? 0) - (liveBoardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
    expect(trayBox?.y ?? 0).toBeGreaterThanOrEqual(
      (liveBoardBox?.y ?? 0) + (liveBoardBox?.height ?? 0) - 2,
    );
    expect((trayBox?.y ?? 0) + (trayBox?.height ?? 0)).toBeLessThanOrEqual(392);
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
