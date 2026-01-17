// src/app/puzzle/canvas/pickPiece.ts
import type { Piece } from "@/puzzle/types";

/**
 * pickPieceId
 *
 * Hit test pieces by drawing their Path2D into the current canvas context.
 * We test in top-to-bottom order (highest z first), so you pick the top piece.
 *
 * Important:
 * - PlayScreen sets ctx.setTransform(dpr,0,0,dpr,0,0)
 * - That means all coords we receive are CSS pixels, and ctx hit testing matches.
 */
export function pickPieceId(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  x: number,
  y: number,
): string | null {
  const sorted = [...pieces].sort((a, b) => b.z - a.z);

  for (const p of sorted) {
    let path: Path2D | null = null;
    try {
      path = new Path2D(p.shapePath);
    } catch {
      path = null;
    }

    // Build the same transform stack as renderBoard uses
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);

    const hit = path
      ? ctx.isPointInPath(path, x, y)
      : isPointInRect(x, y, p.x, p.y, p.w, p.h);
    ctx.restore();

    if (hit) return p.id;
  }

  return null;
}

function isPointInRect(
  x: number,
  y: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}
