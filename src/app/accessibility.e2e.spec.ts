/**
 * Focused accessibility smoke for pre-push (precheck step 6).
 * Titles include "accessibility" so step 7 can --grep-invert them.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { dismissWhatsNewModalIfOpen } from "@/e2e/helpers";

test.describe("accessibility audit (WCAG smoke)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("phuzzle:lastSeenChangelog", "999");
    });
  });

  test("home has no critical or serious automated a11y violations (WCAG 2 A)", async ({
    page,
  }) => {
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
});
