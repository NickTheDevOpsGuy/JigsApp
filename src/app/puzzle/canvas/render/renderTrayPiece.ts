/**
 * renderTrayPiece – render single piece to offscreen canvas for tray thumbnails.
 */
import type { Piece } from "@/puzzle/core/types";
import { computeImageSourceRect } from "@/puzzle/canvas/utils/renderBoardHelpers";

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
  // Extra padding in CANVAS pixels (after scaling) to prevent clipping
  const CANVAS_PAD = 4;

  const maxDim = Math.max(piece.w, piece.h);
  // Calculate scaled piece size, then add padding in canvas pixels
  const scaledSize = Math.ceil(maxDim * scale);
  const canvasSize = scaledSize + CANVAS_PAD * 2;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

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
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  // Transform order:
  // 1. Move to canvas center (in canvas pixels)
  // 2. Scale
  // 3. Rotate
  // 4. Offset to center the piece

  const canvasCenterX = canvasSize / 2;
  const canvasCenterY = canvasSize / 2;

  ctx.translate(canvasCenterX, canvasCenterY);
  ctx.scale(scale, scale);
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

  // Keep outline nearly invisible to avoid noticeable edge lines.
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 0.8 / scale;
  ctx.stroke(path);

  return canvas;
}
