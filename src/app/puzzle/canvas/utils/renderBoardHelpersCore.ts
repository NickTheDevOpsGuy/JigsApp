/**
 * Animation and overlay helpers for renderBoard.
 * Snap/glow/particle helpers live in renderBoardHelpersGlow.ts.
 */
export * from "./renderBoardHelpersGlow";
import type { Piece } from "@/puzzle/core/types";

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

/** Very subtle alignment grid matching puzzle piece boundaries. Helps spatial orientation. */
export function drawAlignmentGrid(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  tileW: number,
  tileH: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;

  const w = cols * tileW;
  const h = rows * tileH;
  for (let c = 0; c <= cols; c++) {
    const x = c * tileW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = r * tileH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Lift offset (px) when dragging – piece feels elevated and tactile. */
export const DRAG_LIFT_PX = 10;

/** Scale when dragging (~1.04) – piece lift, render above others. */
export const DRAG_SCALE = 1.04;

export function applyPieceShadow(
  ctx: CanvasRenderingContext2D,
  isDragging: boolean,
  isPlaced: boolean,
): void {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (isDragging) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
  } else if (!isPlaced) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
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

/**
 * Seam-locked source rect:
 * Keep shared tile boundaries in source-space with subpixel precision so adjacent
 * pieces sample continuously across seams (prevents facial-feature wobble at joins).
 */
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
  const leftPad = p.col === 0 ? 0 : srcPadX;
  const rightPad = p.col === cols - 1 ? 0 : srcPadX;
  const topPad = p.row === 0 ? 0 : srcPadY;
  const bottomPad = p.row === rows - 1 ? 0 : srcPadY;

  // Shared seam positions (one per tile boundary) so neighbors use identical boundaries.
  // Do not round here: integer snapping can make per-row/col scaling drift on non-divisible images.
  const seamX = (c: number) => c * srcTileW;
  const seamY = (r: number) => r * srcTileH;

  let srcX = p.col === 0 ? 0 : seamX(p.col) - leftPad;
  const srcRight = p.col === cols - 1 ? sourceW : seamX(p.col + 1) + rightPad;
  let srcY = p.row === 0 ? 0 : seamY(p.row) - topPad;
  const srcBottom = p.row === rows - 1 ? sourceH : seamY(p.row + 1) + bottomPad;

  let srcW = srcRight - srcX;
  let srcH = srcBottom - srcY;
  // On outer flat edges, the pad region is not visible (path starts/ends at tile edge).
  // Exclude that hidden region so visible pixels keep the same scale across all pieces.
  let destX = p.col === 0 ? p.pad : 0;
  let destY = p.row === 0 ? p.pad : 0;
  let destW = p.w - (p.col === 0 ? p.pad : 0) - (p.col === cols - 1 ? p.pad : 0);
  let destH = p.h - (p.row === 0 ? p.pad : 0) - (p.row === rows - 1 ? p.pad : 0);

  /* Bleed across seams so adjacent pieces meet without visible gaps at any DPR. */
  const srcBleed = 1.2;
  const destBleed = 1;
  if (p.col > 0) {
    srcX -= srcBleed;
    srcW += srcBleed;
    destX -= destBleed;
    destW += destBleed;
  }
  if (p.col < cols - 1) {
    srcW += srcBleed;
    destW += destBleed;
  }
  if (p.row > 0) {
    srcY -= srcBleed;
    srcH += srcBleed;
    destY -= destBleed;
    destH += destBleed;
  }
  if (p.row < rows - 1) {
    srcH += srcBleed;
    destH += destBleed;
  }

  // Clamp to image bounds
  if (srcX < 0) {
    const k = -srcX / srcW;
    destX += destW * k;
    destW *= 1 - k;
    srcW = srcW + srcX;
    srcX = 0;
  }
  if (srcY < 0) {
    const k = -srcY / srcH;
    destY += destH * k;
    destH *= 1 - k;
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
