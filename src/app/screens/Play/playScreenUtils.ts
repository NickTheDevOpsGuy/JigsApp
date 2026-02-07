
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
/** Small phones: iPhone SE, 12/13 mini, etc. (~320–380px width) */
const SMALL_PHONE_BREAKPOINT = 380;

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

  const isSmallPhone = viewportWidth < SMALL_PHONE_BREAKPOINT;
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const pieceCount = grid.rows * grid.cols;

  // Piece sizes optimized for touch on mobile, comfortable on desktop
  let minTile: number;
  let maxTile: number;

  if (isSmallPhone) {
    // Small phones (iPhone SE, mini): still need touchable pieces
    if (pieceCount <= 9) {
      minTile = 55;
      maxTile = 95;
    } else if (pieceCount <= 16) {
      minTile = 45;
      maxTile = 75;
    } else if (pieceCount <= 25) {
      minTile = 38;
      maxTile = 62;
    } else if (pieceCount <= 36) {
      minTile = 32;
      maxTile = 52;
    } else {
      minTile = 26;
      maxTile = 42;
    }
  } else if (isMobile) {
    // Standard mobile (most iPhones, Android)
    if (pieceCount <= 9) {
      minTile = 65;
      maxTile = 120;
    } else if (pieceCount <= 16) {
      minTile = 55;
      maxTile = 95;
    } else if (pieceCount <= 25) {
      minTile = 45;
      maxTile = 78;
    } else if (pieceCount <= 36) {
      minTile = 38;
      maxTile = 65;
    } else {
      minTile = 32;
      maxTile = 52;
    }
  } else {
    // Desktop
    if (pieceCount <= 9) {
      minTile = 60;
      maxTile = 110;
    } else if (pieceCount <= 16) {
      minTile = 55;
      maxTile = 100;
    } else if (pieceCount <= 25) {
      minTile = 48;
      maxTile = 85;
    } else if (pieceCount <= 36) {
      minTile = 40;
      maxTile = 70;
    } else {
      minTile = 34;
      maxTile = 58;
    }
  }

  return Math.max(minTile, Math.min(maxTile, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};
