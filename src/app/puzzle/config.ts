export const PUZZLE_DEFAULTS = {
  scatterPadding: 24,
  pad: 18,
  snapTolerancePx: 65,
  scatterStartYRatio: 0.3,
  rotationStepDeg: 90 as const,

  // Progressive difficulty defaults
  // Keep rotation enabled by default; optionally unlock it later.
  rotationEnabled: false,
  rotationUnlockPlacedCount: 0,
} as const;
