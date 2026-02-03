/**
 * Animation and overlay helpers for renderBoard.
 * Extracted to keep renderBoard.ts focused on the main rendering pipeline.
 */

export function snapPopScale(tMs: number): number {
  if (tMs <= 0) return 1;
  if (tMs >= 200) return 1;

  if (tMs < 80) {
    const k = tMs / 80;
    return 1 + 0.1 * easeOutBack(k);
  }

  const k = (tMs - 80) / 120;
  return 1.1 - 0.1 * easeOutBounce(k);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutBounce(t: number): number {
  if (t < 0.5) return 2 * t * t;
  return 1 - 2 * (1 - t) * (1 - t);
}

export function drawDebugBackdrop(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.02)";
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.restore();
}

export function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;

  const step = 40;
  for (let x = 0; x <= cssW; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cssH);
    ctx.stroke();
  }
  for (let y = 0; y <= cssH; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cssW, y);
    ctx.stroke();
  }
  ctx.restore();
}
