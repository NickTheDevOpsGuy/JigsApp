import { describe, it, expect } from "vitest";
import {
  buildProgressShareMessage,
  buildChallengeShareMessage,
} from "@/screens/Play/core/share/shareMessages";

describe("shareMessages", () => {
  it("buildProgressShareMessage uses result wording and includes puzzle link", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 102,
      pieceCount: 9,
      accuracyPercent: 96,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
    });

    expect(text).toContain("Puzzle complete!");
    expect(text).toContain("Nice solve!");
    expect(text).toContain("Time: 1:42");
    expect(text).toContain("9 Pieces • Easy");
    expect(text).toContain("96% accuracy");
    expect(text).toContain("Same puzzle, same difficulty:");
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc");
  });

  it("buildChallengeShareMessage is challenge-style with time, moves, and same-puzzle link", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 102,
      pieceCount: 16,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
      moveCount: 42,
    });

    expect(text).toContain("BOOM!");
    expect(text).toContain("I just crushed that puzzle!");
    expect(text).toContain("I did it in 1:42 and 42 moves");
    expect(text).toContain("Think you can beat me?");
    expect(text).toContain("Let me know if you need lessons!");
    expect(text).toContain("Same puzzle, same difficulty:");
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc");
  });

  it("buildChallengeShareMessage includes largest merge when provided", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 36,
      pieceCount: 9,
      playUrl: "https://phuzzle.vercel.app/play?grid=3x3",
      moveCount: 19,
      maxGroupSize: 9,
    });

    expect(text).toContain("Largest merge: 9 pieces");
    expect(text).toContain("I did it in 0:36 and 19 moves");
  });
});
