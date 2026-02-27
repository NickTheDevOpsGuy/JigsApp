/**
 * Piece and overlay drawing helpers used by renderBoard.
 * Piece drawing (drawPiece, drawGhostHints) lives in renderBoardDrawPiece.ts.
 */
import type { Piece } from "@/puzzle/types";
import { drawPiece, drawGhostHints } from "./renderBoardDrawPiece";

export { drawPiece, drawGhostHints };

export function drawEdgePieceHighlight(ctx: CanvasRenderingContext2D, p: Piece) {
  let path: Path2D | null = null;
  try {
    if (p.shapePath && p.shapePath.length > 0) path = new Path2D(p.shapePath);
  } catch {
    path = null;
  }
  if (!path) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "rgba(102, 126, 234, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.translate(-p.w / 2, -p.h / 2);
  ctx.stroke(path);
  ctx.restore();
}

export function drawCompletionGlow(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  elapsedMs: number,
) {
  if (elapsedMs > 3000) return;

  const fadeOut = Math.max(0, 1 - elapsedMs / 3000);
  const pulse = 0.5 + 0.5 * Math.sin(elapsedMs / 200);
  const flourish = elapsedMs < 300 ? 0.2 * (1 - elapsedMs / 300) : 0;
  const alpha = Math.min(0.35, flourish + 0.08 * fadeOut * pulse);

  ctx.save();

  const gradient = ctx.createRadialGradient(
    cssW / 2,
    cssH / 2,
    0,
    cssW / 2,
    cssH / 2,
    Math.max(cssW, cssH) / 2,
  );
  gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.restore();
}
