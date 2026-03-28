import { describe, expect, it } from "vitest";
import { dailyStreakXpMultiplier } from "@/services/player/dailyStreakXp";

describe("dailyStreakXpMultiplier", () => {
  it("is 1× for first day or missing streak", () => {
    expect(dailyStreakXpMultiplier(0)).toBe(1);
    expect(dailyStreakXpMultiplier(1)).toBe(1);
  });

  it("adds 6% per extra consecutive day", () => {
    expect(dailyStreakXpMultiplier(2)).toBe(1.06);
    expect(dailyStreakXpMultiplier(3)).toBe(1.12);
    expect(dailyStreakXpMultiplier(7)).toBeCloseTo(1.36, 5);
  });

  it("caps at 2×", () => {
    expect(dailyStreakXpMultiplier(18)).toBe(2);
    expect(dailyStreakXpMultiplier(100)).toBe(2);
  });
});
