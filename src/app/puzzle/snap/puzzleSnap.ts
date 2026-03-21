/**
 * Pure snap logic for PuzzleManager: board snap, neighbor snap, rotate-to-zero, nudge, merged snap.
 * Returns results for the manager to apply (shift, merge, fire events).
 */
import type { Piece } from "@/puzzle/core/types";
import { wouldOverlapAnyOtherGroup } from "@/puzzle/groups/groupUtils";
import { buildRowColMap, getSolvedNeighborsFromMap } from "@/puzzle/groups/groupUtils";
import type { DragPreview } from "@/puzzle/core/types";

/** Magnetic snap: radius (px) within which piece is pulled toward correct position. */
export const BOARD_MAGNET_RADIUS_PX = 56;
export const BOARD_MAGNET_STRONG_RADIUS_PX = 30;
export const EDGE_MAGNET_RADIUS_PX = 48;
export const EDGE_MAGNET_STRONG_RADIUS_PX = 24;

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

function computeMagnetStrength(
  distancePx: number,
  radiusPx: number,
  strongRadiusPx: number,
): number {
  if (distancePx > radiusPx) return 0;
  if (distancePx <= strongRadiusPx) {
    const closeT = 1 - distancePx / Math.max(1, strongRadiusPx);
    return Math.min(1, 0.72 + closeT * 0.28);
  }
  const t = 1 - distancePx / radiusPx;
  return Math.max(0, 0.12 + t * t * 0.56);
}

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
  overlapEpsilonPx: number = 0,
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
      !wouldOverlapAnyOtherGroup(pieces, gid, dx, dy, overlapEpsilonPx)
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
  if (wouldOverlapAnyOtherGroup(pieces, gid, dx, dy, overlapEpsilonPx)) return null;

  /** Allow small per-piece drift (e.g. from rounding/merge) so whole group can snap and lock. */
  const perPieceEpsilonPx = 16;
  for (const p of groupPieces) {
    const t = getTilePos(p);
    const offX = Math.abs(p.targetX - t.x - dx);
    const offY = Math.abs(p.targetY - t.y - dy);
    if (offX > perPieceEpsilonPx || offY > perPieceEpsilonPx) return null;
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
  overlapEpsilonPx: number = 0,
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
  // Prevent "far-side" jumps: if the closest geometric snap would collide,
  // do not fall back to a farther candidate in a different direction.
  if (
    wouldOverlapAnyOtherGroup(
      pieces,
      gid,
      best.dx,
      best.dy,
      overlapEpsilonPx,
      new Set([best.into]),
    )
  ) {
    return null;
  }

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
  nudgeFactor: number = 0.48,
  overlapEpsilonPx: number = 0,
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
  if (wouldOverlapAnyOtherGroup(pieces, gid, dx, dy, overlapEpsilonPx)) return null;

  return {
    nudgeDx: dx * nudgeFactor,
    nudgeDy: dy * nudgeFactor,
  };
}

/**
 * After merging, snap the merged group to board if all at target positions.
 * Verifies every piece would land on target with the same (dx, dy) so we don't lock when only one piece is close.
 */
export function computeMergedGroupBoardSnapResult(
  pieces: Piece[],
  groupId: string,
  overlapEpsilonPx: number = 0,
): MergedGroupBoardSnapResult {
  const groupPieces = getGroupPieces(pieces, groupId);
  if (!groupPieces.every((p) => p.rotation === 0)) return null;

  const ref = groupPieces[0];
  const tile = getTilePos(ref);
  const dx = ref.targetX - tile.x;
  const dy = ref.targetY - tile.y;

  if (wouldOverlapAnyOtherGroup(pieces, groupId, dx, dy, overlapEpsilonPx)) return null;

  const perPieceEpsilonPx = 16;
  for (const p of groupPieces) {
    const t = getTilePos(p);
    const offX = Math.abs(p.targetX - t.x - dx);
    const offY = Math.abs(p.targetY - t.y - dy);
    if (offX > perPieceEpsilonPx || offY > perPieceEpsilonPx) return null;
  }

  return { dx, dy };
}

export function computeBoardMagnetPreview(
  pieces: Piece[],
  activeId: string,
  snapToleranceBoardPx: number,
  overlapEpsilonPx: number = 0,
): DragPreview {
  const active = pieces.find((p) => p.id === activeId);
  if (!active || active.isPlaced || active.locked) return null;

  const gid = active.groupId;
  const groupPieces = getGroupPieces(pieces, gid);
  if (!groupPieces.every((p) => p.rotation === 0)) return null;

  const activeTile = getTilePos(active);
  const dx = active.targetX - activeTile.x;
  const dy = active.targetY - activeTile.y;
  const distancePx = Math.hypot(dx, dy);
  if (distancePx > BOARD_MAGNET_RADIUS_PX) return null;
  if (wouldOverlapAnyOtherGroup(pieces, gid, dx, dy, overlapEpsilonPx)) return null;

  const inSnapRange = distancePx <= snapToleranceBoardPx;
  const magnetStrength = computeMagnetStrength(
    distancePx,
    BOARD_MAGNET_RADIUS_PX,
    BOARD_MAGNET_STRONG_RADIUS_PX,
  );

  return {
    kind: "board",
    groupId: gid,
    dx,
    dy,
    distancePx,
    magnetStrength,
    nearSnap: true,
    inSnapRange,
    proximity: Math.max(0, 1 - distancePx / BOARD_MAGNET_RADIUS_PX),
  };
}

export function computeNeighborMagnetPreview(
  pieces: Piece[],
  activeId: string,
  snapToleranceNeighborPx: number,
  tileW: number,
  tileH: number,
  overlapEpsilonPx: number = 0,
): DragPreview {
  const result = computeNeighborSnapResult(
    pieces,
    activeId,
    EDGE_MAGNET_RADIUS_PX,
    tileW,
    tileH,
    overlapEpsilonPx,
  );
  if (!result) return null;

  return {
    kind: "neighbor",
    groupId: pieces.find((p) => p.id === activeId)?.groupId ?? result.intoGroupId,
    dx: result.dx,
    dy: result.dy,
    intoGroupId: result.intoGroupId,
    distancePx: result.dist,
    magnetStrength: computeMagnetStrength(
      result.dist,
      EDGE_MAGNET_RADIUS_PX,
      EDGE_MAGNET_STRONG_RADIUS_PX,
    ),
    nearSnap: true,
    inSnapRange: result.dist <= snapToleranceNeighborPx,
    proximity: Math.max(0, 1 - result.dist / EDGE_MAGNET_RADIUS_PX),
  };
}
