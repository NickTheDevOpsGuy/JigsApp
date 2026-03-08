import { describe, expect, it } from "vitest";
import type { Piece } from "@/puzzle/core/types";
import { buildTraySlots } from "../PieceTray";

function makePiece(id: string): Piece {
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
    inTray: true,
    edges: {
      top: "flat",
      right: "flat",
      bottom: "flat",
      left: "flat",
    },
  };
}

describe("buildTraySlots", () => {
  it("returns no placeholders when the tray is empty", () => {
    const slots = buildTraySlots([], 9);
    expect(slots).toHaveLength(0);
  });

  it("caps piece slots at the configured total", () => {
    const pieces = [makePiece("p1"), makePiece("p2"), makePiece("p3")];
    const slots = buildTraySlots(pieces, 2);
    expect(slots).toHaveLength(2);
    expect(slots.every((s: { kind: string }) => s.kind === "piece")).toBe(true);
  });

  it("does not create blank slots for missing capacity", () => {
    const pieces = [makePiece("p1"), makePiece("p2")];
    const slots = buildTraySlots(pieces, 5);
    expect(slots).toHaveLength(2);
    expect(slots.every((s: { kind: string }) => s.kind === "piece")).toBe(true);
    expect(slots.map((s: { piece: Piece }) => s.piece.id)).toEqual(["p1", "p2"]);
  });
});
