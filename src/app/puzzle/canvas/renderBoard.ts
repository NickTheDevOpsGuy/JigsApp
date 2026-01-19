// src/app/puzzle/canvas/renderBoard.ts
import type { Piece, PuzzleState } from "@/puzzle/types";

export type PopMap = Map<string, number>;

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

const DEFAULT_DEBUG: DebugFlags = {
  showGrid: false,
  showBounds: false,
  showIds: false,
};

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  state: PuzzleState,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  popMap: PopMap,
  nowMs: number,
  debug?: DebugFlags,
) {
  const dbg = debug ?? DEFAULT_DEBUG;

  const dpr = window.devicePixelRatio || 1;
  const cssW = ctx.canvas.width / dpr;
  const cssH = ctx.canvas.height / dpr;

  ctx.clearRect(0, 0, cssW, cssH);

  if (dbg.showGrid) drawGrid(ctx, cssW, cssH);

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
    drawPiece(ctx, p, img, assembledW, assembledH, popMap, nowMs, dbg);
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
  dbg: { showBounds: boolean; showIds: boolean },
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
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-p.w / 2, -p.h / 2);

  if (!path) {
    ctx.fillStyle = "rgba(0, 0, 255, 0.12)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.strokeRect(0, 0, p.w, p.h);
    ctx.restore();
    return;
  }

  // Clip to silhouette then draw image slice
  ctx.save();
  ctx.clip(path);

  // IMPORTANT:
  // We draw the full assembled image so tabs/blanks show neighbor pixels (bleed).
  const imgX = -p.targetX + p.pad;
  const imgY = -p.targetY + p.pad;

  ctx.drawImage(img, imgX, imgY, assembledW, assembledH);
  ctx.restore();

  // Outline
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 1;
  ctx.stroke(path);

  if (dbg.showBounds) {
    ctx.strokeStyle = "rgba(255,0,0,0.35)";
    ctx.strokeRect(0, 0, p.w, p.h);
  }

  if (dbg.showIds) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
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

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.015)";
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
