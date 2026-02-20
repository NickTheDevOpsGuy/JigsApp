/**
 * config – puzzle defaults: snap tolerances, scatter, rotation step.
 */
export const PUZZLE_DEFAULTS = {
  scatterPadding: 16,
  pad: 18,
  /** Board snap: precise placement into final grid position. */
  snapToleranceBoardPx: 38,
  /** Neighbor snap: connecting pieces. Forgiving—intent is clear when bringing pieces together. */
  snapToleranceNeighborPx: 54,
  scatterStartYRatio: 0.3,
  rotationStepDeg: 90 as const,

  // Progressive difficulty defaults
  // Keep rotation enabled by default; optionally unlock it later.
  rotationEnabled: false,
  rotationUnlockPlacedCount: 0,
} as const;
