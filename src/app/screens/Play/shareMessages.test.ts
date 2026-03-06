import { describe, it, expect } from "vitest";
import { buildProgressShareMessage, buildChallengeShareMessage } from "./shareMessages";

describe("shareMessages", () => {
  it("buildProgressShareMessage uses neutral copy and includes puzzle link", () => {
    const text = buildProgressShareMessage({
      elapsedSeconds: 102,
      pieceCount: 9,
      accuracyPercent: 96,
      playUrl: "https://phuzzle.vercel.app/play?session=abc",
    });

    expect(text).toContain("🧩 PHUZZLE RESULT");
    expect(text).toContain("Time: 1:42");
    expect(text).toContain("9 Pieces • Easy");
    expect(text).toContain("Accuracy: 96%");
    expect(text).toContain("Play this puzzle:");
    expect(text).toContain("https://phuzzle.vercel.app/play?session=abc");
    expect(text).not.toContain("Think you can beat me?");
  });

  it("buildChallengeShareMessage is challenge-style with taunt copy", () => {
    const text = buildChallengeShareMessage({
      elapsedSeconds: 102,
      pieceCount: 16,
      playUrl: "https://phuzzle.vercel.app/new?puzzle=xyz",
    });

    expect(text).toContain("Think you can beat me?");
    expect(text).toContain("🧩 PUZZLE CHALLENGE");
    expect(text).toContain("My Time: 1:42");
    expect(text).toContain("16 Pieces • Medium");
    expect(text).toContain("Try the same puzzle:");
    expect(text).toContain("https://phuzzle.vercel.app/new?puzzle=xyz");
  });
});
