export const PUZZLE_DEFAULTS = {
  scatterPadding: 16,
  pad: 18,
  /** Board snap: precise placement into final grid position. Slightly stricter. */
  snapToleranceBoardPx: 34,
  /** Neighbor snap: connecting pieces. More forgiving—intent is clear when bringing pieces together. */
  snapToleranceNeighborPx: 48,
  scatterStartYRatio: 0.3,
  rotationStepDeg: 90 as const,

  // Progressive difficulty defaults
  // Keep rotation enabled by default; optionally unlock it later.
  rotationEnabled: false,
  rotationUnlockPlacedCount: 0,
} as const;
