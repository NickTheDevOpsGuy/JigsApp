import { test, expect } from "@playwright/test";

test.describe("Home / Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "7");
    });
  });

  test("loads the app and shows the menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByAltText("Phuzzle logo")).toBeVisible();
  });

  test("shows main action buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /today's puzzle/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /choose photo/i })).toBeVisible();
  });
});
