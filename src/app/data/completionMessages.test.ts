import { describe, it, expect } from "vitest";
import {
  getCompletionMessage,
  getCompletionBadge,
  COMPLETION_MESSAGES,
} from "./completionMessages";

describe("getCompletionMessage", () => {
  it("returns a message from COMPLETION_MESSAGES", () => {
    const msg = getCompletionMessage(0);
    expect(COMPLETION_MESSAGES).toContain(msg);
  });

  it("returns consistent message for same seed", () => {
    expect(getCompletionMessage(42)).toBe(getCompletionMessage(42));
  });

  it("handles negative seeds", () => {
    const msg = getCompletionMessage(-100);
    expect(COMPLETION_MESSAGES).toContain(msg);
  });
});

describe("getCompletionBadge", () => {
  it('returns "Speed Demon" for fast completion with no undos', () => {
    expect(getCompletionBadge(45, 0, 9)).toBe("Speed Demon");
    expect(getCompletionBadge(80, 0, 16)).toBe("Speed Demon");
  });

  it('returns "Precision Pro" for fast completion with at most 1 undo', () => {
    expect(getCompletionBadge(100, 1, 16)).toBe("Precision Pro");
    expect(getCompletionBadge(150, 1, 20)).toBe("Precision Pro");
  });

  it('returns "Chill Mode" for many undos or slow time per piece', () => {
    expect(getCompletionBadge(600, 12, 9)).toBe("Chill Mode");
    expect(getCompletionBadge(550, 2, 9)).toBe("Chill Mode");
  });

  it('returns "Lightning" for sub-75s on 16+ pieces (when not Precision Pro)', () => {
    expect(getCompletionBadge(70, 2, 16)).toBe("Lightning");
    expect(getCompletionBadge(60, 3, 25)).toBe("Lightning");
  });

  it('returns "Persistent" for 6+ undos', () => {
    expect(getCompletionBadge(120, 6, 9)).toBe("Persistent");
  });

  it('returns "Puzzle Pro" as default', () => {
    expect(getCompletionBadge(200, 3, 16)).toBe("Puzzle Pro");
  });

  it("boundary: Speed Demon requires timePerPiece < 10", () => {
    expect(getCompletionBadge(89, 0, 9)).toBe("Speed Demon");
    expect(getCompletionBadge(90, 0, 9)).toBe("Precision Pro");
  });

  it("boundary: Precision Pro requires timePerPiece < 15", () => {
    expect(getCompletionBadge(149, 1, 10)).toBe("Precision Pro");
    expect(getCompletionBadge(150, 1, 10)).not.toBe("Precision Pro");
  });

  it("boundary: Chill Mode at undoCount 12 or timePerPiece > 55", () => {
    expect(getCompletionBadge(1, 12, 1)).toBe("Chill Mode");
    expect(getCompletionBadge(560, 0, 10)).toBe("Chill Mode");
  });

  it("boundary: Lightning requires elapsed < 75 and pieceCount >= 16", () => {
    expect(getCompletionBadge(74, 2, 16)).toBe("Lightning");
    expect(getCompletionBadge(75, 2, 16)).not.toBe("Lightning");
    expect(getCompletionBadge(50, 2, 15)).not.toBe("Lightning");
  });

  it("boundary: Persistent at undoCount 6", () => {
    expect(getCompletionBadge(100, 5, 9)).not.toBe("Persistent");
    expect(getCompletionBadge(100, 6, 9)).toBe("Persistent");
  });
});
