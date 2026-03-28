import { describe, expect, it } from "vitest";
import { getCategorySpotlight, CATEGORY_ORDER } from "@/data/packs/categoryDisplay";

describe("categoryDisplay", () => {
  it("uses the same emoji for every known category id", () => {
    for (const id of CATEGORY_ORDER) {
      const { name, emoji } = getCategorySpotlight(id);
      expect(name.length).toBeGreaterThan(0);
      expect(emoji.length).toBeGreaterThan(0);
    }
  });

  it("falls back for unknown ids", () => {
    const u = getCategorySpotlight("custom-folder");
    expect(u.name).toBe("Custom Folder");
    expect(u.emoji).toBe("🧩");
  });
});
