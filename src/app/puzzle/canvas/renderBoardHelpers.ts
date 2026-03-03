/**
 * Animation and overlay helpers for renderBoard.
 * Extracted to keep renderBoard.ts focused on the main rendering pipeline.
 */

import type { Piece } from "@/puzzle/types";

const SNAP_GLOW_MS = 180;

export function snapPopScale(tMs: number): number {
  if (tMs <= 0) return 1;
  if (tMs >= 150) return 1;

  if (tMs < 50) {
    const k = tMs / 50;
    return 1 + 0.12 * easeOutBack(k);
  }

  const k = (tMs - 50) / 100;
  return 1.12 - 0.12 * easeOutBounce(k);
}

/** Alpha for snap glow (0 = no glow, fades out over SNAP_GLOW_MS). */
export function snapGlowAlpha(elapsedMs: number): number {
  if (elapsedMs <= 0 || elapsedMs >= SNAP_GLOW_MS) return 0;
  return 0.14 * (1 - elapsedMs / SNAP_GLOW_MS);
}

/** Draw a subtle radial glow at (cx, cy). Used for snap/placement feedback. */
export function drawSnapGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
): void {
  if (alpha <= 0) return;
  ctx.save();
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255, 220, 130, ${alpha})`);
  gradient.addColorStop(0.5, `rgba(255, 200, 100, ${alpha * 0.4})`);
  gradient.addColorStop(1, "rgba(255, 200, 100, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

export type SnapParticle = { x: number; y: number; t0: number };

const SNAP_PARTICLE_MS = 450;

/** Draw small particles for neighbor-snap celebration. */
export function drawSnapParticles(
  ctx: CanvasRenderingContext2D,
  particles: SnapParticle[],
  nowMs: number,
): void {
  ctx.save();
  for (const p of particles) {
    const elapsed = nowMs - p.t0;
    if (elapsed >= SNAP_PARTICLE_MS) continue;
    const life = 1 - elapsed / SNAP_PARTICLE_MS;
    const alpha = 0.6 * life * life;
    const r = 3 + 4 * (1 - life);
    const drift = 8 * (1 - life);
    const angle = (p.t0 % 8) * 0.78;
    const dx = Math.cos(angle) * drift;
    const dy = Math.sin(angle) * drift;
    ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x + dx, p.y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
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

/** Lift offset (px) when dragging – subtle "pick up" effect. */
export const DRAG_LIFT_PX = 6;

/** Scale multiplier when dragging – piece feels physically lifted (1–2%). */
export const DRAG_SCALE = 1.02;

export function applyPieceShadow(
  ctx: CanvasRenderingContext2D,
  isDragging: boolean,
  isPlaced: boolean,
): void {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (isDragging) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;
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

/**
 * Seam-locked source rect: use shared pixel boundaries at tile edges so adjacent
 * pieces sample the same pixels at the seam (fixes misaligned eyes/features at borders).
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

  // Shared seam positions (one per tile boundary) so neighbors use the same pixel column/row
  const seamX = (c: number) => Math.round(c * srcTileW);
  const seamY = (r: number) => Math.round(r * srcTileH);

  const leftPadR = Math.round(leftPad);
  const rightPadR = Math.round(rightPad);
  const topPadR = Math.round(topPad);
  const bottomPadR = Math.round(bottomPad);

  let srcX = p.col === 0 ? 0 : seamX(p.col) - leftPadR;
  const srcRight = p.col === cols - 1 ? sourceW : seamX(p.col + 1) + rightPadR;
  let srcY = p.row === 0 ? 0 : seamY(p.row) - topPadR;
  const srcBottom = p.row === rows - 1 ? sourceH : seamY(p.row + 1) + bottomPadR;

  let srcW = srcRight - srcX;
  let srcH = srcBottom - srcY;
  let destX = 0;
  let destY = 0;
  let destW = p.w;
  let destH = p.h;

  // Clamp to image bounds
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
