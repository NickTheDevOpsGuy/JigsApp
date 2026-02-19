import { test, expect } from "@playwright/test";
import { CHANGELOG_VERSION } from "../src/app/data/changelog";

test.describe("Home / Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (version) => {
        localStorage.setItem("phuzzle:lastSeenChangelog", version);
      },
      CHANGELOG_VERSION,
    );
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
