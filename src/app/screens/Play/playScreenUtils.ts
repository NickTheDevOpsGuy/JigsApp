export const STORAGE_KEY = "phuzzle:imageDataUrl";
export const GRID_KEY = "phuzzle:gridSize";
export const PIECE_LOCKING_KEY = "phuzzle:pieceLocking";
export const GHOST_HINT_KEY = "phuzzle:ghostHint";

export const SHOW_DEBUG = import.meta.env.VITE_SHOW_DEBUG === "true";

export function parseGrid(stored: string | null): { rows: number; cols: number } {
  if (!stored) return { rows: 4, cols: 4 };
  const [r, c] = stored.split("x").map(Number);
  if (r && c) return { rows: r, cols: c };
  return { rows: 4, cols: 4 };
}

const MOBILE_BREAKPOINT = 600;

export function computeTileSize(
  availW: number,
  availH: number,
  grid: { rows: number; cols: number },
  viewportWidth: number = 1024,
): number {
  // Calculate max tile size that fits the available space
  const tileFromW = availW / grid.cols;
  const tileFromH = availH / grid.rows;
  const tile = Math.floor(Math.min(tileFromW, tileFromH));

  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const pieceCount = grid.rows * grid.cols;

  // Mobile: smaller pieces so puzzle fits on screen; desktop: larger for easier play
  let minTile: number;
  let maxTile: number;

  if (isMobile) {
    if (pieceCount <= 9) {
      minTile = 18;
      maxTile = 26;
    } else if (pieceCount <= 16) {
      minTile = 20;
      maxTile = 28;
    } else if (pieceCount <= 25) {
      minTile = 18;
      maxTile = 24;
    } else if (pieceCount <= 35) {
      minTile = 14;
      maxTile = 18;
    } else {
      minTile = 14;
      maxTile = 18;
    }
  } else {
    if (pieceCount <= 9) {
      minTile = 70;
      maxTile = 140;
    } else if (pieceCount <= 16) {
      minTile = 80;
      maxTile = 160;
    } else if (pieceCount <= 25) {
      minTile = 60;
      maxTile = 120;
    } else if (pieceCount <= 35) {
      minTile = 45;
      maxTile = 85;
    } else {
      minTile = 40;
      maxTile = 70;
    }
  }

  return Math.max(minTile, Math.min(maxTile, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};
