/**
 * Piece and overlay drawing helpers used by renderBoard.
 * Piece drawing (drawPiece, drawGhostHints) lives in renderBoardDrawPiece.ts.
 */
import type { Piece, PuzzleState } from "@/puzzle/types";
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

const COMPLETION_GLOW_DURATION_MS = 400;
const COMPLETION_GLOW_ROW_FADE_MS = 120;
const COMPLETION_GLOW_MAX_ALPHA = 0.28;
const COMPLETION_GLOW_TOTAL_MS = 2400;

/**
 * Draw a wave of soft glow that ripples across the board row by row.
 * Each row fades in over ~120ms; full wave over ~400ms. Then gentle fade out.
 */
export function drawCompletionGlow(
  ctx: CanvasRenderingContext2D,
  _cssW: number,
  _cssH: number,
  elapsedMs: number,
  state?: PuzzleState,
  offsetX: number = 0,
  offsetY: number = 0,
) {
  if (elapsedMs > COMPLETION_GLOW_TOTAL_MS) return;

  const rows = state?.grid?.rows ?? 1;
  const boardPieces = state?.pieces?.filter((p) => !p.inTray) ?? [];

  ctx.save();

  if (boardPieces.length > 0 && rows >= 1) {
    const waveSpanMs = COMPLETION_GLOW_DURATION_MS;
    const perRowDelay = waveSpanMs / Math.max(1, rows);

    for (const p of boardPieces) {
      const rowDelay = p.row * perRowDelay;
      const rowElapsed = elapsedMs - rowDelay;
      const fadeIn = Math.min(1, Math.max(0, rowElapsed / COMPLETION_GLOW_ROW_FADE_MS));
      const fadeOut =
        elapsedMs > waveSpanMs
          ? Math.max(
              0,
              1 - (elapsedMs - waveSpanMs) / (COMPLETION_GLOW_TOTAL_MS - waveSpanMs),
            )
          : 1;
      const alpha = fadeIn * fadeOut * COMPLETION_GLOW_MAX_ALPHA;

      if (alpha <= 0) continue;

      const cx = p.x + p.w / 2 + offsetX;
      const cy = p.y + p.h / 2 + offsetY;
      const radius = Math.max(p.w, p.h) * 0.65;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(255, 230, 150, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 215, 100, ${alpha * 0.4})`);
      gradient.addColorStop(1, `rgba(255, 200, 80, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const alpha = Math.min(
      COMPLETION_GLOW_MAX_ALPHA,
      (elapsedMs / COMPLETION_GLOW_DURATION_MS) *
        COMPLETION_GLOW_MAX_ALPHA *
        Math.max(0, 1 - elapsedMs / COMPLETION_GLOW_TOTAL_MS),
    );
    const gradient = ctx.createRadialGradient(
      _cssW / 2,
      _cssH / 2,
      0,
      _cssW / 2,
      _cssH / 2,
      Math.max(_cssW, _cssH) / 2,
    );
    gradient.addColorStop(0, `rgba(255, 215, 100, ${alpha})`);
    gradient.addColorStop(1, `rgba(255, 200, 80, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, _cssW, _cssH);
  }

  ctx.restore();
}
