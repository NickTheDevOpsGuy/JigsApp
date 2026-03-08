import { describe, expect, it } from "vitest";
import type { Piece } from "@/puzzle/core/types";
import type { SavedPiece } from "@/puzzle/storage/puzzleStorage";
import { applySavedPieces } from "@/puzzle/manager/ops/puzzleManagerRestore";

function makePiece(id: string): Piece {
  return {
    id,
    row: 0,
    col: 0,
    x: 10,
    y: 20,
    z: 1,
    w: 80,
    h: 80,
    tileW: 64,
    tileH: 64,
    pad: 12,
    targetX: 100,
    targetY: 100,
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
    dragCount: 0,
  };
}

function toSavedPiece(piece: Piece, overrides?: Partial<SavedPiece>): SavedPiece {
  return {
    id: piece.id,
    row: piece.row,
    col: piece.col,
    x: piece.x,
    y: piece.y,
    z: piece.z,
    rotation: piece.rotation,
    isPlaced: piece.isPlaced,
    locked: piece.locked,
    groupId: piece.groupId,
    inTray: piece.inTray,
    dragCount: piece.dragCount ?? 0,
    ...overrides,
  };
}

describe("applySavedPieces", () => {
  it("forces placed/locked pieces onto the board when restoring", () => {
    const current = [makePiece("p1")];
    const saved = [
      toSavedPiece(current[0], {
        isPlaced: true,
        locked: true,
        inTray: true,
        x: current[0].targetX - current[0].pad,
        y: current[0].targetY - current[0].pad,
      }),
    ];

    const restored = applySavedPieces(current, saved);
    expect(restored[0]?.isPlaced).toBe(true);
    expect(restored[0]?.locked).toBe(true);
    expect(restored[0]?.inTray).toBe(false);
  });

  it("normalizes rotation values outside 0..359 on restore", () => {
    const current = [makePiece("p1")];
    const saved = [toSavedPiece(current[0], { rotation: 450 })];

    const restored = applySavedPieces(current, saved);
    expect(restored[0]?.rotation).toBe(90);
  });

  it("splits mixed locked/unlocked board groups so unlocked pieces stay movable", () => {
    const a = makePiece("a");
    const b = makePiece("b");
    b.groupId = "a";
    const current = [a, b];
    const saved = [
      toSavedPiece(a, {
        groupId: "a",
        locked: true,
        isPlaced: true,
        inTray: false,
        x: a.targetX - a.pad,
        y: a.targetY - a.pad,
      }),
      toSavedPiece(b, { groupId: "a", locked: false, inTray: false }),
    ];

    const restored = applySavedPieces(current, saved);
    expect(restored[0]?.locked).toBe(true);
    expect(restored[1]?.locked).toBe(false);
    expect(restored[1]?.groupId).toBe("b");
  });

  it("splits mixed tray/board groups so tray pieces do not block board locking", () => {
    const a = makePiece("a");
    const b = makePiece("b");
    b.groupId = "a";
    b.inTray = true;
    const current = [a, b];
    const saved = [
      toSavedPiece(a, { groupId: "a", inTray: false, locked: false }),
      toSavedPiece(b, { groupId: "a", inTray: true, locked: false }),
    ];

    const restored = applySavedPieces(current, saved);
    expect(restored[0]?.groupId).toBe("a");
    expect(restored[1]?.groupId).toBe("b");
    expect(restored[1]?.inTray).toBe(true);
  });

  it("snaps locked pieces to exact target on restore", () => {
    const current = [makePiece("p1")];
    const saved = [
      toSavedPiece(current[0], {
        locked: true,
        isPlaced: false,
        inTray: false,
        x: current[0].x + 100,
        y: current[0].y + 100,
        rotation: 90,
      }),
    ];

    const restored = applySavedPieces(current, saved);
    expect(restored[0]?.locked).toBe(false);
    expect(restored[0]?.isPlaced).toBe(false);
    expect(restored[0]?.x).toBe(current[0].targetX - current[0].pad);
    expect(restored[0]?.y).toBe(current[0].targetY - current[0].pad);
    expect(restored[0]?.rotation).toBe(current[0].targetRotation);
  });
});
