import { describe, expect, it } from "vitest";
import type { Piece } from "@/puzzle/core/types";
import { sortTrayPiecesForFilter } from "./usePieceTrayDisplay";

function makePiece(
  id: string,
  {
    row = 0,
    col = 0,
    groupId = id,
    dragCount = 0,
  }: { row?: number; col?: number; groupId?: string; dragCount?: number } = {},
): Piece {
  return {
    id,
    row,
    col,
    x: 0,
    y: 0,
    z: 1,
    w: 100,
    h: 100,
    tileW: 80,
    tileH: 80,
    pad: 10,
    targetX: 0,
    targetY: 0,
    rotation: 0,
    targetRotation: 0,
    isPlaced: false,
    locked: false,
    groupId,
    justSnapped: false,
    shapePath: "",
    inTray: true,
    dragCount,
    edges: {
      top: row === 0 ? "flat" : "tab",
      right: col === 2 ? "flat" : "tab",
      bottom: row === 2 ? "flat" : "tab",
      left: col === 0 ? "flat" : "tab",
    },
  };
}

describe("sortTrayPiecesForFilter", () => {
  const grid = { rows: 3, cols: 3 };

  it("prioritizes recently touched pieces for the recent filter", () => {
    const pieces = [
      makePiece("corner", { row: 0, col: 0, dragCount: 1 }),
      makePiece("busy", { row: 1, col: 1, dragCount: 8 }),
      makePiece("middle", { row: 0, col: 1, dragCount: 3 }),
    ];

    const sorted = sortTrayPiecesForFilter(pieces, grid, "recent");
    expect(sorted.map((piece) => piece.id)).toEqual(["busy", "middle", "corner"]);
  });

  it("brings joined groups forward for the grouped filter", () => {
    const pieces = [
      makePiece("solo-a", { row: 0, col: 0 }),
      makePiece("joined-a", { row: 1, col: 0, groupId: "joined", dragCount: 2 }),
      makePiece("joined-b", { row: 1, col: 1, groupId: "joined", dragCount: 1 }),
      makePiece("solo-b", { row: 2, col: 2, dragCount: 6 }),
    ];

    const sorted = sortTrayPiecesForFilter(pieces, grid, "grouped");
    expect(sorted.slice(0, 2).map((piece) => piece.id)).toEqual(["joined-a", "joined-b"]);
  });
});
