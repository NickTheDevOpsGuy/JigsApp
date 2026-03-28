import { describe, it, expect } from "vitest";
import {
  getLayoutViewportSize,
  getSafeAreaInsetsHorizontal,
} from "@/utils/layoutViewport";

describe("layoutViewport", () => {
  it("getLayoutViewportSize returns non-negative dimensions in browser env", () => {
    const { width, height } = getLayoutViewportSize();
    expect(width).toBeGreaterThanOrEqual(0);
    expect(height).toBeGreaterThanOrEqual(0);
  });

  it("getSafeAreaInsetsHorizontal returns finite numbers", () => {
    const { left, right } = getSafeAreaInsetsHorizontal();
    expect(Number.isFinite(left)).toBe(true);
    expect(Number.isFinite(right)).toBe(true);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeGreaterThanOrEqual(0);
  });
});
