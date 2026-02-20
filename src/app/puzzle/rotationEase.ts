/**
 * rotationEase – easing for piece rotation animation.
 * Short duration, tactile feel, respect reduced motion.
 */

export const ROTATION_EASE_MS = 120;

/** easeOutCubic: fast start, soft landing. */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Compute interpolated rotation at nowMs. Returns null when animation complete. */
export function getRotationEaseProgress(
  fromDeg: number,
  toDeg: number,
  startMs: number,
  nowMs: number,
  durationMs: number = ROTATION_EASE_MS,
): number | null {
  const elapsed = nowMs - startMs;
  if (elapsed >= durationMs) return null;
  const t = elapsed / durationMs;
  const eased = easeOutCubic(t);
  // Handle wraparound (e.g. 270 → 360/0)
  let delta = toDeg - fromDeg;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return fromDeg + delta * eased;
}
