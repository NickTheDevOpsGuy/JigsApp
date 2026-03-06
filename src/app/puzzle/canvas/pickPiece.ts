/**
 * pickPiece – hit test by isPointInPath; returns topmost piece at (x,y).
 */
import type { Piece } from "@/puzzle/types";
import { sortPiecesForHitTest } from "./pieceDrawOrder";

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
  options?: { hitSlopPx?: number },
): string | null {
  const hitSlopPx = Math.max(0, options?.hitSlopPx ?? 2);
  // Topmost first in the exact inverse of draw order.
  const sorted = sortPiecesForHitTest(pieces);

  for (const p of sorted) {
    // Skip pieces in tray
    if (p.inTray) continue;

    let path: Path2D | null = null;
    try {
      if (p.shapePath && p.shapePath.length > 0) {
        path = new Path2D(p.shapePath);
      }
    } catch {
      path = null;
    }

    ctx.save();

    // Match renderBoard transforms exactly
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);

    // Transform screen point into piece-local coordinates once so we can
    // fall back to rect hit testing when a complex path misses on some devices.
    const localX = x - (p.x + p.w / 2);
    const localY = y - (p.y + p.h / 2);
    const angle = -(p.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotX = localX * cos - localY * sin;
    const rotY = localX * sin + localY * cos;
    const pieceLocalX = rotX + p.w / 2;
    const pieceLocalY = rotY + p.h / 2;

    let hit = false;

    if (path) {
      // Use isPointInPath with the transformed context
      // The point (x, y) is in canvas space, but isPointInPath
      // tests against the path in the current transform.
      // We need to transform the point INTO the local space.
      hit = ctx.isPointInPath(path, x, y);
      if (!hit) {
        // Tolerate tiny path precision misses on mobile browsers.
        const tolerance = hitSlopPx;
        hit =
          pieceLocalX >= -tolerance &&
          pieceLocalX <= p.w + tolerance &&
          pieceLocalY >= -tolerance &&
          pieceLocalY <= p.h + tolerance;
      }
    } else {
      // Fallback to rect hit test
      hit =
        pieceLocalX >= -hitSlopPx &&
        pieceLocalX <= p.w + hitSlopPx &&
        pieceLocalY >= -hitSlopPx &&
        pieceLocalY <= p.h + hitSlopPx;
    }

    ctx.restore();

    if (hit) {
      return p.id;
    }
  }

  return null;
}
