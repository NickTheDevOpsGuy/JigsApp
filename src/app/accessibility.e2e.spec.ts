/**
 * Focused accessibility smoke for pre-push (precheck step 6).
 * Titles include "accessibility" so step 7 can --grep-invert them.
 */
import { expect, test } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

const TINY_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("accessibility audit (WCAG smoke)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "999");
    });
  });

  test("home has no critical or serious automated a11y violations (WCAG 2 A)", async ({
    page,
  }) => {
    let AxeBuilder: typeof import("@axe-core/playwright").default;
    try {
      ({ default: AxeBuilder } = await import("@axe-core/playwright"));
    } catch {
      test.skip(true, "@axe-core/playwright is not installed in this environment");
      return;
    }

    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);

    const results = await new AxeBuilder({ page }).withTags(["wcag2a"]).analyze();
    const bad = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      bad,
      bad.length
        ? bad
            .map(
              (v) =>
                `[${v.id}] ${v.help} (${v.impact})\n${v.nodes
                  .slice(0, 3)
                  .map((n) => `  ${n.html}`)
                  .join("\n")}`,
            )
            .join("\n---\n")
        : "",
    ).toEqual([]);
  });

  test("choose puzzle modal has no critical or serious automated a11y violations", async ({
    page,
  }) => {
    let AxeBuilder: typeof import("@axe-core/playwright").default;
    try {
      ({ default: AxeBuilder } = await import("@axe-core/playwright"));
    } catch {
      test.skip(true, "@axe-core/playwright is not installed in this environment");
      return;
    }

    await page.goto("/");
    await dismissWhatsNewModalIfOpen(page);
    await page.getByRole("button", { name: /quick play/i }).click();
    await expect(page.getByRole("dialog", { name: /choose category/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a"])
      .analyze();
    const bad = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      bad,
      bad.length
        ? bad
            .map(
              (v) =>
                `[${v.id}] ${v.help} (${v.impact})\n${v.nodes
                  .slice(0, 3)
                  .map((n) => `  ${n.html}`)
                  .join("\n")}`,
            )
            .join("\n---\n")
        : "",
    ).toEqual([]);
  });

  test("play completion overlay has no critical or serious automated a11y violations", async ({
    page,
  }) => {
    let AxeBuilder: typeof import("@axe-core/playwright").default;
    try {
      ({ default: AxeBuilder } = await import("@axe-core/playwright"));
    } catch {
      test.skip(true, "@axe-core/playwright is not installed in this environment");
      return;
    }

    await page.addInitScript(
      async ({ img, grid }) => {
        localStorage.setItem("phuzzle:imageDataUrl", img);
        localStorage.setItem("phuzzle:gridSize", grid);
      },
      { img: TINY_IMAGE, grid: "3x3" },
    );

    await page.goto("/play?e2eCompletion=1");
    await expect(page.getByRole("heading", { name: /complete/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a"])
      .analyze();
    const bad = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      bad,
      bad.length
        ? bad
            .map(
              (v) =>
                `[${v.id}] ${v.help} (${v.impact})\n${v.nodes
                  .slice(0, 3)
                  .map((n) => `  ${n.html}`)
                  .join("\n")}`,
            )
            .join("\n---\n")
        : "",
    ).toEqual([]);
  });
});
