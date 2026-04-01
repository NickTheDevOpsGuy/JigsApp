import { test, expect } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const COMPLETE_HEADING = /^complete$/i;
const SHARE_RESULT_MENU_ITEM = /share your result/i;
const DAILY_SHARE_MENU_ITEM = /daily share/i;

test.describe("Completion Options menu — edge cases", () => {
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

  test("Escape closes the options menu but keeps the completion overlay", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/play?e2eCompletion=1");

    const heading = page.getByRole("heading", { name: COMPLETE_HEADING });
    await expect(heading).toBeVisible({ timeout: 20000 });

    await page.getByRole("button", { name: /options/i }).click();
    const shareItem = page.getByRole("menuitem", { name: SHARE_RESULT_MENU_ITEM });
    await expect(shareItem).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Escape");
    await expect(shareItem).toBeHidden({ timeout: 5000 });
    await expect(heading).toBeVisible();
  });

  test("click outside the menu closes the options menu", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/play?e2eCompletion=1");

    const heading = page.getByRole("heading", { name: COMPLETE_HEADING });
    await expect(heading).toBeVisible({ timeout: 20000 });

    await page.getByRole("button", { name: /options/i }).click();
    const shareItem = page.getByRole("menuitem", { name: SHARE_RESULT_MENU_ITEM });
    await expect(shareItem).toBeVisible({ timeout: 10000 });

    await heading.click();
    await expect(shareItem).toBeHidden({ timeout: 5000 });
  });

  test("short viewport: portalled menu stays on-screen", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 360, height: 480 });
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeVisible({
      timeout: 20000,
    });

    await page.getByRole("button", { name: /options/i }).click();
    const menu = page.locator("[data-complete-options-menu]");
    await expect(menu).toBeVisible({ timeout: 10000 });
    await expect(menu).toBeInViewport();
  });
});

test.describe("Completion Options menu — daily row", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const today = `${yyyy}-${mm}-${dd}`;

        localStorage.setItem("phuzzle:lastSeenChangelog", "999");
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
        localStorage.setItem("phuzzle:dailyDate", today);
      },
      { img: TINY_IMAGE, grid: "3x3" },
    );
  });

  test("daily session lists Daily Share in Options", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeVisible({
      timeout: 20000,
    });

    await page.getByRole("button", { name: /options/i }).click();
    await expect(page.getByRole("menuitem", { name: DAILY_SHARE_MENU_ITEM })).toBeVisible(
      {
        timeout: 10000,
      },
    );
  });
});

test.describe("Completion overlay dismissal guardrails", () => {
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

  for (const viewport of [
    { name: "desktop", size: { width: 1280, height: 900 } },
    { name: "mobile", size: { width: 375, height: 667 } },
  ]) {
    test(`stays open on ${viewport.name} when dismiss shortcuts are used`, async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.setViewportSize(viewport.size);
      await page.goto("/play?e2eCompletion=1");

      const heading = page.getByRole("heading", { name: COMPLETE_HEADING });
      await expect(heading).toBeVisible({ timeout: 20000 });

      await page.keyboard.press("Escape");
      await expect(heading).toBeVisible();

      const dialog = page.getByRole("dialog", { name: /dialog/i });
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();

      await page.mouse.click(
        Math.floor(bounds!.x + bounds!.width / 2),
        Math.max(2, Math.floor(bounds!.y - 6)),
      );

      await expect(heading).toBeVisible();
    });
  }
});
