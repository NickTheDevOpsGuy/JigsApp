// src/app/puzzle/canvas/renderTrayPiece.ts
import type { Piece } from "@/puzzle/types";

/**
 * Render a single piece to a small canvas for use in the tray.
 * Returns an offscreen canvas that can be drawn or converted to data URL.
 */
export function renderTrayPiece(
  piece: Piece,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  scale: number = 0.5,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(piece.w * scale);
  canvas.height = Math.ceil(piece.h * scale);

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

  ctx.save();
  ctx.clip(path);

  // Calculate source slice (same logic as renderBoard)
  const sourceW = img.naturalWidth;
  const sourceH = img.naturalHeight;

  const cols = Math.round(assembledW / piece.tileW);
  const rows = Math.round(assembledH / piece.tileH);

  const srcTileW = sourceW / cols;
  const srcTileH = sourceH / rows;

  const srcPadX = (piece.pad / piece.tileW) * srcTileW;
  const srcPadY = (piece.pad / piece.tileH) * srcTileH;

  const srcX = piece.col * srcTileW - srcPadX;
  const srcY = piece.row * srcTileH - srcPadY;
  const srcW = srcTileW + srcPadX * 2;
  const srcH = srcTileH + srcPadY * 2;

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, piece.w, piece.h);
  ctx.restore();

  // Draw outline
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke(path);

  return canvas;
}