import { expect, test } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

test.describe("Routes, feedback, and pack deep links", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "999");
    });
  });

  test("/new redirects to home", async ({ page }) => {
    await page.goto("/new");
    await dismissWhatsNewModalIfOpen(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /quick play/i })).toBeVisible();
  });

  test("unknown routes redirect to home", async ({ page }) => {
    await page.goto("/definitely-not-a-real-route");
    await dismissWhatsNewModalIfOpen(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("button", { name: /play today'?s puzzle/i }),
    ).toBeVisible();
  });

  test("home feedback modal exposes bug and feature actions", async ({ page }) => {
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);

    await page.getByTestId("menu-feedback-action").click();

    const dialog = page.getByRole("dialog", { name: /feedback/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /report a bug/i })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /suggest a feature/i }),
    ).toBeVisible();
  });

  test("pack detail deep link loads and can launch play", async ({ page }) => {
    await page.goto("/packs/nature");

    await expect(page.getByRole("button", { name: /back to packs/i })).toBeVisible();
    await expect(page.getByText("Nature")).toBeVisible();
    await expect(page.getByRole("list", { name: /puzzle list/i })).toBeVisible();

    await page
      .getByRole("button", { name: /solve /i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/play$/);
    await expect(
      page.getByRole("status", { name: /pieces placed/i }).first(),
    ).toBeVisible();
  });

  test("unknown pack detail shows not found state", async ({ page }) => {
    await page.goto("/packs/not-a-real-pack");

    await expect(page.getByText(/pack not found/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /back to packs/i })).toBeVisible();
  });
});
