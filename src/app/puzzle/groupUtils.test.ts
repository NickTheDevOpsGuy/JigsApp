import { describe, it, expect } from "vitest";
import {
  rowColKey,
  buildRowColMap,
  getSolvedNeighborsFromMap,
  getGroupBounds,
  wouldOverlapAnyOtherGroup,
  getSolvedNeighbors,
} from "./groupUtils";
import type { Piece } from "./types";

function makePiece(overrides: Partial<Piece> & { id: string; row: number; col: number }): Piece {
  return {
    id: overrides.id,
    row: overrides.row,
    col: overrides.col,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    z: overrides.z ?? 0,
    w: overrides.w ?? 50,
    h: overrides.h ?? 50,
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

describe("rowColKey", () => {
  it("returns comma-separated row,col", () => {
    expect(rowColKey(0, 0)).toBe("0,0");
    expect(rowColKey(2, 3)).toBe("2,3");
    expect(rowColKey(10, 5)).toBe("10,5");
  });
});

describe("buildRowColMap", () => {
  it("maps (row,col) to piece", () => {
    const p1 = makePiece({ id: "a", row: 0, col: 0 });
    const p2 = makePiece({ id: "b", row: 1, col: 1 });
    const map = buildRowColMap([p1, p2]);
    expect(map.get("0,0")).toBe(p1);
    expect(map.get("1,1")).toBe(p2);
    expect(map.size).toBe(2);
  });

  it("overwrites when multiple pieces same cell (last wins)", () => {
    const p1 = makePiece({ id: "a", row: 0, col: 0 });
    const p2 = makePiece({ id: "b", row: 0, col: 0 });
    const map = buildRowColMap([p1, p2]);
    expect(map.get("0,0")).toBe(p2);
    expect(map.size).toBe(1);
  });
});

describe("getSolvedNeighborsFromMap", () => {
  it("returns 4 orthogonal neighbors when all exist", () => {
    const center = makePiece({ id: "c", row: 1, col: 1 });
    const n = makePiece({ id: "n", row: 0, col: 1 });
    const s = makePiece({ id: "s", row: 2, col: 1 });
    const e = makePiece({ id: "e", row: 1, col: 2 });
    const w = makePiece({ id: "w", row: 1, col: 0 });
    const map = buildRowColMap([center, n, s, e, w]);
    const neighbors = getSolvedNeighborsFromMap(center, map);
    expect(neighbors).toHaveLength(4);
    expect(neighbors.map((p) => p.id).sort()).toEqual(["e", "n", "s", "w"]);
  });

  it("returns fewer when neighbors missing", () => {
    const center = makePiece({ id: "c", row: 1, col: 1 });
    const n = makePiece({ id: "n", row: 0, col: 1 });
    const map = buildRowColMap([center, n]);
    const neighbors = getSolvedNeighborsFromMap(center, map);
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].id).toBe("n");
  });
});

describe("getGroupBounds", () => {
  it("returns null for empty group", () => {
    const pieces = [makePiece({ id: "a", row: 0, col: 0, groupId: "g1" })];
    expect(getGroupBounds(pieces, "g2")).toBeNull();
  });

  it("returns bounds for single piece", () => {
    const p = makePiece({ id: "a", row: 0, col: 0, x: 10, y: 20, w: 50, h: 50 });
    expect(getGroupBounds([p], p.groupId)).toEqual({ minX: 10, minY: 20, maxX: 60, maxY: 70 });
  });

  it("returns union bounds for multi-piece group", () => {
    const p1 = makePiece({ id: "a", row: 0, col: 0, x: 0, y: 0, w: 50, h: 50 });
    const p2 = makePiece({ id: "b", row: 1, col: 0, x: 0, y: 60, w: 50, h: 50, groupId: p1.groupId });
    const bounds = getGroupBounds([p1, p2], p1.groupId);
    expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 50, maxY: 110 });
  });
});

describe("wouldOverlapAnyOtherGroup", () => {
  it("returns false when no other groups", () => {
    const p = makePiece({ id: "a", row: 0, col: 0, groupId: "g1", inTray: false });
    expect(wouldOverlapAnyOtherGroup([p], "g1", 10, 10)).toBe(false);
  });

  it("returns false when groups do not overlap after move", () => {
    const p1 = makePiece({ id: "a", row: 0, col: 0, x: 0, y: 0, w: 50, h: 50, groupId: "g1" });
    const p2 = makePiece({ id: "b", row: 1, col: 0, x: 0, y: 100, w: 50, h: 50, groupId: "g2" });
    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 100, 0)).toBe(false);
  });

  it("returns true when groups would overlap after move", () => {
    const p1 = makePiece({ id: "a", row: 0, col: 0, x: 0, y: 0, w: 50, h: 50, groupId: "g1" });
    const p2 = makePiece({ id: "b", row: 1, col: 0, x: 0, y: 60, w: 50, h: 50, groupId: "g2" });
    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 0, 50)).toBe(true);
  });
});

describe("getSolvedNeighbors", () => {
  it("returns orthogonal neighbors from piece list", () => {
    const center = makePiece({ id: "c", row: 1, col: 1 });
    const n = makePiece({ id: "n", row: 0, col: 1 });
    const s = makePiece({ id: "s", row: 2, col: 1 });
    const pieces = [center, n, s];
    const neighbors = getSolvedNeighbors(pieces, center);
    expect(neighbors).toHaveLength(2);
    expect(neighbors.map((p) => p.id).sort()).toEqual(["n", "s"]);
  });
});
