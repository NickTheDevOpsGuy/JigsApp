import { describe, expect, it } from "vitest";
import { computeBoardSnapResult, computeNeighborSnapResult } from "./puzzleSnap";
import type { Piece } from "./types";

function makePiece(
  overrides: Partial<Piece> & { id: string; row: number; col: number },
): Piece {
  return {
    id: overrides.id,
    row: overrides.row,
    col: overrides.col,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    z: overrides.z ?? 0,
    w: overrides.w ?? 60,
    h: overrides.h ?? 60,
    pad: overrides.pad ?? 10,
    tileW: overrides.tileW ?? 40,
    tileH: overrides.tileH ?? 40,
    targetX: overrides.targetX ?? 0,
    targetY: overrides.targetY ?? 0,
    rotation: overrides.rotation ?? 0,
    targetRotation: overrides.targetRotation ?? 0,
    isPlaced: overrides.isPlaced ?? false,
    locked: overrides.locked ?? false,
    groupId: overrides.groupId ?? overrides.id,
    inTray: overrides.inTray ?? false,
    shapePath: overrides.shapePath ?? "",
  } as Piece;
}

describe("computeNeighborSnapResult", () => {
  it("does not jump to farther candidate when nearest candidate would overlap", () => {
    const active = makePiece({
      id: "active",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      groupId: "gA",
      tileW: 40,
      tileH: 40,
      pad: 10,
    });

    // Closest candidate neighbor (requires dx = +8). This should be blocked by blocker.
    const rightNeighbor = makePiece({
      id: "right",
      row: 0,
      col: 1,
      x: 58, // tileX=68 => dx=68-40-20? for active tileX=10 => dx=18? let's compute with current values
      y: 0,
      groupId: "gR",
      tileW: 40,
      tileH: 40,
      pad: 10,
    });

    // Farther candidate on the opposite side (requires larger movement), should NOT be chosen.
    const bottomNeighbor = makePiece({
      id: "bottom",
      row: 1,
      col: 0,
      x: 0,
      y: 75,
      groupId: "gB",
      tileW: 40,
      tileH: 40,
      pad: 10,
    });

    // Blocker overlaps with active group if it moves toward rightNeighbor.
    const blocker = makePiece({
      id: "block",
      row: 9,
      col: 9,
      x: 49,
      y: 0,
      groupId: "gX",
      tileW: 40,
      tileH: 40,
      pad: 10,
    });

    const pieces = [active, rightNeighbor, bottomNeighbor, blocker];
    const result = computeNeighborSnapResult(pieces, "active", 40, 40, 40);

    expect(result).toBeNull();
  });

  it("allows neighbor snap when overlap is only with intended merge target", () => {
    const active = makePiece({
      id: "active",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      groupId: "gA",
      tileW: 40,
      tileH: 40,
      pad: 10,
    });

    const rightNeighbor = makePiece({
      id: "right",
      row: 0,
      col: 1,
      x: 36, // close enough to snap; tile overlap would exist with gR at this position
      y: 0,
      groupId: "gR",
      tileW: 40,
      tileH: 40,
      pad: 10,
    });

    const result = computeNeighborSnapResult(
      [active, rightNeighbor],
      "active",
      40,
      40,
      40,
    );
    expect(result).not.toBeNull();
    expect(result?.intoGroupId).toBe("gR");
  });
});

describe("computeBoardSnapResult", () => {
  it("can allow tiny non-neighbor overlap when overlap epsilon is provided", () => {
    const active = makePiece({
      id: "active",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      targetX: 10,
      targetY: 10,
      groupId: "gA",
      tileW: 40,
      tileH: 40,
      pad: 10,
      rotation: 0,
    });
    const blocker = makePiece({
      id: "blocker",
      row: 9,
      col: 9,
      x: 38,
      y: 0,
      groupId: "gB",
      tileW: 40,
      tileH: 40,
      pad: 10,
      rotation: 0,
      inTray: false,
    });

    expect(computeBoardSnapResult([active, blocker], "active", 20, 0)).toBeNull();
    expect(computeBoardSnapResult([active, blocker], "active", 20, 3)?.kind).toBe(
      "snap",
    );
  });
});
