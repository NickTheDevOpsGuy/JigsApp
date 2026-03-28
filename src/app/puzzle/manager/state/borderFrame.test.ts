import { describe, expect, it } from "vitest";
import type { Piece } from "@/puzzle/core/types";
import {
  areAllBorderPiecesCorrect,
  isBorderGridCell,
  isPieceCorrectOnBoard,
} from "@/puzzle/manager/state/borderFrame";

function mockPiece(
  partial: Pick<Piece, "row" | "col" | "inTray"> &
    Partial<
      Pick<
        Piece,
        "x" | "y" | "pad" | "targetX" | "targetY" | "rotation" | "targetRotation"
      >
    >,
): Piece {
  const pad = partial.pad ?? 0;
  const targetX = partial.targetX ?? 0;
  const targetY = partial.targetY ?? 0;
  return {
    id: `r${partial.row}c${partial.col}`,
    row: partial.row,
    col: partial.col,
    inTray: partial.inTray,
    x: partial.x ?? targetX - pad,
    y: partial.y ?? targetY - pad,
    pad,
    targetX,
    targetY,
    rotation: partial.rotation ?? 0,
    targetRotation: partial.targetRotation ?? 0,
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

describe("isBorderGridCell", () => {
  it("marks outer ring only", () => {
    const g = { rows: 3, cols: 3 };
    expect(isBorderGridCell(0, 0, g)).toBe(true);
    expect(isBorderGridCell(1, 1, g)).toBe(false);
    expect(isBorderGridCell(2, 2, g)).toBe(true);
  });
});

describe("areAllBorderPiecesCorrect", () => {
  it("is false when a border piece is in the tray", () => {
    const grid = { rows: 2, cols: 2 };
    const pieces: Piece[] = [
      mockPiece({ row: 0, col: 0, inTray: false, targetX: 0, targetY: 0 }),
      mockPiece({ row: 0, col: 1, inTray: false, targetX: 40, targetY: 0 }),
      mockPiece({ row: 1, col: 0, inTray: false, targetX: 0, targetY: 40 }),
      mockPiece({ row: 1, col: 1, inTray: true, targetX: 40, targetY: 40 }),
    ];
    expect(areAllBorderPiecesCorrect(pieces, grid)).toBe(false);
  });

  it("is true when all four edges are correct on the board", () => {
    const grid = { rows: 2, cols: 2 };
    const pieces: Piece[] = [
      mockPiece({ row: 0, col: 0, inTray: false, targetX: 0, targetY: 0 }),
      mockPiece({ row: 0, col: 1, inTray: false, targetX: 40, targetY: 0 }),
      mockPiece({ row: 1, col: 0, inTray: false, targetX: 0, targetY: 40 }),
      mockPiece({ row: 1, col: 1, inTray: false, targetX: 40, targetY: 40 }),
    ];
    expect(areAllBorderPiecesCorrect(pieces, grid)).toBe(true);
    pieces.forEach((p) => expect(isPieceCorrectOnBoard(p)).toBe(true));
  });
});
