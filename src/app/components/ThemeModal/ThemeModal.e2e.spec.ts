import { test, expect } from "@playwright/test";

// Minimal 1x1 PNG for PlayScreen to load
const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Theme", () => {
  test("opens theme modal from settings and switches theme", async ({ page }) => {
    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.setItem("phuzzle:lastSeenChangelog", "999");
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
        localStorage.setItem("phuzzle-theme", "light");
      },
      { img: TINY_IMAGE, grid: "3x3" },
    );

    await page.goto("/play");

    await expect(page.getByRole("button", { name: /open menu/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("menuitem", { name: /^settings$/i }).click();
    await page.getByRole("menuitem", { name: /appearance|display/i }).click();
    await page.getByTestId("open-theme-modal").click();

    const dialog = page.getByRole("dialog", { name: /theme.*sounds/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText(/theme/i);

    await dialog.getByRole("button", { name: /^dark/i }).click();

    await expect(page.locator("html")).toHaveClass(/theme-dark/);
  });
});
