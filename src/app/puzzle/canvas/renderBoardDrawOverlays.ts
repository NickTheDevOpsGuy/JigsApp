/**
 * Wrong-rotation shake/icon and lock glow drawing for renderBoardDraw.
 */

export const WRONG_ROTATION_SHAKE_MS = 700;
const WRONG_ROTATION_SHAKE_AMPLITUDE = 2.5;
const WRONG_ROTATION_SHAKE_FREQ = 18;

export function wrongRotationShakeOffset(elapsedMs: number): { x: number; y: number } {
  if (elapsedMs >= WRONG_ROTATION_SHAKE_MS) return { x: 0, y: 0 };
  const decay = 1 - elapsedMs / WRONG_ROTATION_SHAKE_MS;
  const t = elapsedMs * 0.001;
  const x =
    WRONG_ROTATION_SHAKE_AMPLITUDE * Math.sin(t * WRONG_ROTATION_SHAKE_FREQ) * decay;
  const y =
    WRONG_ROTATION_SHAKE_AMPLITUDE *
    Math.cos(t * WRONG_ROTATION_SHAKE_FREQ * 0.7) *
    decay;
  return { x, y };
}

export function drawWrongRotationIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pieceSize: number,
  elapsedMs: number,
) {
  if (elapsedMs >= WRONG_ROTATION_SHAKE_MS) return;
  const decay = 1 - elapsedMs / WRONG_ROTATION_SHAKE_MS;
  const pulse = 0.6 + 0.4 * Math.sin(elapsedMs * 0.02);
  const alpha = 0.85 * decay * pulse;
  const size = Math.min(14, pieceSize * 0.35);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(100, 100, 120, 0.9)";
  ctx.fillText("↻", cx, cy);
  ctx.restore();
}

export function drawLockGlow(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  elapsedMs: number,
) {
  const LOCK_GLOW_MS = 500;
  const alpha = Math.max(0, 0.5 * (1 - elapsedMs / LOCK_GLOW_MS));
  if (alpha <= 0) return;
  ctx.save();
  ctx.strokeStyle = `rgba(0, 200, 100, ${alpha})`;
  ctx.lineWidth = 4;
  ctx.stroke(path);
  ctx.restore();
}
