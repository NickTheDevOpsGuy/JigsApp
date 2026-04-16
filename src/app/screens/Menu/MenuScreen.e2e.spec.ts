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
});
