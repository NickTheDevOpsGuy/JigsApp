/**
 * pickPiece – fast topmost hit test for board pieces.
 */
import type { Piece } from "@/puzzle/core/types";
import { sortPiecesForHitTest } from "./pieceDrawOrder";

/**
 * pickPieceId
 *
 * Hit test against the rotated piece container. This preserves the previous
 * fallback behavior while avoiding per-pointer Path2D rebuilds on hot paths.
 * Assumes the same transform pipeline as renderBoard:
 * - ctx is already set so 1 unit equals 1 CSS pixel.
 */
export function pickPieceId(
  _ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  x: number,
  y: number,
  options?: { hitSlopPx?: number },
): string | null {
  const hitSlopPx = Math.max(0, options?.hitSlopPx ?? 2);
  const candidates: Piece[] = [];
  for (const p of pieces) {
    if (p.inTray) continue;
    const centerX = p.x + p.w / 2;
    const centerY = p.y + p.h / 2;
    const radius = Math.hypot(p.w, p.h) / 2 + hitSlopPx;
    if (Math.abs(x - centerX) > radius || Math.abs(y - centerY) > radius) continue;
    candidates.push(p);
  }
  if (candidates.length === 0) return null;

  // Topmost first in the exact inverse of draw order.
  const sorted = sortPiecesForHitTest(candidates);

  for (const p of sorted) {
    // Transform screen point into piece-local coordinates once so we can
    // test the same rotated container used by the previous fallback path.
    const localX = x - (p.x + p.w / 2);
    const localY = y - (p.y + p.h / 2);
    const angle = -(p.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotX = localX * cos - localY * sin;
    const rotY = localX * sin + localY * cos;
    const pieceLocalX = rotX + p.w / 2;
    const pieceLocalY = rotY + p.h / 2;

    if (
      pieceLocalX >= -hitSlopPx &&
      pieceLocalX <= p.w + hitSlopPx &&
      pieceLocalY >= -hitSlopPx &&
      pieceLocalY <= p.h + hitSlopPx
    ) {
      return p.id;
    }
  }

  return null;
}
