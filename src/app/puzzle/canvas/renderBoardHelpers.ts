/**
 * Animation and overlay helpers for renderBoard.
 * Extracted to keep renderBoard.ts focused on the main rendering pipeline.
 */

import type { Piece } from "@/puzzle/types";

export function snapPopScale(tMs: number): number {
  if (tMs <= 0) return 1;
  if (tMs >= 200) return 1;

  if (tMs < 80) {
    const k = tMs / 80;
    return 1 + 0.1 * easeOutBack(k);
  }

  const k = (tMs - 80) / 120;
  return 1.1 - 0.1 * easeOutBounce(k);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutBounce(t: number): number {
  if (t < 0.5) return 2 * t * t;
  return 1 - 2 * (1 - t) * (1 - t);
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Interpolate from start to end over durationMs, returns current value at elapsedMs */
export function interpolateSnapPosition(
  from: number,
  to: number,
  elapsedMs: number,
  durationMs: number = 180,
): number {
  if (elapsedMs >= durationMs) return to;
  const k = Math.min(1, elapsedMs / durationMs);
  return from + (to - from) * easeOutCubic(k);
}

export function drawDebugBackdrop(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.02)";
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.restore();
}

export function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;

  const step = 40;
  for (let x = 0; x <= cssW; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cssH);
    ctx.stroke();
  }
  for (let y = 0; y <= cssH; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cssW, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function applyPieceShadow(
  ctx: CanvasRenderingContext2D,
  isDragging: boolean,
  isPlaced: boolean,
): void {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (isDragging) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
  } else if (!isPlaced) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }
}

export function clearPieceShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export type ImageSourceRect = {
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  destX: number;
  destY: number;
  destW: number;
  destH: number;
};

export function computeImageSourceRect(
  p: Piece,
  img: HTMLImageElement,
  cols: number,
  rows: number,
): ImageSourceRect {
  const sourceW = img.naturalWidth;
  const sourceH = img.naturalHeight;
  const srcTileW = sourceW / cols;
  const srcTileH = sourceH / rows;
  const srcPadX = (p.pad / p.tileW) * srcTileW;
  const srcPadY = (p.pad / p.tileH) * srcTileH;
  let srcX = p.col * srcTileW - srcPadX;
  let srcY = p.row * srcTileH - srcPadY;
  let srcW = srcTileW + srcPadX * 2;
  let srcH = srcTileH + srcPadY * 2;
  let destX = 0;
  let destY = 0;
  let destW = p.w;
  let destH = p.h;
  if (srcX < 0) {
    destX = (-srcX / srcW) * p.w;
    destW = p.w - destX;
    srcW = srcW + srcX;
    srcX = 0;
  }
  if (srcY < 0) {
    destY = (-srcY / srcH) * p.h;
    destH = p.h - destY;
    srcH = srcH + srcY;
    srcY = 0;
  }
  if (srcX + srcW > sourceW) {
    destW *= (sourceW - srcX) / srcW;
    srcW = sourceW - srcX;
  }
  if (srcY + srcH > sourceH) {
    destH *= (sourceH - srcY) / srcH;
    srcH = sourceH - srcY;
  }
  return { srcX, srcY, srcW, srcH, destX, destY, destW, destH };
}
