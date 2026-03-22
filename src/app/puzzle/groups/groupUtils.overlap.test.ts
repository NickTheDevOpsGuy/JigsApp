import { describe, it, expect } from "vitest";
import { wouldOverlapAnyOtherGroup } from "@/puzzle/groups/groupUtils";
import { makePiece } from "@/puzzle/groups/groupUtils.test.helpers";

describe("wouldOverlapAnyOtherGroup", () => {
  it("returns false when no other groups", () => {
    const p = makePiece({ id: "a", row: 0, col: 0, groupId: "g1", inTray: false });
    expect(wouldOverlapAnyOtherGroup([p], "g1", 10, 10)).toBe(false);
  });

  it("returns false when groups do not overlap after move", () => {
    const p1 = makePiece({
      id: "a",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      w: 50,
      h: 50,
      groupId: "g1",
    });
    const p2 = makePiece({
      id: "b",
      row: 1,
      col: 0,
      x: 0,
      y: 100,
      w: 50,
      h: 50,
      groupId: "g2",
    });
    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 100, 0)).toBe(false);
  });

  it("returns true when groups would overlap after move", () => {
    const p1 = makePiece({
      id: "a",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      w: 50,
      h: 50,
      groupId: "g1",
    });
    const p2 = makePiece({
      id: "b",
      row: 1,
      col: 0,
      x: 0,
      y: 60,
      w: 50,
      h: 50,
      groupId: "g2",
    });
    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 0, 50)).toBe(true);
  });

  it("does not treat sprite padding overlap as tile overlap", () => {
    const p1 = makePiece({
      id: "a",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
      groupId: "g1",
    });
    const p2 = makePiece({
      id: "b",
      row: 0,
      col: 1,
      x: 40,
      y: 0,
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
      groupId: "g2",
    });
    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 0, 0)).toBe(false);
  });

  it("ignores tiny overlap jitter for solved edge-neighbor alignment", () => {
    const p1 = makePiece({
      id: "p1",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
      rotation: 0,
      groupId: "g1",
    });
    const p2 = makePiece({
      id: "p2",
      row: 0,
      col: 1,
      x: 39,
      y: 0,
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
      rotation: 0,
      groupId: "g2",
    });

    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 0, 0)).toBe(false);
  });

  it("ignores shallow edge overlap up to 6px for solved neighbors", () => {
    const p1 = makePiece({
      id: "left",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
      rotation: 0,
      groupId: "g1",
    });
    const p2 = makePiece({
      id: "right",
      row: 0,
      col: 1,
      x: 36,
      y: 0,
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
      rotation: 0,
      groupId: "g2",
    });

    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 0, 0)).toBe(false);
  });

  it("can ignore a specific blocking group id", () => {
    const p1 = makePiece({
      id: "a",
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      groupId: "g1",
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
    });
    // Diagonal grid neighbors (|dRow|+|dCol| !== 1) so neighbor-jitter does not
    // suppress real tile overlap; same-row adjacent cells at x≈30 are treated as shallow edge overlap.
    const p2 = makePiece({
      id: "b",
      row: 1,
      col: 1,
      x: 20,
      y: 20,
      groupId: "g2",
      pad: 10,
      tileW: 40,
      tileH: 40,
      w: 60,
      h: 60,
    });

    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 0, 0)).toBe(true);
    expect(wouldOverlapAnyOtherGroup([p1, p2], "g1", 0, 0, 0, new Set(["g2"]))).toBe(
      false,
    );
  });
});
