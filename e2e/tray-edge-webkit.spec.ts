import { test, expect } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Tray edge clamp (WebKit)", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "999");
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
      },
      { img: TINY_IMAGE, grid: "4x4" },
    );
  });

  test("tray hard-stops at both edges without runout", async ({ page, browserName }) => {
    await page.goto("/play");
    const scroller = page.getByRole("list");

    await expect(scroller).toBeVisible({ timeout: 15000 });

    const right = await scroller.evaluate((node) => {
      const el = node as HTMLDivElement;
      const style = getComputedStyle(el);
      const paddingStart = 12;
      const paddingEnd = 12;
      const row = el.firstElementChild as HTMLElement | null;
      const contentWidth =
        row && row.offsetWidth > 0
          ? paddingStart + row.offsetWidth + paddingEnd
          : el.scrollWidth;
      const max = Math.max(0, contentWidth - el.clientWidth);
      el.scrollLeft = max;
      el.scrollBy({ left: 2000 });
      return {
        overscrollX: style.overscrollBehaviorX,
        max,
        after: el.scrollLeft,
      };
    });

    expect(right.max).toBeGreaterThan(0);
    if (browserName === "webkit") {
      expect(right.overscrollX).toBe("none");
    }
    expect(right.after).toBeLessThanOrEqual(right.max + 1);

    const left = await scroller.evaluate((node) => {
      const el = node as HTMLDivElement;
      el.scrollLeft = 0;
      el.scrollBy({ left: -2000 });
      return el.scrollLeft;
    });

    expect(left).toBeGreaterThanOrEqual(0);
  });
});
