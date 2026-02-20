/**
 * timeDecayScore – scoring for Time Decay mode.
 * Score starts high and decays over time; faster placements add bonus (stabilize score).
 */
export const TIME_DECAY_BASE = 600;
export const TIME_DECAY_PER_PIECE = 8;
export const TIME_DECAY_LOSS_PER_SEC = 3;
export const TIME_DECAY_PLACEMENT_BONUS_BASE = 12;
/** Combo window for consecutive placements (shorter than Time Attack's 4s to match faster pacing). */
export const TIME_DECAY_COMBO_MS = 3500;

export function computeTimeDecayBaseScore(pieceCount: number): number {
  return TIME_DECAY_BASE + pieceCount * TIME_DECAY_PER_PIECE;
}

export function computeTimeDecayScore(
  elapsedSeconds: number,
  pieceCount: number,
  placementBonus: number,
): number {
  const base = computeTimeDecayBaseScore(pieceCount);
  const decay = elapsedSeconds * TIME_DECAY_LOSS_PER_SEC;
  return Math.max(0, Math.round(base - decay + placementBonus));
}
