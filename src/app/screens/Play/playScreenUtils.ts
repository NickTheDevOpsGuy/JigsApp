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

export function computeTileSize(
  availW: number,
  availH: number,
  grid: { rows: number; cols: number },
): number {
  // Calculate max tile size that fits the available space
  const tileFromW = availW / grid.cols;
  const tileFromH = availH / grid.rows;
  const tile = Math.floor(Math.min(tileFromW, tileFromH));

  // Set size ranges based on difficulty - larger pieces for easier puzzles
  const pieceCount = grid.rows * grid.cols;
  let minTile: number;
  let maxTile: number;

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

  return Math.max(minTile, Math.min(maxTile, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};
