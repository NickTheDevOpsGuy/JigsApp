/**
 * Labels and ranking for “which quarter of the board finished last” (completion overlay).
 */
export const QUADRANT_SHORT_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: "Top-left",
  1: "Top-right",
  2: "Bottom-left",
  3: "Bottom-right",
};

export function rankQuadrantsSlowestFirst(
  times: Record<0 | 1 | 2 | 3, number | null>,
): { q: 0 | 1 | 2 | 3; sec: number }[] {
  return ([0, 1, 2, 3] as const)
    .map((q) => ({ q, sec: times[q] }))
    .filter((x): x is { q: 0 | 1 | 2 | 3; sec: number } => x.sec != null)
    .sort((a, b) => b.sec - a.sec || a.q - b.q);
}
