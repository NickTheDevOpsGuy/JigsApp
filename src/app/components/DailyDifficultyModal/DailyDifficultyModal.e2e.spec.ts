import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "../../test/e2e/helpers";

test.describe("Today's Puzzle modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "25");
    });
  });

  test("opens and shows difficulty options", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/same puzzle for everyone/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: /easy/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows all difficulty levels including Extreme", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/same puzzle for everyone/i)).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("button", { name: /more options/i }).click();
    await expect(page.getByRole("button", { name: /legend/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /master/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /extreme/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /extreme - 81 pieces/i }),
    ).toBeVisible();
  });

  test("starts puzzle when difficulty selected", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/same puzzle for everyone/i)).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("button", { name: /easy/i }).click();
    await page.getByRole("button", { name: /start puzzle/i }).click();

    await expect(page).toHaveURL(/\/play/, { timeout: 15000 });
    await expect(
      page.getByRole("status", { name: /pieces placed/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
