/**
 * renderTrayPiece – render single piece to offscreen canvas for tray thumbnails.
 */
import type { Piece } from "@/puzzle/types";
import { computeImageSourceRect } from "./renderBoardHelpers";

/**
 * Render a single piece to a small canvas for use in the tray.
 * Returns an offscreen canvas that can be drawn or converted to data URL.
 * Applies piece.rotation so the preview matches the board (e.g. drag preview).
 */
export function renderTrayPiece(
  piece: Piece,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  scale: number = 0.5,
): HTMLCanvasElement {
  // Canvas must fit rotated piece: 90°/270° swaps w/h
  const baseSize = Math.max(piece.w, piece.h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(baseSize * scale);
  canvas.height = Math.ceil(baseSize * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // Build clip path
  let path: Path2D | null = null;
  try {
    if (piece.shapePath && piece.shapePath.length > 0) {
      path = new Path2D(piece.shapePath);
    }
  } catch {
    path = null;
  }

  if (!path) {
    // Fallback rectangle
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fillRect(0, 0, piece.w, piece.h);
    return canvas;
  }

  // Apply rotation around piece center (same as renderBoard)
  const cx = baseSize / 2;
  const cy = baseSize / 2;
  ctx.translate(cx, cy);
  ctx.rotate((piece.rotation * Math.PI) / 180);
  ctx.translate(-piece.w / 2, -piece.h / 2);

  ctx.save();
  ctx.clip(path);

  const cols = Math.round(assembledW / piece.tileW);
  const rows = Math.round(assembledH / piece.tileH);
  const rect = computeImageSourceRect(piece, img, cols, rows);
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

  // Draw outline
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke(path);

  return canvas;
}
