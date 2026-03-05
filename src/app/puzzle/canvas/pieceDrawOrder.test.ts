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
  it("keeps locked/placed pieces behind movable ones even when z is higher", () => {
    const lockedTopZ = makePiece({ id: "locked", locked: true, z: 99 });
    const movableLowZ = makePiece({ id: "movable-low", z: 2 });
    const movableHighZ = makePiece({ id: "movable-high", z: 10 });

    const drawn = sortPiecesForDraw([movableLowZ, lockedTopZ, movableHighZ], null);
    expect(drawn.map((p) => p.id)).toEqual(["locked", "movable-low", "movable-high"]);

    const hitTest = sortPiecesForHitTest([movableLowZ, lockedTopZ, movableHighZ]);
    expect(hitTest.map((p) => p.id)).toEqual(["movable-high", "movable-low", "locked"]);
  });

  it("always renders the dragged group on top", () => {
    const dragged = makePiece({ id: "dragged", groupId: "g1", z: 1 });
    const otherTop = makePiece({ id: "other", groupId: "g2", z: 99 });

    const drawn = sortPiecesForDraw([otherTop, dragged], "g1");
    expect(drawn[drawn.length - 1]?.id).toBe("dragged");
  });
});
