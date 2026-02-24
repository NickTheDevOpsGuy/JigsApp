/**
 * playScreenUtils – storage keys, parseGrid, computeTileSize, difficulty tiers.
 */
export const STORAGE_KEY = "phuzzle:imageDataUrl";
export const GRID_KEY = "phuzzle:gridSize";
export const PIECE_LOCKING_KEY = "phuzzle:pieceLocking";
export const GHOST_HINT_KEY = "phuzzle:ghostHint";
export const IMMERSIVE_MODE_KEY = "phuzzle:immersiveMode";
export const ALIGNMENT_GRID_KEY = "phuzzle:alignmentGrid";
export const GHOST_WHEN_IDLE_KEY = "phuzzle:ghostWhenIdle";
export const EDGE_HIGHLIGHT_KEY = "phuzzle:edgeHighlight";
export const RELAXED_MODE_KEY = "phuzzle:relaxedMode";
export const DRIFT_MODE_KEY = "phuzzle:driftMode";
export const CUT_TYPE_KEY = "phuzzle:cutType";
export const PROGRESSIVE_REVEAL_KEY = "phuzzle:progressiveReveal";

export const SHOW_DEBUG = import.meta.env.VITE_SHOW_DEBUG === "true";

const PRESET_SIZES = [
  { rows: 3, cols: 3 },
  { rows: 4, cols: 4 },
  { rows: 5, cols: 5 },
  { rows: 6, cols: 6 },
  { rows: 7, cols: 7 },
  { rows: 8, cols: 8 },
  { rows: 9, cols: 9 },
];

const PRESET_LABELS = [
  "Easy 🌱",
  "Medium ⚡",
  "Hard 🔥",
  "Expert 👑",
  "Master 🧠",
  "Legend 🔮",
  "Extreme 💀",
];

/** Suggest next grid size based on best times. Returns gridIndex (0–6), rows, cols, and label, or null. */
export function getSuggestedGrid(
  getBestTime: (rows: number, cols: number) => number | null,
): { gridIndex: number; rows: number; cols: number; label: string } | null {
  try {
    let largestCompleted = -1;
    for (let i = 0; i < PRESET_SIZES.length; i++) {
      const { rows, cols } = PRESET_SIZES[i];
      if (getBestTime(rows, cols) != null) {
        largestCompleted = i;
      }
    }
    const nextIndex = largestCompleted + 1;
    if (nextIndex >= PRESET_SIZES.length) return null;
    const next = PRESET_SIZES[nextIndex];
    return {
      gridIndex: nextIndex,
      rows: next.rows,
      cols: next.cols,
      label: `${PRESET_LABELS[nextIndex]} (${next.rows}×${next.cols})`,
    };
  } catch {
    return null;
  }
}

export function parseGrid(stored: string | null): { rows: number; cols: number } {
  if (!stored) return { rows: 4, cols: 4 };
  const [r, c] = stored.split("x").map(Number);
  if (r && c) return { rows: r, cols: c };
  return { rows: 4, cols: 4 };
}

const MOBILE_BREAKPOINT = 600;

/** Difficulty tiers for piece scaling: easy 9–16, medium 25–36, hard 49–64, extreme 81+ */
function getDifficultyTier(pieceCount: number): "easy" | "medium" | "hard" | "extreme" {
  if (pieceCount <= 16) return "easy";
  if (pieceCount <= 36) return "medium";
  if (pieceCount <= 64) return "hard";
  return "extreme";
}

export function computeTileSize(
  availW: number,
  availH: number,
  grid: { rows: number; cols: number },
  viewportWidth: number = 1024,
  _viewportHeight: number = 768,
): number {
  const tileFromW = availW / grid.cols;
  const tileFromH = availH / grid.rows;
  let tile = Math.floor(Math.min(tileFromW, tileFromH));

  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const pieceCount = grid.rows * grid.cols;
  const tier = getDifficultyTier(pieceCount);

  // Mobile: dynamic scaling by difficulty for better touch interaction
  if (isMobile) {
    const mobileScale =
      tier === "easy"
        ? Math.min(1, 1.1 - pieceCount * 0.01)
        : tier === "medium"
          ? Math.max(0.65, 0.95 - pieceCount * 0.01)
          : tier === "hard"
            ? Math.max(0.5, 0.75 - pieceCount * 0.005)
            : Math.max(0.4, 0.65 - pieceCount * 0.004);
    tile = Math.floor(tile * mobileScale);
  }

  // Per-tier bounds: easy = larger, medium = mid, hard = smaller, extreme = smallest
  let minTile: number;
  let maxTile: number;

  if (isMobile) {
    switch (tier) {
      case "easy":
        minTile = 48;
        maxTile = 80;
        break;
      case "medium":
        minTile = 42;
        maxTile = 60;
        break;
      case "hard":
        minTile = 42;
        maxTile = 44;
        break;
      default:
        minTile = 42;
        maxTile = 44;
    }
  } else {
    switch (tier) {
      case "easy":
        minTile = 110;
        maxTile = 200;
        break;
      case "medium":
        minTile = 70;
        maxTile = 140;
        break;
      case "hard":
        minTile = 48;
        maxTile = 100;
        break;
      default:
        minTile = 38;
        maxTile = 72;
    }
  }

  return Math.max(minTile, Math.min(maxTile, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
  showPerfOverlay: boolean;
};
