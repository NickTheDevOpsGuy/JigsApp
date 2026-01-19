// src/app/puzzle/canvas/pickPiece.ts
import type { Piece } from "@/puzzle/types";

/**
 * pickPieceId
 *
 * Hit test: find the TOPMOST piece whose shape contains (x,y) in board space.
 * Assumes the canvas is drawn using the same transform as renderBoard:
 * - translate to piece center
 * - rotate
 * - scale pop
 * - translate back to local top-left
 * - Path2D created from p.shapePath is in piece-local coords
 */
export function pickPieceId(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  x: number,
  y: number,
) {
  const sorted = [...pieces].sort((a, b) => b.z - a.z);

  for (const p of sorted) {
    let path: Path2D | null = null;
    try {
      path = new Path2D(p.shapePath);
    } catch {
      path = null;
    }

    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);

    const hit = path
      ? ctx.isPointInPath(path, x, y)
      : x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h;
    ctx.restore();

    if (hit) return p.id;
  }

  return null;
}
