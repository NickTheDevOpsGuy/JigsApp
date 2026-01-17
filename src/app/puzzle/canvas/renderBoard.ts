// src/app/puzzle/canvas/renderBoard.ts
import type { Piece, PuzzleState } from "@/puzzle/types";

export type PopMap = Map<string, number>;

/**
 * renderBoard
 *
 * Canvas-only rendering pipeline.
 * Draw order is by z (lowest -> highest).
 *
 * Coordinates are CSS pixels because PlayScreen sets:
 *   ctx.setTransform(dpr,0,0,dpr,0,0)
 */
export function renderBoard(
  ctx: CanvasRenderingContext2D,
  state: PuzzleState,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  popMap: PopMap,
  nowMs: number,
  debug: { showGrid: boolean; showBounds: boolean; showIds: boolean },
) {
  const canvas = ctx.canvas;

  // Clear the visible CSS pixel area (not device pixels)
  const cssW = canvas.width / (window.devicePixelRatio || 1);
  const cssH = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, cssW, cssH);

  if (debug.showGrid) drawDebugBackdrop(ctx, cssW, cssH);

  if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "14px system-ui";
    ctx.fillText("Image not ready…", 16, 24);
    ctx.restore();
    return;
  }

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
  debug: { showGrid: boolean; showBounds: boolean; showIds: boolean },
) {
  const start = popMap.get(p.id);
  const scale = start ? snapPopScale(nowMs - start) : 1;

  let path: Path2D | null = null;
  try {
    path = new Path2D(p.shapePath);
  } catch {
    path = null;
  }

  ctx.save();

  // Centered rotation
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Local coords
  ctx.translate(-p.w / 2, -p.h / 2);

  if (path) {
    ctx.save();
    ctx.clip(path);

    const imgX = -p.targetX + p.pad;
    const imgY = -p.targetY + p.pad;

    ctx.drawImage(img, imgX, imgY, assembledW, assembledH);
    ctx.restore();

    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke(path);
  } else {
    // Fallback rectangle
    ctx.fillStyle = "rgba(0, 0, 255, 0.12)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.strokeRect(0, 0, p.w, p.h);
  }

  if (debug.showBounds) {
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, p.w, p.h);
  }

  if (debug.showIds) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.font = "12px system-ui";
    ctx.fillText(p.id, 8, 16);
  }

  ctx.restore();
}

function snapPopScale(tMs: number) {
  if (tMs <= 0) return 1;
  if (tMs >= 170) return 1;

  if (tMs < 90) {
    const k = tMs / 90;
    return 1 + 0.08 * k;
  }

  const k = (tMs - 90) / 80;
  return 1.08 - 0.08 * k;
}

function drawDebugBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
