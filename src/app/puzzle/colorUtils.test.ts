import { describe, it, expect } from "vitest";
import {
  areColorsSimilar,
  rgbToCss,
  HUE_SIMILARITY_TOLERANCE,
  type ColorInfo,
} from "./colorUtils";

function makeColor(overrides: Partial<ColorInfo>): ColorInfo {
  return {
    r: 128,
    g: 128,
    b: 128,
    hue: 0,
    saturation: 0.5,
    lightness: 0.5,
    ...overrides,
  };
}

describe("areColorsSimilar", () => {
  it("returns true for identical colors", () => {
    const c = makeColor({ hue: 120 });
    expect(areColorsSimilar(c, c)).toBe(true);
  });

  it("returns true when hue distance is within tolerance", () => {
    const a = makeColor({ hue: 100 });
    const b = makeColor({ hue: 100 + HUE_SIMILARITY_TOLERANCE - 5 });
    expect(areColorsSimilar(a, b)).toBe(true);
  });

  it("returns false when hue distance exceeds tolerance", () => {
    const a = makeColor({ hue: 0 });
    const b = makeColor({ hue: 90 });
    expect(areColorsSimilar(a, b)).toBe(false);
  });

  it("wraps hue around 360° (red region)", () => {
    const a = makeColor({ hue: 10 });
    const b = makeColor({ hue: 350 });
    // 20° apart going the short way
    expect(areColorsSimilar(a, b)).toBe(true);
  });

  it("accepts low-saturation colors within relaxed hue range", () => {
    const a = makeColor({ hue: 0, saturation: 0.05 });
    const b = makeColor({ hue: HUE_SIMILARITY_TOLERANCE, saturation: 0.05 });
    expect(areColorsSimilar(a, b)).toBe(true);
  });
});

describe("rgbToCss", () => {
  it("returns valid rgb() string", () => {
    expect(rgbToCss(255, 0, 128)).toBe("rgb(255, 0, 128)");
    expect(rgbToCss(0, 0, 0)).toBe("rgb(0, 0, 0)");
  });
});
