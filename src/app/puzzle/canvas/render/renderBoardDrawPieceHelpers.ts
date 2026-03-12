/**
 * Helpers for piece drawing: Path2D-based silhouette pipeline.
 * Single path used for: shadow, clip+image, stroke. No SVG clipPath.
 */
import type { Piece } from "@/puzzle/core/types";
import type { ImageSourceRect } from "@/puzzle/canvas/utils/renderBoardHelpers";
import { DRAG_LIFT_PX } from "@/puzzle/canvas/utils/renderBoardHelpers";
import { drawWrongRotationIcon, drawLockGlow } from "./renderBoardDrawOverlays";

/** Outer stroke style: single outline, rounded joins, no duplicate passes. */
const OUTLINE_STROKE_STYLE = "rgba(0,0,0,0.45)";
const OUTLINE_LINE_WIDTH = 1.75;

/**
 * Draw a soft drop shadow that follows the piece silhouette (path only).
 * Call before clip+drawImage so shadow sits behind the piece.
 */
export function drawSilhouetteShadow(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  isDragging: boolean,
  isPlaced: boolean,
): void {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (isDragging) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;
  } else if (!isPlaced) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }
  if (isDragging || !isPlaced) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill(path);
  }
  ctx.restore();
}

/**
 * Clip by path and draw the piece image. Same Path2D as stroke – no mismatch.
 * Call after shadow, then stroke(path) after restore.
 */
export function drawPieceImageInPath(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  img: HTMLImageElement,
  rect: ImageSourceRect,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clip(path);
  ctx.drawImage(
    img,
    rect.srcX,
    rect.srcY,
    rect.srcW,
    rect.srcH,
    rect.destX,
    rect.destY,
    rect.destW,
    rect.destH,
  );
  ctx.restore();
}

/**
 * Single outline stroke using the same path. Rounded joins; one pass only.
 * No stroke for placed/locked pieces.
 */
export function strokePieceOutline(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  isDragging: boolean,
  isSelected: boolean,
  isPlaced: boolean,
  locked: boolean,
  _showClusterOutline?: boolean,
): void {
  if (isPlaced || locked) return;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (isDragging) {
    ctx.strokeStyle = "rgba(102, 126, 234, 0.6)";
    ctx.lineWidth = OUTLINE_LINE_WIDTH;
  } else if (isSelected) {
    ctx.strokeStyle = "#667eea";
    ctx.lineWidth = OUTLINE_LINE_WIDTH;
  } else {
    ctx.strokeStyle = OUTLINE_STROKE_STYLE;
    ctx.lineWidth = OUTLINE_LINE_WIDTH;
  }
  ctx.stroke(path);
}

/** Move ctx to piece-local space (rotation applied) for path-based drawing. */
function toPieceSpace(
  ctx: CanvasRenderingContext2D,
  cacheW: number,
  cacheH: number,
  p: Piece,
): void {
  ctx.translate(cacheW / 2, cacheH / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.translate(-p.w / 2, -p.h / 2);
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
): void {
  ctx.save();
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

  ctx.save();
  toPieceSpace(ctx, cacheW, cacheH, p);
  drawSilhouetteShadow(ctx, path, isDragging, p.isPlaced);
  ctx.restore();

  ctx.drawImage(cacheCanvas, 0, 0, cachePxW, cachePxH, 0, 0, cacheW, cacheH);

  ctx.save();
  toPieceSpace(ctx, cacheW, cacheH, p);
  strokePieceOutline(
    ctx,
    path,
    isDragging,
    isSelected,
    p.isPlaced,
    p.locked,
    showClusterOutline,
  );
  if (showLockGlow) drawLockGlow(ctx, path, lockElapsedMs);
  if (showWrongRotationHint) {
    drawWrongRotationIcon(
      ctx,
      p.w / 2 - 14,
      14,
      Math.min(p.w, p.h),
      wrongRotationElapsedMs,
    );
  }
  ctx.restore();

  ctx.restore();
}
