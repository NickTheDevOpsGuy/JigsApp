export const STORAGE_KEY = "phuzzle:imageDataUrl";
export const GRID_KEY = "phuzzle:gridSize";
export const PIECE_LOCKING_KEY = "phuzzle:pieceLocking";
export const GHOST_HINT_KEY = "phuzzle:ghostHint";
export const PIECE_BORDERS_KEY = "phuzzle:pieceBorders";

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
  let tile = Math.floor(Math.min(tileFromW, tileFromH));

  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const pieceCount = grid.rows * grid.cols;

  // Mobile: scale down pieces as count increases so puzzle fits and feels playable
  // Use 16/pieceCount so 16-piece stays full size; avoid over-shrinking small puzzles
  if (isMobile && pieceCount > 6) {
    const scale = Math.max(0.55, Math.min(1, 16 / pieceCount));
    tile = Math.floor(tile * scale);
  }

  // Desktop: larger pieces for easier play
  let minTile: number;
  let maxTile: number;

  if (isMobile) {
    // Slightly larger minimums so pieces stay tappable and readable
    if (pieceCount <= 9) {
      minTile = 44;
      maxTile = 76;
    } else if (pieceCount <= 16) {
      minTile = 38;
      maxTile = 64;
    } else if (pieceCount <= 25) {
      minTile = 32;
      maxTile = 52;
    } else {
      minTile = 26;
      maxTile = 44;
    }
  } else {
    if (pieceCount <= 9) {
      minTile = 100;
      maxTile = 200;
    } else if (pieceCount <= 16) {
      minTile = 80;
      maxTile = 160;
    } else if (pieceCount <= 25) {
      minTile = 60;
      maxTile = 120;
    } else {
      minTile = 50;
      maxTile = 100;
    }
  }

  return Math.max(minTile, Math.min(maxTile, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};
