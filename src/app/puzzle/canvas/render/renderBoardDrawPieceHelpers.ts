/**
 * Helpers for piece drawing: Path2D-based silhouette pipeline.
 * Single path used for: shadow, clip+image, stroke. No SVG clipPath.
 */
import type { Piece } from "@/puzzle/core/types";
import type { ImageSourceRect } from "@/puzzle/canvas/utils/renderBoardHelpers";
import { DRAG_LIFT_PX } from "@/puzzle/canvas/utils/renderBoardHelpers";
import { drawWrongRotationIcon, drawLockGlow } from "./renderBoardDrawOverlays";

/** Outer stroke: crisp jigsaw silhouette; rounded joins for natural tabs/sockets. */
const OUTLINE_STROKE_STYLE = "rgba(0,0,0,0.56)";
const OUTLINE_LINE_WIDTH = 1.85;

function getPieceSurfaceVariation(piece: Piece): {
  brightness: number;
  saturation: number;
} {
  const seed = (piece.row + 1) * 97 + (piece.col + 1) * 193;
  const normalized = ((Math.sin(seed * 12.9898) + 1) / 2) * 2 - 1;
  return {
    brightness: 1 + normalized * 0.02,
    saturation: 1 + normalized * 0.01,
  };
}

/**
 * Draw a soft drop shadow that follows the piece silhouette (path only).
 * Idle: soft small shadow. Dragging: slightly larger shadow for lift. Placed: minimal shadow.
 * Suggests cardboard thickness without heavy 3D.
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
    ctx.shadowColor = "rgba(0, 0, 0, 0.52)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetX = 12;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill(path);
  } else if (!isPlaced) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.26)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fill(path);
  } else {
    ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fill(path);
  }
  ctx.restore();
}

/**
 * Clip by path and draw the piece image. Same Path2D as stroke – no mismatch.
 * When isPlacedOrLocked, skip edge strokes so adjacent pieces meet seamlessly (no gaps).
 */
export function drawPieceImageInPath(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  img: HTMLImageElement,
  rect: ImageSourceRect,
  piece: Piece,
  isPlacedOrLocked: boolean = false,
): void {
  const variation = getPieceSurfaceVariation(piece);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clip(path);
  ctx.filter = `brightness(${variation.brightness}) saturate(${variation.saturation})`;
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
  ctx.filter = "none";

  if (isPlacedOrLocked) {
    /* Placed/locked: no edge strokes so pieces meet with no visible seam. */
    ctx.restore();
    return;
  }

  /* Unplaced: soft highlight and bevel so piece reads as physical jigsaw. */
  const topGlow = ctx.createLinearGradient(0, 0, 0, piece.h);
  topGlow.addColorStop(0, "rgba(255,255,255,0.18)");
  topGlow.addColorStop(0.05, "rgba(255,255,255,0.08)");
  topGlow.addColorStop(0.35, "rgba(255,255,255,0)");
  ctx.fillStyle = topGlow;
  ctx.fill(path);

  const bevelShade = ctx.createLinearGradient(0, 0, 0, piece.h);
  bevelShade.addColorStop(0, "rgba(0,0,0,0)");
  bevelShade.addColorStop(0.55, "rgba(0,0,0,0.06)");
  bevelShade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = bevelShade;
  ctx.fill(path);

  /* Edge shading: light top-left to dark bottom-right so tabs/sockets feel natural */
  const edgeShade = ctx.createLinearGradient(0, 0, piece.w, piece.h);
  edgeShade.addColorStop(0, "rgba(255,255,255,0.06)");
  edgeShade.addColorStop(0.4, "rgba(0,0,0,0.05)");
  edgeShade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.strokeStyle = edgeShade;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(path);

  const edgeRim = ctx.createLinearGradient(0, 0, piece.w, piece.h);
  edgeRim.addColorStop(0, "rgba(255,255,255,0.08)");
  edgeRim.addColorStop(0.5, "rgba(255,255,255,0)");
  edgeRim.addColorStop(1, "rgba(0,0,0,0.1)");
  ctx.strokeStyle = edgeRim;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(path);
  ctx.restore();
}

/**
 * Single outline stroke using the same path. Rounded joins; one pass only.
 * Placed/locked: no stroke so adjacent pieces meet seamlessly (no visible seam).
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
  /** Soft pulse alpha (0.98–1) when piece just snapped; 1 = no pulse */
  snapPulseAlpha: number = 1,
): void {
  ctx.save();
  let cx = p.x + p.w / 2 + shakeX;
  let cy = p.y + p.h / 2 + shakeY;
  const dragTiltDeg = isDragging ? ((p.row + p.col) % 2 === 0 ? -1.6 : 1.6) : 0;
  if (isDragging) {
    cx = Math.round(cx * dpr) / dpr;
    cy = Math.round(cy * dpr) / dpr;
    cy -= DRAG_LIFT_PX;
  }
  ctx.translate(cx, cy);
  if (dragTiltDeg !== 0) {
    ctx.rotate((dragTiltDeg * Math.PI) / 180);
  }
  ctx.scale(scale, scale);
  ctx.translate(-cacheW / 2, -cacheH / 2);

  ctx.save();
  toPieceSpace(ctx, cacheW, cacheH, p);
  drawSilhouetteShadow(ctx, path, isDragging, p.isPlaced);
  ctx.restore();

  if (snapPulseAlpha < 1) ctx.save();
  if (snapPulseAlpha < 1) ctx.globalAlpha *= snapPulseAlpha;
  ctx.drawImage(cacheCanvas, 0, 0, cachePxW, cachePxH, 0, 0, cacheW, cacheH);
  if (snapPulseAlpha < 1) ctx.restore();

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
