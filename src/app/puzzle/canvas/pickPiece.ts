// src/app/puzzle/canvas/pickPiece.ts
import type { Piece } from "@/puzzle/types";

/**
 * pickPieceId
 *
 * Hit test by rendering into an offscreen path and using isPointInPath.
 * Assumes the same transform pipeline as renderBoard:
 * - ctx is already set so 1 unit equals 1 CSS pixel.
 */
export function pickPieceId(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  x: number,
  y: number,
): string | null {
  // topmost first
  const sorted = [...pieces].sort((a, b) => b.z - a.z);

  for (const p of sorted) {
    let path: Path2D | null = null;
    try {
      path = new Path2D(p.shapePath);
    } catch {
      path = null;
    }

    ctx.save();

    // Match renderBoard transforms
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);

    if (path) {
      if (ctx.isPointInPath(path, x, y)) {
        ctx.restore();
        return p.id;
      }
    } else {
      // fallback to rect hit test
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
        ctx.restore();
        return p.id;
      }
    }

    ctx.restore();
  }

  return null;
}
