import { describe, expect, it } from "vitest";
import type { Piece } from "@/puzzle/core/types";
import { getFullyCompletedQuadrants } from "@/puzzle/manager/state/quadrantCompletion";

function mockPiece(row: number, col: number, correct: boolean, inTray = false): Piece {
  const targetX = col * 40;
  const targetY = row * 40;
  return {
    id: `r${row}c${col}`,
    row,
    col,
    inTray,
    x: correct ? targetX : targetX + 50,
    y: correct ? targetY : targetY,
    pad: 0,
    targetX,
    targetY,
    rotation: 0,
    targetRotation: 0,
    z: 0,
    w: 40,
    h: 40,
    tileW: 40,
    tileH: 40,
    isPlaced: false,
    locked: false,
    groupId: "g",
    justSnapped: false,
    shapePath: "",
    edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
  };
}

describe("getFullyCompletedQuadrants", () => {
  it("returns empty when no quadrant is fully correct", () => {
    const grid = { rows: 2, cols: 2 };
    const pieces = [
      mockPiece(0, 0, false),
      mockPiece(0, 1, false),
      mockPiece(1, 0, false),
      mockPiece(1, 1, false),
    ];
    expect(getFullyCompletedQuadrants(pieces, grid).size).toBe(0);
  });

  it("marks TL when both TL pieces are correct", () => {
    const grid = { rows: 2, cols: 2 };
    const pieces = [
      mockPiece(0, 0, true),
      mockPiece(0, 1, false),
      mockPiece(1, 0, false),
      mockPiece(1, 1, false),
    ];
    const s = getFullyCompletedQuadrants(pieces, grid);
    expect(s.has(0)).toBe(true);
    expect(s.has(1)).toBe(false);
  });

  it("marks all four when puzzle is solved", () => {
    const grid = { rows: 2, cols: 2 };
    const pieces = [
      mockPiece(0, 0, true),
      mockPiece(0, 1, true),
      mockPiece(1, 0, true),
      mockPiece(1, 1, true),
    ];
    expect(getFullyCompletedQuadrants(pieces, grid).size).toBe(4);
  });
});
