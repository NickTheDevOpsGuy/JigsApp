import { describe, it, expect } from "vitest";
import { validateImageForGrid } from "../useImagePicker";

describe("validateImageForGrid", () => {
  it("returns error on invalid or unloadable data URL", async () => {
    const result = await validateImageForGrid("not-an-image", 3, 3);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe("string");
    }
  });
});
