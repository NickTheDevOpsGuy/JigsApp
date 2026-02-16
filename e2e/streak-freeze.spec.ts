import { test, expect } from "@playwright/test";

test.describe("Streak freeze offer", () => {
  test("shows streak freeze offer when yesterday was missed and freeze available", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "4");
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().slice(0, 10);
      const weekKey = String(Math.floor(Date.now() / 604800000));
      localStorage.setItem("phuzzle:streakFreeze", "1");
      localStorage.setItem("phuzzle:streakFreezeWeek", weekKey);
      localStorage.removeItem(`phuzzle:daily:${yesterday}:completed`);
      localStorage.removeItem(`phuzzle:streakFreeze:used:${yesterday}`);
    });

    await page.goto("/");
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    await expect(page.getByText(/you missed yesterday/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /use freeze/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /no thanks/i })).toBeVisible();
  });

  test("hides offer after clicking No thanks and reopening", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "4");
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().slice(0, 10);
      const weekKey = String(Math.floor(Date.now() / 604800000));
      localStorage.setItem("phuzzle:streakFreeze", "1");
      localStorage.setItem("phuzzle:streakFreezeWeek", weekKey);
      localStorage.removeItem(`phuzzle:daily:${yesterday}:completed`);
      localStorage.removeItem(`phuzzle:streakFreeze:used:${yesterday}`);
      localStorage.removeItem(`phuzzle:streakFreezeDismissed:${new Date().toISOString().slice(0, 10)}`);
    });

    await page.goto("/");
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    await expect(page.getByText(/you missed yesterday/i)).toBeVisible();
    await page.getByRole("button", { name: /no thanks/i }).click();

    await page.getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: /today's puzzle/i }).click();

    await expect(page.getByText(/you missed yesterday/i)).not.toBeVisible();
  });
});
