import { expect, test, type Locator, type Page } from "@playwright/test";

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

async function expectWithinViewport(page: Page, selector: Locator) {
  const box = await selector.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    (viewport?.width ?? 0) + 1,
  );
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    (viewport?.height ?? 0) + 1,
  );
}

test.describe("Packs screens responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "999");
    });
  });

  test("pack list fits mobile viewport without document overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/packs");

    const backButton = page.getByRole("button", { name: /back to menu/i });
    const allPacksHeading = page.getByRole("heading", { name: /browse all packs/i });

    await expect(backButton).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /puzzle packs/i })).toBeVisible();
    await expect(allPacksHeading).toBeVisible();
    await expect(
      page.getByRole("button", { name: /open pack: /i }).first(),
    ).toBeVisible();

    await expectWithinViewport(page, backButton);
    await expectNoDocumentOverflow(page);
  });

  test("pack list stays usable on tablet portrait", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/packs");

    const firstPack = page.getByRole("button", { name: /open pack: /i }).first();

    await expect(page.getByRole("heading", { name: /puzzle packs/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(firstPack).toBeVisible();
    await expectWithinViewport(page, firstPack);
    await expectNoDocumentOverflow(page);
  });

  test("pack detail fits mobile viewport and keeps puzzle actions reachable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
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

  test("pack detail stays usable on tablet portrait", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/packs/nature");

    const puzzleList = page.getByRole("list", { name: /puzzle list/i });
    const nextButton = page.getByRole("button", { name: /next puzzles/i });

    await expect(
      page.getByRole("button", { name: /back to packs/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(puzzleList).toBeVisible();
    await expect(nextButton).toBeVisible();
    await expectNoDocumentOverflow(page);
  });
});
