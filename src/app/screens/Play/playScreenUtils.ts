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

  // Small phone: tightest sizing for iPhone SE etc.; mobile: standard; desktop: larger
  let minTile: number;
  let maxTile: number;

  if (isSmallPhone) {
    // Small phones: larger tiles for better touch targets
    if (pieceCount <= 9) {
      minTile = 52;
      maxTile = 120;
    } else if (pieceCount <= 16) {
      minTile = 42;
      maxTile = 100;
    } else if (pieceCount <= 25) {
      minTile = 34;
      maxTile = 82;
    } else if (pieceCount <= 36) {
      minTile = 28;
      maxTile = 68;
    } else {
      minTile = 24;
      maxTile = 54;
    }
  } else if (isMobile) {
    // Mobile: generous sizing for touch
    if (pieceCount <= 9) {
      minTile = 60;
      maxTile = 150;
    } else if (pieceCount <= 16) {
      minTile = 48;
      maxTile = 120;
    } else if (pieceCount <= 25) {
      minTile = 40;
      maxTile = 100;
    } else if (pieceCount <= 36) {
      minTile = 32;
      maxTile = 85;
    } else {
      minTile = 26;
      maxTile = 68;
    }
  } else {
    // Desktop: larger pieces for comfortable play
    if (pieceCount <= 9) {
      minTile = 65;
      maxTile = 120;
    } else if (pieceCount <= 16) {
      minTile = 65;
      maxTile = 125;
    } else if (pieceCount <= 25) {
      minTile = 52;
      maxTile = 100;
    } else if (pieceCount <= 36) {
      minTile = 42;
      maxTile = 78;
    } else {
      minTile = 36;
      maxTile = 62;
    }
  }

  return Math.max(minTile, Math.min(maxTile, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};
