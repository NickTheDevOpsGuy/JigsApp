import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "./helpers";

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 740 },
] as const;

const IMAGE_SOURCE_TABS = [/gallery/i, /upload/i, /camera/i] as const;

async function gotoSetup(page: import("@playwright/test").Page) {
  await page.goto("/new", { waitUntil: "domcontentloaded", timeout: 45000 });
  await expect(page.getByRole("tab", { name: /gallery/i })).toBeVisible({
    timeout: 15000,
  });
}

test.describe("Setup mobile viewport fit", () => {
  test.use({ hasTouch: true });

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`all setup tabs fit without vertical page scroll (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.setViewportSize(viewport);
      await page.addInitScript(async () => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "999");
      });

      await gotoSetup(page);
      await dismissWhatsNewModalIfOpen(page);

      for (const tab of IMAGE_SOURCE_TABS) {
        await page.getByRole("tab", { name: tab }).click();
        await expect(page.getByRole("tab", { name: tab })).toHaveAttribute(
          "aria-selected",
          "true",
        );

        if (tab === IMAGE_SOURCE_TABS[0]) {
          await expect(page.getByTestId("gallery-item").first()).toBeVisible();
        } else if (tab === IMAGE_SOURCE_TABS[1]) {
          await expect(
            page.getByLabel(/choose a photo \(png, jpg, or webp\)/i),
          ).toBeVisible();
        } else {
          await expect(page.getByRole("button", { name: /start camera/i })).toBeVisible();
        }

        const metricsBefore = await page.evaluate(() => {
          const scroller = document.scrollingElement ?? document.documentElement;
          return {
            clientHeight: scroller.clientHeight,
            scrollHeight: scroller.scrollHeight,
            scrollY: window.scrollY,
          };
        });

        await page.evaluate(() => window.scrollTo(0, 9999));

        const metricsAfter = await page.evaluate(() => {
          const scroller = document.scrollingElement ?? document.documentElement;
          return {
            clientHeight: scroller.clientHeight,
            scrollHeight: scroller.scrollHeight,
            scrollY: window.scrollY,
          };
        });

        expect(
          metricsBefore.scrollHeight - metricsBefore.clientHeight,
        ).toBeLessThanOrEqual(2);
        expect(metricsAfter.scrollY).toBe(0);
      }
    });
  }

  test("setup page stays fixed without body scroll on iPhone SE", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "999");
    });

    await gotoSetup(page);
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("tab", { name: /gallery/i })).toBeVisible();

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
  });
});
