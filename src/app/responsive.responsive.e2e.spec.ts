import { expect, test, type Locator, type Page } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const BOARD_SQUARE_TOLERANCE_PX = 4;
const ALIGNMENT_TOLERANCE_PX = 2;

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

async function expectPlayChromeAligned(page: Page) {
  const metrics = await page.evaluate(() => {
    const top = document.querySelector<HTMLElement>(
      "[data-layout='gameplay-shell'] [class*='topBarWrap']",
    );
    const board = document.querySelector<HTMLElement>("[data-testid='play-board']");
    const tray = document.querySelector<HTMLElement>("[data-layout='tray-dock']");
    if (!top || !board || !tray) return null;

    const topBox = top.getBoundingClientRect();
    const boardBox = board.getBoundingClientRect();
    const trayBox = tray.getBoundingClientRect();
    return {
      topLeft: topBox.left,
      topRight: topBox.right,
      boardLeft: boardBox.left,
      boardRight: boardBox.right,
      trayLeft: trayBox.left,
      trayRight: trayBox.right,
    };
  });

  expect(metrics).not.toBeNull();
  expect(Math.abs(metrics!.topLeft - metrics!.trayLeft)).toBeLessThanOrEqual(
    ALIGNMENT_TOLERANCE_PX,
  );
  expect(Math.abs(metrics!.topRight - metrics!.trayRight)).toBeLessThanOrEqual(
    ALIGNMENT_TOLERANCE_PX,
  );
  expect(metrics!.boardLeft).toBeGreaterThanOrEqual(metrics!.trayLeft - 1);
  expect(metrics!.boardRight).toBeLessThanOrEqual(metrics!.trayRight + 1);
}

