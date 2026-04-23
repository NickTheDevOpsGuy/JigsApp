import { describe, expect, it, vi } from "vitest";
import type { DragPreview, Piece } from "@/puzzle/core/types";
import { pointerMoveBoardSpaceOp } from "@/puzzle/manager/ops/puzzleManagerPointerOps";

function makePiece(overrides: Partial<Piece> = {}): Piece {
  return {
    id: "piece-1",
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
    groupId: "group-1",
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

describe("pointerMoveBoardSpaceOp magnetic snap", () => {
  it("moves directly and skips preview work when magnetic snap is off", () => {
    let piece = makePiece();
    const shifts: Array<{ dx: number; dy: number }> = [];
    const computeSnapPreview = vi.fn<() => DragPreview>(() => ({
      kind: "board",
      groupId: "group-1",
      dx: 10,
      dy: 8,
      distancePx: 12,
      magnetStrength: 0.5,
      nearSnap: true,
      inSnapRange: true,
      proximity: 0.75,
    }));

    const result = pointerMoveBoardSpaceOp({
      boardX: 34,
      boardY: 46,
      drag: { activeId: "piece-1", offsetX: 4, offsetY: 6, preview: null },
      findPiece: () => piece,
      shiftGroup: (_groupId, dx, dy) => {
        shifts.push({ dx, dy });
        piece = { ...piece, x: piece.x + dx, y: piece.y + dy };
      },
      computeSnapPreview,
      magneticSnapEnabled: false,
    });

    expect(shifts).toEqual([{ dx: 30, dy: 40 }]);
    expect(result.preview).toBeNull();
    expect(computeSnapPreview).not.toHaveBeenCalled();
  });

  it("keeps the existing eased pull when magnetic snap is on", () => {
    let piece = makePiece();
    const shifts: Array<{ dx: number; dy: number }> = [];
    const computeSnapPreview = vi.fn<() => DragPreview>(() => ({
      kind: "board",
      groupId: "group-1",
      dx: 10,
      dy: 8,
      distancePx: 12,
      magnetStrength: 0.5,
      nearSnap: true,
      inSnapRange: true,
      proximity: 0.75,
    }));

    const result = pointerMoveBoardSpaceOp({
      boardX: 34,
      boardY: 46,
      drag: { activeId: "piece-1", offsetX: 4, offsetY: 6, preview: null },
      findPiece: () => piece,
      shiftGroup: (_groupId, dx, dy) => {
        shifts.push({ dx, dy });
        piece = { ...piece, x: piece.x + dx, y: piece.y + dy };
      },
      computeSnapPreview,
      magneticSnapEnabled: true,
    });

    expect(shifts).toEqual([
      { dx: 25.5, dy: 34 },
      { dx: 5, dy: 4 },
    ]);
    expect(result.preview?.kind).toBe("board");
    expect(computeSnapPreview).toHaveBeenCalledTimes(1);
  });
});
