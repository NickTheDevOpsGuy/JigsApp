import { describe, expect, it } from "vitest";
import type { Piece } from "@/puzzle/core/types";
import { pickIdleCorrectPulsePieceId } from "./pickIdleCorrectPulsePiece";

function piece(
  row: number,
  col: number,
  opts: { correct: boolean; inTray?: boolean; id?: string },
): Piece {
  const { correct, inTray = false, id = `r${row}c${col}` } = opts;
  const targetX = col * 40;
  const targetY = row * 40;
  return {
    id,
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
    isPlaced: correct,
    locked: false,
    groupId: "g",
    justSnapped: false,
    shapePath: "",
    edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
  };
}

describe("pickIdleCorrectPulsePieceId", () => {
  it("returns null when no board piece is correct", () => {
    const pieces = [
      piece(0, 0, { correct: false }),
      piece(0, 1, { correct: false, inTray: true }),
    ];
    expect(pickIdleCorrectPulsePieceId(pieces)).toBeNull();
  });

  it("prefers top-left among correct board pieces", () => {
    const pieces = [
      piece(1, 0, { correct: true, id: "a" }),
      piece(0, 1, { correct: true, id: "b" }),
      piece(0, 0, { correct: true, id: "c" }),
    ];
    expect(pickIdleCorrectPulsePieceId(pieces)).toBe("c");
  });
});
