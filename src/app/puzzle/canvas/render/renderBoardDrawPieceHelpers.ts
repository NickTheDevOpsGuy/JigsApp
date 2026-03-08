/**
 * Helpers for piece drawing: stroke outline and cached piece blit.
 * Used by renderBoardDrawPiece.ts.
 */
import type { Piece } from "@/puzzle/core/types";
import {
  applyPieceShadow,
  clearPieceShadow,
  DRAG_LIFT_PX,
} from "@/puzzle/canvas/utils/renderBoardHelpers";
import { drawWrongRotationIcon, drawLockGlow } from "./renderBoardDrawOverlays";

export function strokePieceOutline(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  isDragging: boolean,
  isSelected: boolean,
  isPlaced: boolean,
  locked: boolean,
  _showClusterOutline?: boolean,
) {
  if (isDragging) {
    ctx.strokeStyle = "rgba(102, 126, 234, 0.6)";
    ctx.lineWidth = 2;
  } else if (isPlaced || locked) {
    /* No outline for placed/snapped pieces – snapping only, no green fill */
    return;
  } else {
    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 0.85;
  }
  ctx.stroke(path);
}

export function drawCachedPiece(
  ctx: CanvasRenderingContext2D,
  p: Piece,
  cacheCanvas: HTMLCanvasElement,
  cacheW: number,
  cacheH: number,
  cachePxW: number,
  cachePxH: number,
  scale: number,
  isDragging: boolean,
  isSelected: boolean,
  showLockGlow: boolean,
  lockElapsedMs: number,
  path: Path2D,
  dpr: number,
  shakeX: number = 0,
  shakeY: number = 0,
  showWrongRotationHint: boolean = false,
  wrongRotationElapsedMs: number = 0,
  showClusterOutline?: boolean,
) {
  ctx.save();
  applyPieceShadow(ctx, isDragging, p.isPlaced);
  let cx = p.x + p.w / 2 + shakeX;
  let cy = p.y + p.h / 2 + shakeY;
  if (isDragging) {
    cx = Math.round(cx * dpr) / dpr;
    cy = Math.round(cy * dpr) / dpr;
    cy -= DRAG_LIFT_PX;
  }
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cacheW / 2, -cacheH / 2);
  ctx.drawImage(cacheCanvas, 0, 0, cachePxW, cachePxH, 0, 0, cacheW, cacheH);
  clearPieceShadow(ctx);
  if (isDragging || isSelected) {
    ctx.translate(cacheW / 2, cacheH / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);
    ctx.strokeStyle = isDragging ? "rgba(102, 126, 234, 0.6)" : "#667eea";
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
  } else if ((p.isPlaced || p.locked) && showClusterOutline) {
    ctx.translate(cacheW / 2, cacheH / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);
    strokePieceOutline(ctx, path, false, false, true, p.locked, true);
  }
  if (showLockGlow) {
    ctx.translate(cacheW / 2, cacheH / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);
    drawLockGlow(ctx, path, lockElapsedMs);
  }
  if (showWrongRotationHint) {
    const iconX = cacheW / 2 - 14;
    const iconY = -cacheH / 2 + 14;
    drawWrongRotationIcon(ctx, iconX, iconY, Math.min(p.w, p.h), wrongRotationElapsedMs);
  }
  ctx.restore();
}
