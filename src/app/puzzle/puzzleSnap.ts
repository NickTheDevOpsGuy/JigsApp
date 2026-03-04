/**
 * Pure snap logic for PuzzleManager: board snap, neighbor snap, rotate-to-zero, nudge, merged snap.
 * Returns results for the manager to apply (shift, merge, fire events).
 */
import type { Piece } from "./types";
import { wouldOverlapAnyOtherGroup } from "./groupUtils";
import { buildRowColMap, getSolvedNeighborsFromMap } from "./groupUtils";

export type BoardSnapResult =
  | { kind: "snap"; dx: number; dy: number; groupId: string }
  | { kind: "wrongRotation"; groupId: string; pieceIds: string[] }
  | null;

export type NeighborSnapResult = {
  kind: "snap";
  dx: number;
  dy: number;
  intoGroupId: string;
  /** Distance in px at snap (for precision scoring). */
  dist: number;
} | null;

export type NearSnapNudgeResult = { nudgeDx: number; nudgeDy: number } | null;

export type MergedGroupBoardSnapResult = { dx: number; dy: number } | null;

function getTilePos(p: Piece): { x: number; y: number } {
  return { x: p.x + p.pad, y: p.y + p.pad };
}

function getGroupPieces(pieces: Piece[], groupId: string): Piece[] {
  return pieces.filter((p) => p.groupId === groupId);
}

/**
 * Check if the active group can snap to the board (all at target positions).
 * Returns snap delta to apply, or wrong-rotation hint, or null.
 */
export function computeBoardSnapResult(
  pieces: Piece[],
  activeId: string,
  toleranceBoardPx: number,
): BoardSnapResult {
  const active = pieces.find((p) => p.id === activeId);
  if (!active) return null;

  const gid = active.groupId;
  const groupPieces = getGroupPieces(pieces, gid);

  if (!groupPieces.every((p) => p.rotation === 0)) {
    const activeTile = getTilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;
    if (
      Math.hypot(dx, dy) <= toleranceBoardPx &&
      !wouldOverlapAnyOtherGroup(pieces, gid, dx, dy)
    ) {
      return {
        kind: "wrongRotation",
        groupId: gid,
        pieceIds: groupPieces.map((p) => p.id),
      };
    }
    return null;
  }

  const activeTile = getTilePos(active);
  const dx = active.targetX - activeTile.x;
  const dy = active.targetY - activeTile.y;

  if (Math.hypot(dx, dy) > toleranceBoardPx) return null;
  if (wouldOverlapAnyOtherGroup(pieces, gid, dx, dy)) return null;

  for (const p of groupPieces) {
    const t = getTilePos(p);
    const offX = Math.abs(p.targetX - t.x - dx);
    const offY = Math.abs(p.targetY - t.y - dy);
    if (offX > 2 || offY > 2) return null;
  }

  return {
    kind: "snap",
    dx,
    dy,
    groupId: gid,
  };
}

/**
 * Rotate the group to 0° around its geometric center. Returns new pieces array.
 * Only rotates board pieces (never tray); tray pieces in the group are left unchanged.
 */
export function rotateGroupToZeroPieces(pieces: Piece[], groupId: string): Piece[] {
  const groupPieces = getGroupPieces(pieces, groupId).filter((p) => !p.inTray);
  if (groupPieces.length === 0) return pieces;
  const rot = groupPieces[0].rotation;
  if (rot === 0) return pieces;

  const centerX = groupPieces.reduce((s, p) => s + p.x + p.w / 2, 0) / groupPieces.length;
  const centerY = groupPieces.reduce((s, p) => s + p.y + p.h / 2, 0) / groupPieces.length;
  const rad = (-rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const map = new Map(pieces.map((p) => [p.id, p]));
  for (const p of groupPieces) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const dx = cx - centerX;
    const dy = cy - centerY;
    const newCx = centerX + dx * cos - dy * sin;
    const newCy = centerY + dx * sin + dy * cos;
    map.set(p.id, {
      ...p,
      x: Math.round(newCx - p.w / 2),
      y: Math.round(newCy - p.h / 2),
      rotation: 0,
    });
  }
  return pieces.map((p) => map.get(p.id) ?? p);
}

