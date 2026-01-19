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
 * Draw order is by z (lowest -> highest).
 *
 * Important:
 * - PlayScreen sets ctx.setTransform(dpr,0,0,dpr,0,0) so 1 unit == 1 CSS pixel.
 * - We clear in BACKING-STORE pixels (identity transform) to avoid ghosting.
 * - We round piece positions at draw time to avoid sub-pixel "double vision".
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

  // Clear in backing pixels (ignores current transform). Prevents trails/ghosting.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Debug backdrop so "blank canvas" is obvious
  drawDebugBackdrop(ctx);

  // If image still not ready, bail (but backdrop remains)
  if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "14px system-ui";
    ctx.fillText("Image not ready…", 16, 24);
    ctx.restore();
    return;
  }

  // Optional debug overlay
  if (debug.showGrid) drawGridOverlay(ctx);
  if (debug.showBounds) drawBoardBounds(ctx);

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

  // Build path
  let path: Path2D | null = null;
  try {
    path = new Path2D(p.shapePath);
  } catch {
    path = null;
  }

  // Round draw position to avoid sub-pixel blur/ghosting
  const px = Math.round(p.x);
  const py = Math.round(p.y);

  // Fallback if path invalid: draw a rect so you can still see pieces
  if (!path) {
    ctx.save();
    ctx.translate(px + p.w / 2, py + p.h / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0, 0, 255, 0.12)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);

    if (debug.showIds) {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.font = "12px system-ui";
      ctx.fillText(p.id, -p.w / 2 + 8, -p.h / 2 + 18);
    }

    ctx.restore();
    return;
  }

  // Draw using centered rotation so it matches how you rotate in DOM version
  ctx.save();

  ctx.translate(px + p.w / 2, py + p.h / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Piece-local coordinates (top-left of container)
  ctx.translate(-p.w / 2, -p.h / 2);

  // Clip to silhouette then draw image slice
  ctx.save();
  ctx.clip(path);

  // Slice math, pad-aware:
  // image position inside the piece container should be:
  //   imgX = -targetX + pad
  //   imgY = -targetY + pad
  //
  // Round to avoid shimmer when moving.
  const imgX = Math.round(-p.targetX + p.pad);
  const imgY = Math.round(-p.targetY + p.pad);

  // Draw the whole assembled image under the clip
  ctx.drawImage(img, imgX, imgY, assembledW, assembledH);

  ctx.restore();

  // Outline
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke(path);

  // Debug overlays per piece
  if (debug.showBounds) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, p.w, p.h);
    ctx.restore();
  }

  if (debug.showIds) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.font = "12px system-ui";
    ctx.fillText(p.id, 8, 16);
  }

  ctx.restore();
}

function snapPopScale(tMs: number) {
  if (tMs <= 0) return 1;
  if (tMs >= 170) return 1;

  // 0..90ms scale up, 90..170ms back down
  if (tMs < 90) {
    const k = tMs / 90;
    return 1 + 0.08 * k;
  }

  const k = (tMs - 90) / 80;
  return 1.08 - 0.08 * k;
}

function drawDebugBackdrop(ctx: CanvasRenderingContext2D) {
  // A subtle grid so you can visually confirm draw is happening
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.02)";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;

  const step = 40;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGridOverlay(ctx: CanvasRenderingContext2D) {
  // Draw a light overlay in CSS-pixel space (assumes PlayScreen setTransform(dpr,...))
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Convert backing pixels to CSS pixels using current transform scale
  // (We just draw anyway, it's only a debug aid)
  ctx.save();
  ctx.strokeStyle = "rgba(0, 120, 255, 0.18)";
  ctx.lineWidth = 1;

  const step = 80;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoardBounds(ctx: CanvasRenderingContext2D) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.restore();
}