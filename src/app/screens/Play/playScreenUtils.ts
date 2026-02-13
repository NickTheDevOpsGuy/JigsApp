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
  let tile = Math.floor(Math.min(tileFromW, tileFromH));

  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const pieceCount = grid.rows * grid.cols;

  // Mobile: scale down pieces as count increases so puzzle fits and feels playable
  // (avoids "technically working, experientially wrong" - cramped boards)
  if (isMobile && pieceCount > 6) {
    const scale = Math.max(0.55, Math.min(1, 14 / pieceCount));
    tile = Math.floor(tile * scale);
  }

  // Desktop: larger pieces for easier play
  let minTile: number;
  let maxTile: number;

  if (isMobile) {
    if (pieceCount <= 9) {
      minTile = 42;
      maxTile = 72;
    } else if (pieceCount <= 16) {
      minTile = 36;
      maxTile = 60;
    } else if (pieceCount <= 25) {
      minTile = 30;
      maxTile = 48;
    } else {
      minTile = 24;
      maxTile = 40;
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