/**
 * Check if the active group can snap to a neighbor. Call after rotating to 0 if needed.
 */
export function computeNeighborSnapResult(
  pieces: Piece[],
  activeId: string,
  toleranceNeighborPx: number,
  tileW: number,
  tileH: number,
): NeighborSnapResult {
  const active = pieces.find((p) => p.id === activeId);
  if (!active || active.isPlaced) return null;

  const gid = active.groupId;
  const groupPieces = getGroupPieces(pieces, gid);
  const groupIdSet = new Set(groupPieces.map((p) => p.id));
  const rowColMap = buildRowColMap(pieces);

  const boundaryPieces = groupPieces.filter((gp) => {
    const neighbors = getSolvedNeighborsFromMap(gp, rowColMap);
    return neighbors.some((n) => !n.inTray && !groupIdSet.has(n.id) && n.rotation === 0);
  });

  let best: { dx: number; dy: number; dist: number; into: string } | null = null;

  for (const gp of boundaryPieces) {
    for (const n of getSolvedNeighborsFromMap(gp, rowColMap)) {
      if (n.groupId === gid || n.rotation !== 0 || n.inTray) continue;

      const gpTile = getTilePos(gp);
      const nTile = getTilePos(n);

      const expectedDx = (n.col - gp.col) * tileW;
      const expectedDy = (n.row - gp.row) * tileH;

      const dx = nTile.x - expectedDx - gpTile.x;
      const dy = nTile.y - expectedDy - gpTile.y;
      const d = Math.hypot(dx, dy);

      if (d <= toleranceNeighborPx && (!best || d < best.dist)) {
        best = { dx, dy, dist: d, into: n.groupId };
      }
    }
  }

  if (!best) return null;
  return {
    kind: "snap",
    dx: best.dx,
    dy: best.dy,
    intoGroupId: best.into,
    dist: best.dist,
  };
}

/**
 * Gentle nudge when group is very close to board snap but didn't snap.
 */
export function computeNearSnapNudge(
  pieces: Piece[],
  activeId: string,
  toleranceBoardPx: number,
  nudgeFactor: number = 0.35,
): NearSnapNudgeResult {
  const active = pieces.find((p) => p.id === activeId);
  if (!active || active.isPlaced || active.locked) return null;

  const gid = active.groupId;
  const groupPieces = getGroupPieces(pieces, gid);
  if (!groupPieces.every((p) => p.rotation === 0)) return null;

  const activeTile = getTilePos(active);
  const dx = active.targetX - activeTile.x;
  const dy = active.targetY - activeTile.y;
  const distance = Math.hypot(dx, dy);
  const nearThreshold = toleranceBoardPx * 0.7;
  const farThreshold = toleranceBoardPx * 1.15;

  if (distance <= nearThreshold || distance > farThreshold) return null;
  if (wouldOverlapAnyOtherGroup(pieces, gid, dx, dy)) return null;

  return {
    nudgeDx: dx * nudgeFactor,
    nudgeDy: dy * nudgeFactor,
  };
}

/**
 * After merging, snap the merged group to board if all at target positions.
 */
export function computeMergedGroupBoardSnapResult(
  pieces: Piece[],
  groupId: string,
): MergedGroupBoardSnapResult {
  const groupPieces = getGroupPieces(pieces, groupId);
  if (!groupPieces.every((p) => p.rotation === 0)) return null;

  const ref = groupPieces[0];
  const tile = getTilePos(ref);
  const dx = ref.targetX - tile.x;
  const dy = ref.targetY - tile.y;

  if (wouldOverlapAnyOtherGroup(pieces, groupId, dx, dy)) return null;
  return { dx, dy };
}
