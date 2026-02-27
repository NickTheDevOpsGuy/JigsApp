import { test, expect } from "@playwright/test";

test.describe("Today's Puzzle modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "14");
    });
  });

  test("opens and shows difficulty options", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/same puzzle for everyone/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /easy/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows all difficulty levels including Extreme 9×9", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/same puzzle for everyone/i)).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: /more options/i }).click();
    await expect(page.getByRole("button", { name: /legend/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: /master/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /extreme/i })).toBeVisible();
    await expect(page.getByText(/9×9/)).toBeVisible();
  });

  test("starts puzzle when difficulty selected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/same puzzle for everyone/i)).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: /easy/i }).click();
    await page.getByRole("button", { name: /start puzzle/i }).click();

    await expect(page).toHaveURL(/\/play/, { timeout: 10000 });
    await expect(
      page.getByRole("status", { name: /pieces remaining/i }).first(),
    ).toBeVisible({
      timeout: 10000,
    });
  });
});
