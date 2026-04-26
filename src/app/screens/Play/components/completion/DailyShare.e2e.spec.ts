import { expect, test } from "@playwright/test";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const COMPLETE_HEADING = /^complete$/i;
const DAILY_SHARE_MENU_ITEM = /daily share/i;

test.describe("Daily Share", () => {
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

        let copiedText = "";
        Object.defineProperty(window, "__dailyShareCopiedText", {
          configurable: true,
          get() {
            return copiedText;
          },
        });

        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              copiedText = text;
            },
          },
        });

        Object.defineProperty(navigator, "share", {
          configurable: true,
          value: async () => {
            throw new Error("share-unavailable-in-test");
          },
        });
      },
      { img: TINY_IMAGE, grid: "3x3" },
    );
  });

  test("daily completion exposes Daily Share and copies the daily summary", async ({
    page,
  }) => {
    await page.goto("/play?e2eCompletion=1");

    await expect(page.getByRole("heading", { name: COMPLETE_HEADING })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText(/Phuzzle #/i)).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /share daily result|copy daily result/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /options/i }).click();
    const dailyShare = page.getByRole("menuitem", { name: DAILY_SHARE_MENU_ITEM });
    await expect(dailyShare).toBeVisible();
    await dailyShare.click();

    const copiedText = await page.evaluate(
      () =>
        (window as Window & { __dailyShareCopiedText?: string }).__dailyShareCopiedText,
    );

    expect(copiedText).toContain("Phuzzle Daily #");
    expect(copiedText).toContain("Play:");
  });
});
