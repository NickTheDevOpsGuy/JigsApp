import { describe, expect, it } from "vitest";
import {
  buildNextGoal,
  getChallengeHudLabel,
  parseChallengeTarget,
} from "@/screens/Play/core/retention/playRetention";

describe("playRetention", () => {
  it("parses challenge target params", () => {
    const params = new URLSearchParams("ct=42&cm=17");
    expect(parseChallengeTarget(params)).toEqual({
      elapsedSeconds: 42,
      moveCount: 17,
    });
  });

  it("ignores invalid challenge params", () => {
    expect(parseChallengeTarget(new URLSearchParams("ct=0&cm=17"))).toBeNull();
    expect(parseChallengeTarget(new URLSearchParams("cm=17"))).toBeNull();
  });

  it("builds compact challenge HUD labels", () => {
    expect(getChallengeHudLabel({ elapsedSeconds: 72, moveCount: 18 })).toBe(
      "Beat 1:12 / 18 moves",
    );
    expect(getChallengeHudLabel({ elapsedSeconds: 72, moveCount: null })).toBe(
      "Beat 1:12",
    );
  });

  it("prioritizes a won challenge goal", () => {
    const goal = buildNextGoal({
      isDaily: false,
      isPackPuzzle: false,
      dailyStreak: 0,
      puzzlesCompleted: 4,
      pieceCount: 9,
      elapsedSeconds: 30,
      moveCount: 12,
      challengeTarget: { elapsedSeconds: 42, moveCount: 13 },
    });
    expect(goal.eyebrow).toBe("Challenge won");
    expect(goal.tone).toBe("win");
  });

  it("returns daily streak goals when not challenged", () => {
    const goal = buildNextGoal({
      isDaily: true,
      isPackPuzzle: false,
      dailyStreak: 2,
      puzzlesCompleted: null,
      pieceCount: 9,
      elapsedSeconds: 30,
      moveCount: 12,
    });
    expect(goal.title).toContain("3-day streak");
    expect(goal.tone).toBe("daily");
  });
});
