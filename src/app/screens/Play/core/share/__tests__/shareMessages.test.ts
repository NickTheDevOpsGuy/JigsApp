import { describe, it, expect } from "vitest";
import {
  buildProgressShareMessage,
  buildChallengeShareMessage,
  buildDailyShareMessage,
  getDailyShareCompletionGrid,
} from "@/screens/Play/core/share/shareMessages";

describe("shareMessages", () => {
  it("buildProgressShareMessage uses exact Share Result format with puzzle link", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 102,
      pieceCount: 9,
      accuracyPercent: 96,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
      moveCount: 25,
      puzzleName: "Sunset Beach",
    });

    expect(text).toContain("🧩 Just finished a Phuzzle!");
    expect(text).toContain("Puzzle: Sunset Beach");
    expect(text).toContain("Difficulty: Easy (9 pieces)");
    expect(text).toContain("⏱ Time: 1:42");
    expect(text).toContain("🔁 Moves: 25");
    expect(text).toContain("Play the same puzzle:");
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc");
  });

  it("buildProgressShareMessage falls back to Puzzle when puzzleName missing", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 60,
      pieceCount: 16,
      playUrl: "https://phuzzle.vercel.app/play?grid=4x4",
    });
    expect(text).toContain("Puzzle: Puzzle");
    expect(text).toContain("Difficulty: Medium (16 pieces)");
  });

  it("buildChallengeShareMessage uses exact Beat My Puzzle format with taunt, stats, and link", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 102,
      pieceCount: 16,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
      moveCount: 42,
      puzzleName: "Forest Path",
    });

    expect(text).toMatch(
      /^I solved this puzzle in 1:42 with 42 moves\. Think you can beat me\?/,
    );
    expect(text).toContain("Forest Path");
    expect(text).toMatch(/Difficulty: Medium\n\nhttps:\/\//);
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc");
  });

  it("buildChallengeShareMessage works without puzzleName", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 36,
      pieceCount: 9,
      playUrl: "https://phuzzle.vercel.app/play?grid=3x3",
      moveCount: 19,
    });
    expect(text).toMatch(
      /^I solved this puzzle in 0:36 with 19 moves\. Think you can beat me\?/,
    );
    expect(text).toContain("Puzzle");
    expect(text).toMatch(/Difficulty: Easy\n\nhttps:\/\//);
    expect(text).toContain("https://phuzzle.vercel.app/play?grid=3x3");
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
