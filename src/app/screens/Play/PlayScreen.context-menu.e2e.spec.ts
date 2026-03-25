import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const ROUTES = ["/", "/play"] as const;

test.describe("Mobile context menu guard", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "999");
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
      },
      { img: TINY_IMAGE, grid: "3x3" },
    );
  });

  for (const route of ROUTES) {
    test(`suppresses long-press context menu on ${route}`, async ({ page }) => {
      await page.goto(route);
      await dismissWhatsNewModalIfOpen(page);

      if (route === "/play") {
        await expect(
          page.getByRole("status", { name: /pieces placed/i }).first(),
        ).toBeVisible({
          timeout: 15000,
        });
      } else {
        await expect(page.getByRole("button", { name: /today's puzzle/i })).toBeVisible({
          timeout: 15000,
        });
      }

      const probe = await page.evaluate(() => {
        const target =
          (document.querySelector("main") as HTMLElement | null) ?? document.body;
        const event = new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          button: 2,
        });
        const dispatchResult = target.dispatchEvent(event);
        return {
          defaultPrevented: event.defaultPrevented,
          dispatchResult,
        };
      });

      expect(probe.defaultPrevented).toBe(true);
      expect(probe.dispatchResult).toBe(false);
    });
  }

  test("does not block context menu on text inputs", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("button", { name: /quick play/i })).toBeVisible({
      timeout: 15000,
    });

    const probe = await page.evaluate(() => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = "allow-context-menu";
      document.body.appendChild(input);
      input.focus();

      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
      });
      const dispatchResult = input.dispatchEvent(event);
      input.remove();

      return {
        defaultPrevented: event.defaultPrevented,
        dispatchResult,
      };
    });

    expect(probe.defaultPrevented).toBe(false);
    expect(probe.dispatchResult).toBe(true);
  });
});
