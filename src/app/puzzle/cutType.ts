/**
 * cutType – piece shape variants for replayability.
 * Classic = standard jigsaw; Irregular = larger tabs; Hard = smaller tabs.
 */
export type CutType = "classic" | "irregular" | "hard";

export const CUT_TYPES: CutType[] = ["classic", "irregular", "hard"];

export const CUT_DISPLAY_NAMES: Record<CutType, string> = {
  classic: "Classic",
  irregular: "Irregular",
  hard: "Hard mode",
};

/** Knob depth ratio (of min tile dimension). Larger = more pronounced tabs. */
export const CUT_DEPTH_RATIO: Record<CutType, number> = {
  classic: 0.22,
  irregular: 0.28,
  hard: 0.14,
};

/** Knob width ratio (of edge length). */
export const CUT_WIDTH_RATIO: Record<CutType, number> = {
  classic: 0.36,
  irregular: 0.44,
  hard: 0.24,
};

/** Max knob depth for pad calculation (use largest across cuts when unknown). */
export const MAX_DEPTH_RATIO = 0.28;
