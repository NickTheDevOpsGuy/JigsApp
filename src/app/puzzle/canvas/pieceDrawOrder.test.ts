import { describe, it, expect } from "vitest";
import type { Piece } from "../types";
import { sortPiecesForDraw, sortPiecesForHitTest } from "./pieceDrawOrder";

function makePiece(
  overrides: Partial<Piece> & { id: string; groupId?: string; z?: number },
): Piece {
  return {
    id: overrides.id,
    row: overrides.row ?? 0,
    col: overrides.col ?? 0,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    z: overrides.z ?? 1,
    w: overrides.w ?? 50,
    h: overrides.h ?? 50,
    tileW: overrides.tileW ?? 40,
    tileH: overrides.tileH ?? 40,
    pad: overrides.pad ?? 10,
    targetX: overrides.targetX ?? 0,
    targetY: overrides.targetY ?? 0,
    rotation: overrides.rotation ?? 0,
    targetRotation: overrides.targetRotation ?? 0,
    isPlaced: overrides.isPlaced ?? false,
    locked: overrides.locked ?? false,
    groupId: overrides.groupId ?? overrides.id,
    justSnapped: overrides.justSnapped ?? false,
    shapePath: overrides.shapePath ?? "",
    inTray: overrides.inTray ?? false,
    edges: overrides.edges ?? {
      top: "flat",
      right: "flat",
      bottom: "flat",
      left: "flat",
    },
    dragCount: overrides.dragCount,
  };
}

describe("pieceDrawOrder", () => {
  it("orders by z (higher z on top) so newly snapped pieces stay visible", () => {
    const lowZ = makePiece({ id: "low", z: 2 });
    const midZ = makePiece({ id: "mid", z: 10 });
    const highZ = makePiece({ id: "high", z: 99 });

    const drawn = sortPiecesForDraw([midZ, highZ, lowZ], null);
    expect(drawn.map((p) => p.id)).toEqual(["low", "mid", "high"]);

    const hitTest = sortPiecesForHitTest([midZ, highZ, lowZ]);
    expect(hitTest.map((p) => p.id)).toEqual(["high", "mid", "low"]);
  });

  it("always renders the dragged group on top", () => {
    const dragged = makePiece({ id: "dragged", groupId: "g1", z: 1 });
    const otherTop = makePiece({ id: "other", groupId: "g2", z: 99 });

    const drawn = sortPiecesForDraw([otherTop, dragged], "g1");
    expect(drawn[drawn.length - 1]?.id).toBe("dragged");
  });

  it("keeps movable pieces above locked/placed even if z would put locked on top", () => {
    const movableLowZ = makePiece({ id: "movable", z: 1, isPlaced: false });
    const lockedHighZ = makePiece({ id: "locked", z: 999, isPlaced: true, locked: true });

    const drawn = sortPiecesForDraw([lockedHighZ, movableLowZ], null);
    expect(drawn[0]?.id).toBe("locked");
    expect(drawn[1]?.id).toBe("movable");
  });

  it("still respects z within the same layer bucket", () => {
    const unplacedHighZ = makePiece({ id: "unplaced", z: 99, isPlaced: false });
    const lockedLowZ = makePiece({ id: "locked", z: 1, isPlaced: true, locked: true });

    const drawn = sortPiecesForDraw([unplacedHighZ, lockedLowZ], null);
    expect(drawn[0]?.id).toBe("locked");
    expect(drawn[1]?.id).toBe("unplaced");
  });

  it("keeps movable pieces above all locked/placed pieces even in mixed groups", () => {
    const mixedLocked = makePiece({
      id: "mixed-locked",
      groupId: "g-mixed",
      z: 2,
      locked: true,
      isPlaced: true,
    });
    const mixedMovable = makePiece({
      id: "mixed-movable",
      groupId: "g-mixed",
      z: 3,
      locked: false,
      isPlaced: false,
    });
    const placedGroupPiece = makePiece({
      id: "placed",
      groupId: "g-placed",
      z: 500,
      locked: true,
      isPlaced: true,
    });

    const drawn = sortPiecesForDraw([placedGroupPiece, mixedLocked, mixedMovable], null);

    expect(drawn[2]?.id).toBe("mixed-movable");
    expect(drawn[0]?.id).not.toBe("mixed-movable");
  });
});
