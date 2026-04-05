/**
 * @vitest-environment happy-dom
 */
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

  it("falls back to window inner size when visualViewport reports an unusable size", () => {
    const originalVisualViewport = window.visualViewport;
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        width: 0,
        height: 0,
      },
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 720,
    });

    const { width, height } = getLayoutViewportSize();

    expect(width).toBe(1280);
    expect(height).toBe(720);

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it("getSafeAreaInsetsHorizontal returns finite numbers", () => {
    const { left, right } = getSafeAreaInsetsHorizontal();
    expect(Number.isFinite(left)).toBe(true);
    expect(Number.isFinite(right)).toBe(true);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeGreaterThanOrEqual(0);
  });
});
