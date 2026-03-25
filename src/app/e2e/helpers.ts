import type { Page } from "@playwright/test";

/**
 * Dismiss the What's New (changelog) modal if it is open.
 * Call after page.goto("/") so menu interactions aren't blocked.
 * Resilient to changelog version bumps and browser timing differences.
 */
export async function dismissWhatsNewModalIfOpen(page: Page): Promise<void> {
  // Prevent future auto-open in this page context.
  await page.evaluate(() => {
    localStorage.setItem("phuzzle:lastSeenChangelog", "999");
  });

  const dialog = page
    .locator('[role="dialog"]')
    .filter({ hasText: "What's New" })
    .first();

  try {
    await dialog.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    // Modal didn't appear, nothing to close.
    return;
  }

  const closeByCta = dialog
    .getByRole("button", { name: /got it|start puzzling/i })
    .first();
  const closeByX = dialog.getByRole("button", { name: /^close$/i }).first();

  if (await closeByCta.isVisible({ timeout: 500 })) {
    await closeByCta.click();
  } else if (await closeByX.isVisible({ timeout: 500 })) {
    await closeByX.click();
  } else {
    await page.locator('[aria-label="Close modal"]').first().click();
  }

  await dialog.waitFor({ state: "hidden", timeout: 5000 });
}
