/**
 * Snap glow and pop scale helpers – regression tests for satisfaction tuning.
 */
import { describe, it, expect } from "vitest";
import { snapGlowAlpha, snapPopScale } from "./renderBoardHelpersCore";

describe("snapGlowAlpha", () => {
  it("returns 0 for elapsed <= 0 or >= SNAP_GLOW_MS (120)", () => {
    expect(snapGlowAlpha(-1)).toBe(0);
    expect(snapGlowAlpha(0)).toBe(0);
    expect(snapGlowAlpha(120)).toBe(0);
    expect(snapGlowAlpha(250)).toBe(0);
  });

  it("returns positive alpha at start and decreases over time", () => {
    const atStart = snapGlowAlpha(1);
    const mid = snapGlowAlpha(50);
    const nearEnd = snapGlowAlpha(100);
    expect(atStart).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(0);
    expect(nearEnd).toBeGreaterThan(0);
    expect(atStart).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(nearEnd);
  });
});

describe("snapPopScale", () => {
  it("returns 1 for t <= 0 or after full settle (~140ms)", () => {
    expect(snapPopScale(-1)).toBe(1);
    expect(snapPopScale(0)).toBe(1);
    expect(snapPopScale(140)).toBe(1);
    expect(snapPopScale(200)).toBe(1);
  });

  it("returns a small peak (~1.03) then eases to 1 without overshoot", () => {
    const midRise = snapPopScale(22);
    const atPeak = snapPopScale(44);
    const settling = snapPopScale(95);
    expect(midRise).toBeGreaterThan(1.008);
    expect(midRise).toBeLessThan(atPeak);
    expect(atPeak).toBeCloseTo(1.028, 2);
    expect(settling).toBeGreaterThan(0.998);
    expect(settling).toBeLessThanOrEqual(atPeak);
    expect(settling).toBeGreaterThanOrEqual(1);
  });
});
