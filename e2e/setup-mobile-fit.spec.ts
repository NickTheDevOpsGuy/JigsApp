import { test, expect, type Page } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "./helpers";

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 740 },
] as const;

async function openChoosePhoto(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissWhatsNewModalIfOpen(page);
  await page.getByRole("button", { name: /choose photo/i }).click();
  await expect(page.getByRole("dialog", { name: /choose category/i })).toBeVisible({
    timeout: 15000,
  });
}

async function expectNoBodyScroll(page: Page) {
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
}

test.describe("Choose-photo mobile viewport fit", () => {
  test.use({ hasTouch: true });

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`staged modal flow fits without vertical page scroll (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.setViewportSize(viewport);
      await page.addInitScript(async () => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "999");
      });

      await openChoosePhoto(page);
      await expect(page.getByRole("button", { name: /nature/i })).toBeVisible();
      await expectNoBodyScroll(page);

      await page.getByRole("button", { name: /nature/i }).click();
      await expect(page.getByRole("dialog", { name: /choose puzzle/i })).toBeVisible();
      await expect(page.getByRole("listbox", { name: /choose a puzzle/i })).toBeVisible();
      await expectNoBodyScroll(page);

      await page
        .getByRole("option", { name: /select /i })
        .first()
        .click();
      await expect(page.getByRole("dialog", { name: /puzzle setup/i })).toBeVisible();
      await expect(page.getByRole("group", { name: /choose difficulty/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /start puzzle/i })).toBeVisible();
      await expectNoBodyScroll(page);
    });
  }

  test("iPhone SE layout stays fixed on choose-photo modal", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "999");
    });

    await openChoosePhoto(page);
    await expect(page.getByRole("button", { name: /nature/i })).toBeVisible();
    await expectNoBodyScroll(page);
  });
});