async function expectTrayThumbsHaveFilledPieces(page: Page) {
  let metrics: { nonTransparent: number; light: number; black: number } | null = null;
  await expect
    .poll(
      async () => {
        metrics = await page.evaluate(async () => {
          const imgs = Array.from(
            document.querySelectorAll<HTMLImageElement>("[class*='thumbImg']"),
          ).slice(0, 4);
          if (imgs.length === 0) return null;

          let nonTransparent = 0;
          let light = 0;
          let black = 0;
          for (const img of imgs) {
            if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
              return null;
            }
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0);
            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < data.length; i += 4) {
              const alpha = data[i + 3];
              if (alpha < 8) continue;
              nonTransparent += 1;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              if (r > 80 || g > 80 || b > 80) light += 1;
              if (r < 20 && g < 20 && b < 20) black += 1;
            }
          }
          return { nonTransparent, light, black };
        });
        return metrics?.nonTransparent ?? 0;
      },
      { timeout: 15000 },
    )
    .toBeGreaterThan(400);

  expect(metrics).not.toBeNull();
  expect(metrics!.light).toBeGreaterThan(100);
  expect(metrics!.black / metrics!.nonTransparent).toBeLessThan(0.5);
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
    ).toBeLessThanOrEqual(BOARD_SQUARE_TOLERANCE_PX);
    expect(trayBox?.y ?? 0).toBeGreaterThanOrEqual(
      (boardBox?.y ?? 0) + (boardBox?.height ?? 0) - 2,
    );
    expect(
      (trayBox?.y ?? Number.POSITIVE_INFINITY) + (trayBox?.height ?? 0),
    ).toBeLessThanOrEqual((viewport?.height ?? 0) + 2);
    await expectPlayChromeAligned(page);
    await expectTrayThumbsHaveFilledPieces(page);

    const trayClipping = await tray.evaluate((node) => {
      const scroller = node as HTMLElement;
      const trayRoot = scroller.parentElement?.parentElement;
      if (!trayRoot) return null;
      const scrollerBox = scroller.getBoundingClientRect();
      const trayRootBox = trayRoot.getBoundingClientRect();
      return {
        scrollerBottom: scrollerBox.bottom,
        trayRootBottom: trayRootBox.bottom,
      };
    });
    expect(trayClipping).not.toBeNull();
    expect(trayClipping!.scrollerBottom).toBeLessThanOrEqual(
      trayClipping!.trayRootBottom + 1,
    );
    await expectNoDocumentOverflow(page);
  });

  test("play header menu stays anchored and scrolls internally", async ({ page }) => {
    for (const viewport of [
      { width: 393, height: 852 },
      { width: 820, height: 1180 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/play");

      const openMenu = page.getByRole("button", { name: /open menu/i }).first();
      await expect(openMenu).toBeVisible({ timeout: 15000 });
      await openMenu.evaluate((node) => (node as HTMLButtonElement).click());

      const panel = page.locator("[data-header-menu-panel='true']");
      const closeMenu = page.getByRole("button", { name: /close menu/i }).first();
      await expect(panel).toBeVisible();
      await page.waitForTimeout(200);

      const triggerBox = await closeMenu.boundingBox();
      const panelBox = await panel.boundingBox();

      expect(triggerBox).not.toBeNull();
      expect(panelBox).not.toBeNull();
      const triggerBottom = (triggerBox?.y ?? 0) + (triggerBox?.height ?? 0);
      expect(panelBox?.y ?? 0).toBeGreaterThanOrEqual(triggerBottom - 3);
      expect(panelBox?.y ?? 0).toBeLessThanOrEqual(triggerBottom + 12);
      expect(Math.abs((panelBox?.x ?? 0) - (triggerBox?.x ?? 0))).toBeLessThanOrEqual(12);
      expect(panelBox?.width ?? 0).toBeGreaterThanOrEqual(220);
      await expectWithinViewport(page, panel);
      await expectNoDocumentOverflow(page);

      await closeMenu.evaluate((node) => (node as HTMLButtonElement).click());
    }

    await page.setViewportSize({ width: 393, height: 300 });
    await page.goto("/play");
    await page
      .getByRole("button", { name: /open menu/i })
      .first()
      .evaluate((node) => (node as HTMLButtonElement).click());
    await page
      .getByRole("menuitem", { name: /^Settings$/ })
      .evaluate((node) => (node as HTMLButtonElement).click());

    const panel = page.locator("[data-header-menu-panel='true']");
    await expect(panel).toBeVisible();
    await panel.evaluate((node) => {
      (node as HTMLElement).style.maxHeight = "80px";
    });
    await expect
      .poll(() =>
        panel.evaluate((node) => {
          const el = node as HTMLElement;
          return el.scrollHeight - el.clientHeight;
        }),
      )
      .toBeGreaterThan(0);

    await panel.evaluate((node) => {
      const el = node as HTMLElement;
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await expect(panel).toBeVisible();
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
    expect(boardBox?.width ?? 0).toBeGreaterThanOrEqual(560);
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

  test("play keeps touch-first tray flow and clamps tray scroll at both edges", async ({
    page,
    browserName,
  }) => {
    await page.goto("/play");

    const tray = page.getByRole("list");
    await expect(tray).toBeVisible({ timeout: 15000 });
    await expect(tray.getByRole("button", { name: /place piece/i }).first()).toBeVisible({
      timeout: 15000,
    });

    const hasCoarsePointer = await page.evaluate(
      () => window.matchMedia("(pointer: coarse)").matches,
    );
    if (hasCoarsePointer) {
      await expect(page.getByRole("button", { name: /scroll left/i })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /scroll right/i })).toHaveCount(0);
    }

    await expect
      .poll(
        async () =>
          tray.evaluate((node) => {
            const el = node as HTMLDivElement;
            return Math.max(0, el.scrollWidth - el.clientWidth);
          }),
        { timeout: 15000 },
      )
      .toBeGreaterThan(0);

    const right = await tray.evaluate((node) => {
      const el = node as HTMLDivElement;
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
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
