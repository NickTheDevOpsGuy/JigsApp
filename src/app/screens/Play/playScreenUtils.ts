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
  const pieceCount = grid.rows * grid.cols;
  const tileFromW = availW / grid.cols;
  const tileFromH = availH / grid.rows;
  let tile = Math.floor(Math.min(tileFromW, tileFromH));

  if (pieceCount > 25) {
    const scale = Math.sqrt(25) / Math.sqrt(pieceCount);
    tile = Math.floor(tile * scale);
  }

  const minTile = pieceCount > 36 ? 36 : pieceCount > 16 ? 44 : 56;
  return Math.max(minTile, Math.min(160, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};
