import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

test.describe("Setup → Play flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "25");
    });
  });

  test("opens quick-play modal and shows category step", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /quick play/i }).click();

    const dialog = page.getByRole("dialog", { name: /choose category/i });
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByRole("button", { name: /nature/i })).toBeVisible();
    await expect(
      dialog.getByLabel(/use your own photo: upload an image from your device/i),
    ).toBeVisible();
  });

  test("selects gallery puzzle and starts game", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /quick play/i }).click();

    const dialog = page.getByRole("dialog", { name: /choose category/i });
    await dialog.getByRole("button", { name: /nature/i }).click();
    await expect(page.getByRole("dialog", { name: /choose puzzle/i })).toBeVisible();

    await page
      .getByRole("option", { name: /select /i })
      .first()
      .click();
    await expect(page.getByRole("dialog", { name: /puzzle setup/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /start puzzle/i })).toBeEnabled();
    await page.getByRole("button", { name: /start puzzle/i }).click();

    await expect(page).toHaveURL(/\/play/);
    await expect(
      page.getByRole("status", { name: /pieces placed/i }).first(),
    ).toBeVisible();
  });

  test("setup supports advanced difficulties in the staged modal flow", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /today's puzzle/i }).click();
    await expect(page.getByRole("dialog", { name: /today's puzzle/i })).toBeVisible();
    await page.getByRole("button", { name: /more options/i }).click();
    await expect(
      page.getByRole("button", { name: /extreme - 81 pieces/i }),
    ).toBeVisible();
  });
});
