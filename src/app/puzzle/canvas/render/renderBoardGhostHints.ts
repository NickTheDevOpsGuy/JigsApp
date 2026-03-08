import type { Piece } from "@/puzzle/core/types";
import type { DebugFlags } from "@/puzzle/canvas/utils/renderBoardTypes";
import { drawPiece } from "./renderBoardDrawPieceCore";

/** Draw semi-transparent ghosts at correct positions for misplaced pieces. */
export function drawGhostHints(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  img: HTMLImageElement,
  cols: number,
  rows: number,
  alpha = 0.35,
) {
  const popMap = new Map<string, number>();
  const nowMs = performance.now();
  const debug: DebugFlags = { showGrid: false, showBounds: false, showIds: false };

  for (const p of pieces) {
    if (p.isPlaced) continue;

    const tileX = p.x + p.pad;
    const tileY = p.y + p.pad;
    const atTarget =
      Math.abs(tileX - p.targetX) <= 1 &&
      Math.abs(tileY - p.targetY) <= 1 &&
      p.rotation === p.targetRotation;

    if (atTarget) continue;

    const ghostPiece: Piece = {
      ...p,
      x: p.targetX - p.pad,
      y: p.targetY - p.pad,
      rotation: p.targetRotation,
    };

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
      ghostDpr,
    );
    ctx.restore();
  }
}
