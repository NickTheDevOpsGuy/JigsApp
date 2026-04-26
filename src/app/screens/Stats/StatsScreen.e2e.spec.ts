import { test, expect } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

test.describe("Packs and Stats", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(async () => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "25");
    });
  });

  test("Packs list loads and shows packs", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /puzzle packs/i }).click();

    const dialog = page.getByRole("dialog", { name: /choose pack/i });
    await expect(dialog).toBeVisible({
      timeout: 15000,
    });
    await expect(dialog.getByRole("listbox", { name: /choose a pack/i })).toBeVisible();
    await expect(
      dialog.getByRole("option", { name: /nature, .* puzzles/i }),
    ).toBeVisible();
  });

  test("Stats screen loads", async ({ page }) => {
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(
      page
        .getByRole("button", { name: /back/i })
        .or(page.getByRole("button", { name: /close/i }))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Stats screen fits on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(
      page
        .getByRole("button", { name: /back/i })
        .or(page.getByRole("button", { name: /close/i }))
        .first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("stats-card-content")).toBeVisible({ timeout: 10000 });
    // With Supabase: tabs (Profile, Board, Badges). Without: Connect Supabase message.
    await expect(
      page.getByRole("tab", { name: /profile/i }).or(page.getByText(/connect supabase/i)),
    ).toBeVisible({ timeout: 5000 });
  });

  test("Stats screen stays usable on tablet portrait", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(
      page
        .getByRole("button", { name: /back/i })
        .or(page.getByRole("button", { name: /close/i }))
        .first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("stats-card-content")).toBeVisible({ timeout: 10000 });
  });

  test("Stats screen stays readable on landscape phone", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/stats");

    await expect(page).toHaveURL(/\/stats/);
    await expect(
      page
        .getByRole("button", { name: /back/i })
        .or(page.getByRole("button", { name: /close/i }))
        .first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("stats-card-content")).toBeVisible({ timeout: 10000 });
  });

  test("Stats dense mobile sections stay horizontal and inside the viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/stats?tab=achievements");

    const connectMessage = page.getByText(/connect supabase/i);
    const badgesTab = page.getByRole("tab", { name: /badges/i });
    await expect(badgesTab.or(connectMessage).first()).toBeVisible({ timeout: 10000 });
    if (await connectMessage.isVisible()) {
      test.skip(true, "Supabase is not configured in this environment");
    }

    await badgesTab.click();

    const badgeRail = page.locator('[class*="achievements"]').first();
    await expect(badgeRail).toBeVisible({ timeout: 10000 });
    const badgeRailLayout = await badgeRail.evaluate((node) => {
      const el = node as HTMLElement;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        flexDirection: style.flexDirection,
        overflowX: style.overflowX,
        right: rect.right,
        viewportWidth: window.innerWidth,
      };
    });
    expect(badgeRailLayout.flexDirection).toBe("row");
    expect(["auto", "scroll", "hidden"]).toContain(badgeRailLayout.overflowX);
    expect(badgeRailLayout.right).toBeLessThanOrEqual(
      badgeRailLayout.viewportWidth + 1,
    );

    await page.getByRole("tab", { name: /board leaderboard/i }).click();
    const boardModeRail = page.locator('[class*="boardModeSwitch"]').first();
    await expect(boardModeRail).toBeVisible({ timeout: 10000 });
    const boardModeLayout = await boardModeRail.evaluate((node) => {
      const el = node as HTMLElement;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        flexWrap: style.flexWrap,
        overflowX: style.overflowX,
        right: rect.right,
        viewportWidth: window.innerWidth,
      };
    });
    expect(boardModeLayout.flexWrap).toBe("nowrap");
    expect(["auto", "scroll", "hidden"]).toContain(boardModeLayout.overflowX);
    expect(boardModeLayout.right).toBeLessThanOrEqual(
      boardModeLayout.viewportWidth + 1,
    );
  });
});
