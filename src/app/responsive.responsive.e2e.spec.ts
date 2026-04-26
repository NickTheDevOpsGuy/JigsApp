import { expect, test, type Locator, type Page } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function expectNoDocumentOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    return {
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
      scrollHeight: scroller.scrollHeight,
      clientHeight: scroller.clientHeight,
    };
  });

  expect(metrics.scrollWidth - metrics.clientWidth).toBeLessThanOrEqual(1);
  expect(metrics.scrollHeight - metrics.clientHeight).toBeLessThanOrEqual(2);
}

async function expectWithinViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box?.x ?? 0).toBeGreaterThanOrEqual(-1);
  expect(box?.y ?? 0).toBeGreaterThanOrEqual(-1);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    (viewport?.width ?? 0) + 1,
  );
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    (viewport?.height ?? 0) + 1,
  );
}

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

    await expectNoDocumentOverflow(page);
  });

  test("quick-play modal keeps staged chooser controls reachable", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);

    await page.getByRole("button", { name: /quick play/i }).click();

    const dialog = page.getByRole("dialog", { name: /choose category/i });
    const categoryList = dialog.getByRole("group", { name: /choose a category/i });

    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(categoryList).toBeVisible();
    await expect(dialog.getByRole("button", { name: /nature/i })).toBeVisible();
    await expectWithinViewport(page, dialog);
    await expectNoDocumentOverflow(page);
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
    await expectNoDocumentOverflow(page);
  });

  test("pack list route keeps cards and actions in the device viewport", async ({
    page,
  }) => {
    await page.goto("/packs");

    const backButton = page.getByRole("button", { name: /back to menu/i });
    const firstPack = page.getByRole("button", { name: /open pack: /i }).first();

    await expect(backButton).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /puzzle packs/i })).toBeVisible();
    await expect(firstPack).toBeVisible();
    await expectWithinViewport(page, backButton);
    await expectNoDocumentOverflow(page);
  });

  test("pack detail route keeps puzzle rail controls reachable", async ({ page }) => {
    await page.goto("/packs/nature");

    const backButton = page.getByRole("button", { name: /back to packs/i }).first();
    const puzzleList = page.getByRole("list", { name: /puzzle list/i });
    const firstSolve = page.getByRole("button", { name: /solve /i }).first();

    await expect(backButton).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Nature")).toBeVisible();
    await expect(puzzleList).toBeVisible();
    await expect(firstSolve).toBeVisible();
    await expectWithinViewport(page, backButton);
    await expectWithinViewport(page, firstSolve);
    await expectNoDocumentOverflow(page);
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
    ).toBeLessThanOrEqual(2);
    expect(trayBox?.y ?? 0).toBeGreaterThanOrEqual(
      (boardBox?.y ?? 0) + (boardBox?.height ?? 0) - 2,
    );
    expect(
      (trayBox?.y ?? Number.POSITIVE_INFINITY) + (trayBox?.height ?? 0),
    ).toBeLessThanOrEqual((viewport?.height ?? 0) + 2);
    await expectNoDocumentOverflow(page);
  });

  test("tablet landscape keeps tray below the board", async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto("/play");

    const board = page.getByTestId("play-board");
    const tray = page.getByRole("list");

    await expect(board).toBeVisible({ timeout: 15000 });
    await expect(tray).toBeVisible({ timeout: 5000 });

    const boardBox = await board.boundingBox();
    const trayBox = await tray.boundingBox();

    expect(boardBox).not.toBeNull();
    expect(trayBox).not.toBeNull();
    expect(trayBox?.y ?? 0).toBeGreaterThanOrEqual(
      (boardBox?.y ?? 0) + (boardBox?.height ?? 0) - 2,
    );
    await expectNoDocumentOverflow(page);
  });

  test("phone landscape keeps play board usable", async ({ page }) => {
    await page.setViewportSize({ width: 852, height: 393 });
    const hasCoarsePointer = await page.evaluate(
      () => window.matchMedia("(pointer: coarse)").matches,
    );
    test.skip(!hasCoarsePointer, "short-landscape compact layout is touch-only");
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
    expect(boardBox?.width ?? 0).toBeGreaterThanOrEqual(160);
    expect(
      Math.abs((boardBox?.width ?? 0) - (boardBox?.height ?? 0)),
    ).toBeLessThanOrEqual(2);
    expect(trayBox?.y ?? 0).toBeGreaterThanOrEqual(
      (boardBox?.y ?? 0) + (boardBox?.height ?? 0) - 2,
    );
    expect(
      (trayBox?.y ?? Number.POSITIVE_INFINITY) + (trayBox?.height ?? 0),
    ).toBeLessThanOrEqual((viewport?.height ?? 0) + 2);
    await expectNoDocumentOverflow(page);
  });
});
