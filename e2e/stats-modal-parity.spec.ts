import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const { documentElement } = document;
    return documentElement.scrollWidth > documentElement.clientWidth + 1;
  });
  expect(hasOverflow).toBe(false);
}

async function isSupabaseFallback(page: Page) {
  return page.getByText(/connect supabase to track your stats/i).isVisible();
}

async function openStats(page: Page) {
  await page.goto("/stats");
  await expect(page).toHaveURL(/\/stats/);
  await expect(page.getByTestId("stats-card-content")).toBeVisible({ timeout: 10000 });
}

async function assertConfiguredStatsFlow(page: Page) {
  await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /board/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /badges/i })).toBeVisible();

  await page.getByRole("tab", { name: /profile/i }).click();
  await expect(page.getByText("Player")).toBeVisible();
  await expect(page.getByText("Stats")).toBeVisible();
  await expect(page.getByText("Daily Mastery")).toBeVisible();

  const settingsToggle = page.getByRole("button", { name: /account settings/i });
  await settingsToggle.click();
  await expect(page.getByLabelText(/display name/i)).toBeVisible();
  await expect(page.getByLabelText(/show my name on leaderboards/i)).toBeVisible();

  await page.getByRole("tab", { name: /board/i }).click();
  await expect(page.getByText("Competition")).toBeVisible();
  await expect(page.getByRole("button", { name: /filters/i })).toBeVisible();
  await expect(page.getByText("Sort")).toBeVisible();

  const filtersButton = page.getByRole("button", { name: /filters/i });
  await filtersButton.click();
  await expect(page.getByLabelText(/filter by shape/i)).toBeVisible();
  await expect(page.getByLabelText(/filter by modifier/i)).toBeVisible();
  await expect(page.getByLabelText(/filter by source/i)).toBeVisible();

  await page.getByRole("tab", { name: /badges/i }).click();
  await expect(page.getByRole("heading", { name: /badges/i })).toBeVisible();
}

async function assertFallbackFlow(page: Page) {
  await expect(page.getByText(/connect supabase to track your stats/i)).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: /back/i })
      .or(page.getByRole("button", { name: /close/i }))
      .first(),
  ).toBeVisible();
}

async function expectVisibleHeight(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    page.viewportSize()!.height + 1,
  );
}

test.describe("Stats modal parity", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "999");
    });
  });

  test("desktop stats modal keeps major controls visible and usable", async ({
    page,
  }) => {
    await openStats(page);

    if (await isSupabaseFallback(page)) {
      await assertFallbackFlow(page);
      await expectNoHorizontalOverflow(page);
      return;
    }

    await assertConfiguredStatsFlow(page);
    await expectVisibleHeight(
      page,
      page
        .getByRole("button", { name: /close/i })
        .or(page.getByRole("button", { name: /back/i }))
        .first(),
    );
    await expectNoHorizontalOverflow(page);
  });

  test("mobile stats modal stays compact without clipping controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openStats(page);

    const closeButton = page
      .getByRole("button", { name: /close/i })
      .or(page.getByRole("button", { name: /back/i }))
      .first();
    await expectVisibleHeight(page, closeButton);

    if (await isSupabaseFallback(page)) {
      await assertFallbackFlow(page);
      await expectNoHorizontalOverflow(page);
      return;
    }

    await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();
    await page.getByRole("tab", { name: /board/i }).click();
    await expect(page.getByRole("button", { name: /filters/i })).toBeVisible();
    await expectVisibleHeight(page, page.getByRole("button", { name: /filters/i }));

    await page.getByRole("button", { name: /filters/i }).click();
    await expect(page.getByLabelText(/filter by shape/i)).toBeVisible();
    await expect(page.getByLabelText(/filter by modifier/i)).toBeVisible();
    await expect(page.getByLabelText(/filter by source/i)).toBeVisible();

    await page.getByRole("tab", { name: /profile/i }).click();
    await page.getByRole("button", { name: /account settings/i }).click();
    await expect(page.getByLabelText(/display name/i)).toBeVisible();

    await page.getByRole("tab", { name: /badges/i }).click();
    await expect(page.getByRole("heading", { name: /badges/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
