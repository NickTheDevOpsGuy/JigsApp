import { describe, it, expect } from "vitest";
import {
  buildChallengePlayUrl,
  buildProgressShareMessage,
  buildChallengeShareMessage,
  buildDailyShareMessage,
  getDailyShareCompletionGrid,
} from "@/screens/Play/core/share/shareMessages";

describe("shareMessages", () => {
  it("buildProgressShareMessage uses polished Share Result format with puzzle link", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 102,
      pieceCount: 9,
      accuracyPercent: 96,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
      moveCount: 25,
      puzzleName: "Sunset Beach",
    });

    expect(text).toContain("🧩 Phuzzle Complete");
    expect(text).toContain("Sunset Beach");
    expect(text).toContain("Easy • 9 pieces");
    expect(text).toContain("⏱ Time: 1:42");
    expect(text).toContain("🔁 Moves: 25");
    expect(text).toContain("🎯 Accuracy: 96%");
    expect(text).toContain("Play this exact puzzle:");
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc");
  });

  it("buildProgressShareMessage falls back to Puzzle when puzzleName missing", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 60,
      pieceCount: 16,
      playUrl: "https://phuzzle.vercel.app/play?grid=4x4",
    });
    expect(text).toContain("Puzzle");
    expect(text).toContain("Medium • 16 pieces");
  });

  it("buildChallengeShareMessage uses polished challenge format with exact puzzle link", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 102,
      pieceCount: 16,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
      moveCount: 42,
      puzzleName: "Forest Path",
    });

    expect(text).toContain("🧩 Phuzzle Challenge");
    expect(text).toContain("Think you can beat my run on Forest Path?");
    expect(text).toContain("Medium • 16 pieces");
    expect(text).toContain("⏱ Time to beat: 1:42");
    expect(text).toContain("🔁 Moves to beat: 42");
    expect(text).toContain("Play this exact puzzle:");
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc&ct=102&cm=42");
  });

  it("buildChallengeShareMessage works without puzzleName", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 36,
      pieceCount: 9,
      playUrl: "https://phuzzle.vercel.app/play?grid=3x3",
      moveCount: 19,
    });
    expect(text).toContain("Think you can beat my run on Puzzle?");
    expect(text).toContain("Easy • 9 pieces");
    expect(text).toContain("https://phuzzle.vercel.app/play?grid=3x3&ct=36&cm=19");
  });

  it("buildChallengePlayUrl preserves existing puzzle params and rewrites challenge stats", () => {
    const url = buildChallengePlayUrl(
      "https://phuzzle.vercel.app/play?puzzle=forest&grid=4x4&ct=1&cm=2",
      102,
      42,
    );
    expect(url).toBe("https://phuzzle.vercel.app/play?puzzle=forest&grid=4x4&ct=102&cm=42");
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
