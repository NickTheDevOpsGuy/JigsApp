import type { Page } from "@playwright/test";

/**
 * Dismiss the What's New (changelog) modal if it is open.
 * Call after page.goto("/") so menu interactions aren't blocked.
 * Resilient to changelog version bumps and browser timing differences.
 */
export async function dismissWhatsNewModalIfOpen(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /what's new/i });
  try {
    await dialog.waitFor({ state: "visible", timeout: 2000 });
    await page.getByRole("button", { name: /got it/i }).click();
    await dialog.waitFor({ state: "hidden", timeout: 5000 });
  } catch {
    // Modal didn't appear or already closed, nothing to do
  }
}
