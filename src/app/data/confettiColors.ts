/**
 * confettiColors – theme-specific confetti palettes for completion celebration.
 */
import type { Theme } from "@/hooks/useTheme";

/** Confetti color palettes per theme. */
export const CONFETTI_COLORS_BY_THEME: Record<Theme, string[]> = {
  light: ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a", "#fef3c7"],
  dark: ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"],
  space: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#7c3aed"],
  ocean: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#0c4a6e"],
  forest: ["#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#14532d"],
  sunset: ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#c2410c"],
};

/** Special confetti for streak milestones (3-day, 7-day). */
export const CONFETTI_COLORS_STREAK_3 = ["#fbbf24", "#f59e0b", "#fcd34d", "#fef3c7", "#fde047"];
export const CONFETTI_COLORS_STREAK_7 = ["#f97316", "#ea580c", "#fb923c", "#fdba74", "#fbbf24", "#eab308"];
