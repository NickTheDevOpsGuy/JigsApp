import type { Piece } from "@/puzzle/core/types";
import type { DebugFlags, PathCache } from "@/puzzle/canvas/utils/renderBoardTypes";
import { drawPiece } from "./renderBoardDrawPieceCore";

function isMisplacedGhostCandidate(p: Piece): boolean {
  if (p.isPlaced) return false;
  const tileX = p.x + p.pad;
  const tileY = p.y + p.pad;
  const atTarget =
    Math.abs(tileX - p.targetX) <= 1 &&
    Math.abs(tileY - p.targetY) <= 1 &&
    p.rotation === p.targetRotation;
  return !atTarget;
}

function drawSingleGhostAtTarget(
  ctx: CanvasRenderingContext2D,
  p: Piece,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  alpha: number,
  pathCache?: PathCache,
) {
  const ghostPiece: Piece = {
    ...p,
    x: p.targetX - p.pad,
    y: p.targetY - p.pad,
    rotation: p.targetRotation,
  };

  const popMap = new Map<string, number>();
  const nowMs = performance.now();
  const debug: DebugFlags = { showGrid: false, showBounds: false, showIds: false };

  ctx.save();
  ctx.globalAlpha = alpha;
  const ghostDpr = ctx.getTransform().a || 1;
  drawPiece(
    ctx,
    ghostPiece,
    img,
    cols,
    rows,
    popMap,
    new Map(),
    nowMs,
    debug,
    false,
    false,
    0,
    undefined,
    undefined,
    pathCache,
    ghostDpr,
  );
  ctx.restore();
}

/** Draw semi-transparent ghosts at correct positions for misplaced pieces. */
export function drawGhostHints(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  img: HTMLImageElement,
  cols: number,
  rows: number,
  alpha = 0.35,
  pathCache?: PathCache,
) {
  for (const p of pieces) {
    if (!isMisplacedGhostCandidate(p)) continue;
    drawSingleGhostAtTarget(ctx, p, img, cols, rows, alpha, pathCache);
  }
}

/**
 * Faint target preview for the hovered/selected group (desktop hover or coarse selection).
 * Skipped when global ghost hints are on — those already show every misplaced piece.
 */
export function drawHoverPlacementPreviewGhosts(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  img: HTMLImageElement,
  cols: number,
  rows: number,
  seedPieceId: string,
  alpha: number,
  pathCache?: PathCache,
) {
  const seed = pieces.find((p) => p.id === seedPieceId);
  if (!seed) return;
  const gid = seed.groupId;
  for (const p of pieces) {
    if (p.groupId !== gid) continue;
    if (!isMisplacedGhostCandidate(p)) continue;
    drawSingleGhostAtTarget(ctx, p, img, cols, rows, alpha, pathCache);
  }
}
