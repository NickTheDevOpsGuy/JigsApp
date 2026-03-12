/**
 * renderTrayPiece – render single piece to offscreen canvas for tray thumbnails.
 * Uses the same Path2D pipeline as the board: one path for clip, image, and stroke.
 */
import type { Piece } from "@/puzzle/core/types";
import { computeImageSourceRect } from "@/puzzle/canvas/utils/renderBoardHelpers";
import {
  drawSilhouetteShadow,
  drawPieceImageInPath,
  strokePieceOutline,
} from "./renderBoardDrawPieceHelpers";

export type RenderTrayPieceOptions = {
  /** When true, render as solid color + black outline only (no image). For debugging silhouettes. */
  debugSilhouette?: boolean;
};

/**
 * Render a single piece to a small canvas for use in the tray.
 * Same Path2D silhouette as board: clip(path) → drawImage → stroke(path).
 */
export function renderTrayPiece(
  piece: Piece,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  scale: number = 0.5,
  options: RenderTrayPieceOptions = {},
): HTMLCanvasElement {
  const CANVAS_PAD = 4;
  const maxDim = Math.max(piece.w, piece.h);
  const scaledSize = Math.ceil(maxDim * scale);
  const canvasSize = scaledSize + CANVAS_PAD * 2;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  let path: Path2D | null = null;
  try {
    if (piece.shapePath && piece.shapePath.length > 0) {
      path = new Path2D(piece.shapePath);
    }
  } catch {
    path = null;
  }

  if (!path) {
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  const canvasCenterX = canvasSize / 2;
  const canvasCenterY = canvasSize / 2;
  ctx.translate(canvasCenterX, canvasCenterY);
  ctx.scale(scale, scale);
  ctx.rotate((piece.rotation * Math.PI) / 180);
  ctx.translate(-piece.w / 2, -piece.h / 2);

  if (options.debugSilhouette) {
    ctx.fillStyle = "rgba(180, 200, 220, 0.9)";
    ctx.fill(path);
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(path);
    return canvas;
  }

  drawSilhouetteShadow(ctx, path, false, piece.isPlaced);
  const cols = Math.round(assembledW / piece.tileW);
  const rows = Math.round(assembledH / piece.tileH);
  const rect = computeImageSourceRect(piece, img, cols, rows);
  drawPieceImageInPath(ctx, path, img, rect);
  strokePieceOutline(ctx, path, false, false, piece.isPlaced, piece.locked);

  return canvas;
}
