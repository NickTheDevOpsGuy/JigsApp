import { describe, expect, it } from "vitest";
import type { Piece, PuzzleState } from "@/puzzle/types";
import { canRotateBoardPieceInState } from "./usePointerHandlers";

function makePiece(id: string, overrides: Partial<Piece> = {}): Piece {
  return {
    id,
    row: 0,
    col: 0,
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
    groupId: id,
    justSnapped: false,
    shapePath: "",
    inTray: false,
    edges: {
      top: "flat",
      right: "flat",
      bottom: "flat",
      left: "flat",
    },
    ...overrides,
  };
}

function makeState(pieces: Piece[]): PuzzleState {
  return {
    imageUrl: "test-image",
    grid: { rows: 2, cols: 2 },
    pieces,
    placedCount: 0,
    totalCount: pieces.length,
    isComplete: false,
  };
}

describe("canRotateBoardPieceInState", () => {
  it("allows rotating a single unlocked board piece", () => {
    const piece = makePiece("p1");
    const state = makeState([piece]);
    expect(canRotateBoardPieceInState(state, "p1")).toBe(true);
  });

  it("allows rotating an unlocked board group", () => {
    const p1 = makePiece("p1", { groupId: "g1" });
    const p2 = makePiece("p2", { groupId: "g1" });
    const state = makeState([p1, p2]);
    expect(canRotateBoardPieceInState(state, "p1")).toBe(true);
    expect(canRotateBoardPieceInState(state, "p2")).toBe(true);
  });

  it("blocks rotation when any piece in the board group is locked", () => {
    const p1 = makePiece("p1", { groupId: "g1" });
    const p2 = makePiece("p2", { groupId: "g1", locked: true });
    const state = makeState([p1, p2]);
    expect(canRotateBoardPieceInState(state, "p1")).toBe(false);
  });

  it("blocks rotation for tray pieces", () => {
    const piece = makePiece("p1", { inTray: true });
    const state = makeState([piece]);
    expect(canRotateBoardPieceInState(state, "p1")).toBe(false);
  });
});
