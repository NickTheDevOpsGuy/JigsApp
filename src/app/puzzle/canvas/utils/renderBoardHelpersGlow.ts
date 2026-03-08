/**
 * Snap animation, glow, and particle helpers for renderBoard. Split out to keep renderBoardHelpersCore under 300 lines.
 */

const SNAP_GLOW_MS = 260;

export function snapPopScale(tMs: number): number {
  if (tMs <= 0) return 1;
  if (tMs >= 150) return 1;

  const popPeak = 1.14;
  if (tMs < 50) {
    const k = tMs / 50;
    return 1 + (popPeak - 1) * easeOutBack(k);
  }

  const k = (tMs - 50) / 100;
  return popPeak - (popPeak - 1) * easeOutBounce(k);
}

/** Alpha for snap glow (0 = no glow, fades out over SNAP_GLOW_MS). */
export function snapGlowAlpha(elapsedMs: number): number {
  if (elapsedMs <= 0 || elapsedMs >= SNAP_GLOW_MS) return 0;
  const t = elapsedMs / SNAP_GLOW_MS;
  return 0.22 * (1 - t) * (1 - t * 0.5);
}

/** Draw a radial glow at (cx, cy). Used for snap/placement feedback. */
export function drawSnapGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
): void {
  if (alpha <= 0) return;
  ctx.save();
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255, 225, 140, ${alpha})`);
  gradient.addColorStop(0.35, `rgba(255, 210, 120, ${alpha * 0.55})`);
  gradient.addColorStop(0.65, `rgba(255, 195, 100, ${alpha * 0.2})`);
  gradient.addColorStop(1, "rgba(255, 180, 90, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

/** Draw a soft orb at (cx, cy): bright core, tight falloff. Use when really close to snap. */
export function drawTargetSlotOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  nowMs: number,
): void {
  if (alpha <= 0) return;
  ctx.save();
  const pulse = 0.92 + 0.08 * Math.sin(nowMs * 0.005);
  const a = Math.min(1, alpha * pulse);
  const haloR = radius * 1.1;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
  gradient.addColorStop(0, `rgba(255, 252, 220, ${a * 0.98})`);
  gradient.addColorStop(0.2, `rgba(255, 240, 180, ${a * 0.85})`);
  gradient.addColorStop(0.45, `rgba(255, 215, 140, ${a * 0.4})`);
  gradient.addColorStop(0.7, `rgba(255, 195, 110, ${a * 0.12})`);
  gradient.addColorStop(1, "rgba(255, 180, 90, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - haloR, cy - haloR, haloR * 2, haloR * 2);
  ctx.restore();
}

/** Draw glow at the target slot (where the piece will snap). Uses orb when really close. */
export function drawTargetSlotGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  nowMs: number,
): void {
  if (alpha <= 0) return;
  const pulse = 0.9 + 0.1 * Math.sin(nowMs * 0.004);
  const a = alpha * pulse;
  if (a > 0.5) {
    drawTargetSlotOrb(ctx, cx, cy, radius, alpha, nowMs);
    return;
  }
  ctx.save();
  const r = radius * 1.1;
  const hot = Math.min(1, a > 0.35 ? 0.6 + (0.2 * (a - 0.35)) / 0.15 : a * 1.3);
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, `rgba(255, 248, 200, ${hot})`);
  gradient.addColorStop(0.35, `rgba(255, 230, 170, ${a * 0.4})`);
  gradient.addColorStop(0.6, `rgba(255, 200, 120, ${a * 0.15})`);
  gradient.addColorStop(1, "rgba(255, 190, 100, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

export type SnapParticle = { x: number; y: number; t0: number };

const SNAP_PARTICLE_MS = 520;

/** Draw small particles for neighbor-snap celebration. */
export function drawSnapParticles(
  ctx: CanvasRenderingContext2D,
  particles: SnapParticle[],
  nowMs: number,
): void {
  ctx.save();
  for (const p of particles) {
    const elapsed = nowMs - p.t0;
    if (elapsed >= SNAP_PARTICLE_MS) continue;
    const life = 1 - elapsed / SNAP_PARTICLE_MS;
    const alpha = 0.75 * life * life;
    const r = 4 + 5 * (1 - life);
    const drift = 10 * (1 - life);
    const angle = (p.t0 % 8) * 0.78;
    const dx = Math.cos(angle) * drift;
    const dy = Math.sin(angle) * drift;
    ctx.fillStyle = `rgba(255, 215, 120, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x + dx, p.y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
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

/** Ease for gravity-style drop: moves quickly at first (drop), then soft settle at the end. */
export function easeGravityDrop(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(1 - t, 2.2);
}
