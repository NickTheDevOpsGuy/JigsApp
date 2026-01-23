export const PUZZLE_DEFAULTS = {
  scatterPadding: 16,
  pad: 18,
  snapTolerancePx: 40,
  scatterStartYRatio: 0.3,
  rotationStepDeg: 90 as const,

  // Progressive difficulty defaults
  // Keep rotation enabled by default; optionally unlock it later.
  rotationEnabled: true,
  rotationUnlockPlacedCount: 0,
} as const;
