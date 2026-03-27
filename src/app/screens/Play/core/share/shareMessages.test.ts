import { describe, it, expect } from "vitest";
import {
  absShareUrl,
  buildChallengePlayUrl,
  buildProgressShareMessage,
  buildChallengeShareMessage,
  buildDailyShareMessage,
  getDailyShareCompletionGrid,
  pickChallengeTaunt,
} from "@/screens/Play/core/share/shareMessages";

describe("shareMessages", () => {
  it("absShareUrl prefixes origin for paths", () => {
    expect(absShareUrl("/play?grid=4x4")).toBe(
      "https://phuzzle.vercel.app/play?grid=4x4",
    );
    expect(absShareUrl("https://phuzzle.app/x")).toBe("https://phuzzle.app/x");
  });

  it("buildProgressShareMessage matches preview card layout without challenge taunt", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 102,
      pieceCount: 9,
      accuracyPercent: 96,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
      moveCount: 25,
      puzzleName: "Sunset Beach",
    });

    expect(text).toContain("Phuzzle");
    expect(text).toContain("Easy");
    expect(text).toContain("9 pieces");
    expect(text).toContain("1:42");
    expect(text).toContain("Moves: 25");
    expect(text).not.toContain("Think you can beat me?");
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc");
  });

  it("buildProgressShareMessage absolutizes relative play URLs", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 60,
      pieceCount: 16,
      playUrl: "/play?grid=4x4",
      moveCount: 0,
    });
    expect(text).toContain("Medium");
    expect(text).toContain("16 pieces");
    expect(text).toContain("1:00");
    expect(text).toContain("https://phuzzle.vercel.app/play?grid=4x4");
  });

  it("buildChallengeShareMessage includes stats, rotations, and challenge line", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 102,
      pieceCount: 16,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
      moveCount: 42,
      rotationCount: 3,
      puzzleName: "Forest Path",
    });

    expect(text).toContain("16 pieces");
    expect(text).toContain("1:42");
    expect(text).toContain("Moves: 42");
    expect(text).toContain("Rotations: 3");
    expect(
      [
        "I destroyed this puzzle. Can you even come close?",
        "Puzzle demolished. Think you can top this?",
        "Another one down. Beat this run if you can.",
        "I crushed this one. Your turn to prove it.",
      ].some((line) => text.includes(line)),
    ).toBe(true);
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc&ct=102&cm=42");
  });

  it("buildChallengeShareMessage works with grid-only play URL", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 36,
      pieceCount: 9,
      playUrl: "/play?grid=3x3",
      moveCount: 19,
    });
    expect(text).toContain("Easy");
    expect(text).toContain("9 pieces");
    expect(text).toContain("https://phuzzle.vercel.app/play?grid=3x3&ct=36&cm=19");
  });

  it("pickChallengeTaunt chooses from the supported taunt set", () => {
    expect(pickChallengeTaunt(0)).toBe(
      "I destroyed this puzzle. Can you even come close?",
    );
    expect(pickChallengeTaunt(0.99)).toBe("I crushed this one. Your turn to prove it.");
  });

  it("buildChallengePlayUrl preserves existing puzzle params and rewrites challenge stats", () => {
    const url = buildChallengePlayUrl(
      "https://phuzzle.vercel.app/play?puzzle=forest&grid=4x4&ct=1&cm=2",
      102,
      42,
    );
    expect(url).toBe(
      "https://phuzzle.vercel.app/play?puzzle=forest&grid=4x4&ct=102&cm=42",
    );
  });

  describe("Daily Share", () => {
    it("buildDailyShareMessage uses exact Wordle-style format", () => {
      const text = buildDailyShareMessage({
        dailyNumber: 42,
        pieceCount: 25,
        elapsedSeconds: 92,
        moveCount: 41,
        dailyLink: "https://phuzzle.app/daily",
        completionGrid: "🟦🟦🟦⬜",
      });

      expect(text).toContain("Phuzzle Daily #42");
      expect(text).toContain("Hard • 25 pieces");
      expect(text).toContain("⏱ 1:32");
      expect(text).toContain("🔁 41");
      expect(text).toContain("🟦🟦🟦⬜");
      expect(text).toContain("Play:");
      expect(text).toContain("https://phuzzle.app/daily");
    });

    it("getDailyShareCompletionGrid is deterministic", () => {
      const full = getDailyShareCompletionGrid({
        pieceCount: 9,
        elapsedSeconds: 25,
        moveCount: 15,
        usedHint: false,
        undoCount: 0,
      });
      expect([...full]).toHaveLength(4);
      expect(full).toContain("🟦");

      const withHint = getDailyShareCompletionGrid({
        pieceCount: 9,
        elapsedSeconds: 25,
        moveCount: 15,
        usedHint: true,
        undoCount: 0,
      });
      expect([...withHint]).toHaveLength(4);
      expect(withHint).toContain("⬜");
    });
  });
});
