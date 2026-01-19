// src/app/puzzle/canvas/renderBoard.ts
import type { Piece, PuzzleState } from "@/puzzle/types";

export type PopMap = Map<string, number>;

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

/**
 * renderBoard
 *
 * Canvas-only rendering pipeline.
 *
 * Key rules to avoid flicker:
 * - Clear in BACKING STORE pixels using identity transform.
 * - Draw everything else in CSS pixels (PlayScreen sets ctx.setTransform(dpr,...)).
 * - Any overlay/backdrop/grid should use cssW/cssH (canvas.width / dpr).
 */
export function renderBoard(
  ctx: CanvasRenderingContext2D,
  state: PuzzleState,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  popMap: PopMap,
  nowMs: number,
  debug: DebugFlags,
) {
  const canvas = ctx.canvas;

  // 1) Clear in backing pixels with identity transform (prevents "double vision" artifacts)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 2) Derive CSS-space size from current transform (PlayScreen should setTransform(dpr,...))
  const t = ctx.getTransform();
  const dpr = t.a || 1; // scaleX
  const cssW = canvas.width / dpr;
  const cssH = canvas.height / dpr;

  // 3) Backdrop + optional overlays in CSS pixels
  drawDebugBackdrop(ctx, cssW, cssH);

  if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "14px system-ui";
    ctx.fillText("Image not ready…", 16, 24);
    ctx.restore();
    return;
  }

  if (debug.showGrid) drawGridOverlay(ctx, cssW, cssH);

  // Draw order by z (lowest -> highest)
  const pieces = [...state.pieces].sort((a, b) => a.z - b.z);

  for (const p of pieces) {
    drawPiece(ctx, p, img, assembledW, assembledH, popMap, nowMs, debug);
  }
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  p: Piece,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  popMap: PopMap,
  nowMs: number,
  debug: DebugFlags,
) {
  // Pop animation scale (draw-time)
  const start = popMap.get(p.id);
  const scale = start ? snapPopScale(nowMs - start) : 1;

  // Build path (piece-local viewBox coordinates: 0..w,0..h)
  let path: Path2D | null = null;
  try {
    if (!p.shapePath || p.shapePath.length === 0) {
      console.warn(`[Phuzzle] Piece ${p.id} has empty shapePath`);
    } else {
      path = new Path2D(p.shapePath);
    }
  } catch (err) {
    console.error(`[Phuzzle] Failed to parse shapePath for ${p.id}:`, p.shapePath, err);
    path = null;
  }

  ctx.save();

  // Centered rotation + scale around piece center
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Move to top-left of piece-local space
  ctx.translate(-p.w / 2, -p.h / 2);

  if (!path) {
    // Fallback: draw a rect so the piece is still visible if path is bad
    ctx.fillStyle = "rgba(0, 120, 255, 0.10)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.strokeRect(0, 0, p.w, p.h);

    if (debug.showIds) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.font = "12px system-ui";
      ctx.fillText(p.id, 8, 16);
    }

    ctx.restore();
    return;
  }

  // Clip to silhouette then draw image slice
  ctx.save();
  ctx.clip(path);

  // Slice math, pad-aware:
  // Image is drawn in "assembled space" under the piece clip.
  // The piece container's tile top-left is (pad,pad) in piece-local space.
  // We want tile-local position to align with assembled targetX/targetY.
  const imgX = -p.targetX + p.pad;
  const imgY = -p.targetY + p.pad;

  ctx.drawImage(img, imgX, imgY, assembledW, assembledH);
  ctx.restore();

  // Outline
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke(path);

  if (debug.showBounds) {
    ctx.strokeStyle = "rgba(255,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, p.w, p.h);
  }

  if (debug.showIds) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.font = "12px system-ui";
    ctx.fillText(p.id, 8, 16);
  }

  ctx.restore();
}

function snapPopScale(tMs: number) {
  // Quick up then back
  if (tMs <= 0) return 1;
  if (tMs >= 170) return 1;

  if (tMs < 90) {
    const k = tMs / 90; // 0..1
    return 1 + 0.08 * k;
  }

  const k = (tMs - 90) / 80; // 0..1
  return 1.08 - 0.08 * k;
}

function drawDebugBackdrop(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
  // Subtle background so you can see the canvas is alive (CSS pixel space)
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.02)";
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.restore();
}

function drawGridOverlay(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
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
