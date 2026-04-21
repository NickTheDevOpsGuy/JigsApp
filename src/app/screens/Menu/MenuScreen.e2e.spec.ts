import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

test.describe("Home / Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "25");
    });
  });

  test("loads the app and shows the menu", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByText("Phuzzle")).toBeVisible();
  });

  test("shows main action buttons", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(
      page.getByRole("button", { name: /play today'?s puzzle/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /quick play/i })).toBeVisible();
  });

  test("header stats button opens stats route", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("button", { name: /play today'?s puzzle/i })).toBeVisible(
      {
        timeout: 15000,
      },
    );
    const statsBtn = page.getByRole("button", { name: /view stats/i });
    await expect(statsBtn).toBeVisible({ timeout: 10000 });

    await statsBtn.click();
    await expect(page).toHaveURL(/\/stats/, { timeout: 15000 });
  });

  test("feedback button opens feedback modal", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("button", { name: /play today'?s puzzle/i })).toBeVisible(
      {
        timeout: 15000,
      },
    );
    await page.getByRole("button", { name: /feedback/i }).click();
    await expect(page.getByRole("dialog", { name: /feedback/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: /report a bug/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /suggest a feature/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("what's new button opens the changelog modal from the header", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await expect(page.getByRole("button", { name: /play today'?s puzzle/i })).toBeVisible(
      {
        timeout: 15000,
      },
    );

    await page.getByRole("button", { name: /what's new/i }).click();
    await expect(page.getByRole("dialog", { name: /what's new/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByText(/stats and leaderboard screens scale better/i),
    ).toBeVisible();
  });

  test("tablet home uses a roomy shell instead of a phone-width widget", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 744, height: 1133 });
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);

    const shell = page.getByTestId("menu-shell");
    await expect(shell).toBeVisible();

    const metrics = await shell.boundingBox();
    expect(metrics).not.toBeNull();
    expect(metrics?.width ?? 0).toBeGreaterThan(600);

    const docMetrics = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        scrollHeight: scroller.scrollHeight,
        clientHeight: scroller.clientHeight,
      };
    });

    expect(docMetrics.scrollHeight - docMetrics.clientHeight).toBeLessThanOrEqual(2);
  });

  test("desktop home uses a wide split layout without falling back to a phone shell", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);

    const shell = page.getByTestId("menu-shell");
    await expect(shell).toBeVisible();

    const metrics = await shell.boundingBox();
    expect(metrics).not.toBeNull();
    expect(metrics?.width ?? 0).toBeGreaterThan(1000);

    const docMetrics = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      return {
        scrollWidth: scroller.scrollWidth,
        clientWidth: scroller.clientWidth,
        scrollHeight: scroller.scrollHeight,
        clientHeight: scroller.clientHeight,
      };
    });

    expect(docMetrics.scrollWidth - docMetrics.clientWidth).toBeLessThanOrEqual(1);
    expect(docMetrics.scrollHeight - docMetrics.clientHeight).toBeLessThanOrEqual(2);
  });
});
