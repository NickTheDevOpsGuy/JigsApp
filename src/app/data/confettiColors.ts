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

/** Snap glow & particle colors per theme (RGB base for alpha blending). */
export const SNAP_GLOW_COLORS_BY_THEME: Record<
  Theme,
  { rgb: string; mid: string; particle: string }
> = {
  light: { rgb: "80, 150, 255", mid: "60, 130, 235", particle: "255, 200, 100" },
  dark: { rgb: "74, 159, 245", mid: "96, 165, 250", particle: "148, 163, 184" },
  space: { rgb: "167, 139, 250", mid: "196, 181, 253", particle: "196, 181, 253" },
  ocean: { rgb: "56, 189, 248", mid: "125, 211, 252", particle: "125, 211, 252" },
  forest: { rgb: "74, 222, 128", mid: "134, 239, 172", particle: "134, 239, 172" },
  sunset: { rgb: "251, 146, 60", mid: "253, 186, 116", particle: "253, 186, 116" },
};

/** Special confetti for streak milestones (3-day, 7-day). */
export const CONFETTI_COLORS_STREAK_3 = [
  "#fbbf24",
  "#f59e0b",
  "#fcd34d",
  "#fef3c7",
  "#fde047",
];
export const CONFETTI_COLORS_STREAK_7 = [
  "#f97316",
  "#ea580c",
  "#fb923c",
  "#fdba74",
  "#fbbf24",
  "#eab308",
];
