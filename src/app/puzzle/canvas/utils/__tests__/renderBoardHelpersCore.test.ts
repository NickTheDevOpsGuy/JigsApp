/**
 * Snap glow and pop scale helpers – regression tests for satisfaction tuning.
 */
import { describe, it, expect } from "vitest";
import { snapGlowAlpha, snapPopScale } from "../renderBoardHelpersCore";

describe("snapGlowAlpha", () => {
  it("returns 0 for elapsed <= 0 or >= SNAP_GLOW_MS (260)", () => {
    expect(snapGlowAlpha(-1)).toBe(0);
    expect(snapGlowAlpha(0)).toBe(0);
    expect(snapGlowAlpha(260)).toBe(0);
    expect(snapGlowAlpha(300)).toBe(0);
  });

  it("returns positive alpha at start and decreases over time", () => {
    const atStart = snapGlowAlpha(1);
    const mid = snapGlowAlpha(130);
    const nearEnd = snapGlowAlpha(250);
    expect(atStart).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(0);
    expect(nearEnd).toBeGreaterThan(0);
    expect(atStart).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(nearEnd);
  });
});

describe("snapPopScale", () => {
  it("returns 1 for t <= 0 or t >= 150", () => {
    expect(snapPopScale(-1)).toBe(1);
    expect(snapPopScale(0)).toBe(1);
    expect(snapPopScale(150)).toBe(1);
    expect(snapPopScale(200)).toBe(1);
  });

  it("returns peak scale (1.14) during pop then settles toward 1", () => {
    const peak = snapPopScale(25);
    const settling = snapPopScale(100);
    expect(peak).toBeGreaterThanOrEqual(1.1);
    expect(peak).toBeLessThanOrEqual(1.2);
    expect(settling).toBeGreaterThanOrEqual(1);
    expect(settling).toBeLessThanOrEqual(1.15);
  });
});
