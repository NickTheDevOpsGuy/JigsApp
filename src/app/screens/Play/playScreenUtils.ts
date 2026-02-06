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
    // Small phones still need reasonably large tiles for low piece counts.
    if (pieceCount <= 9) {
      minTile = 40;
      maxTile = 110;
    } else if (pieceCount <= 16) {
      minTile = 32;
      maxTile = 90;
    } else if (pieceCount <= 25) {
      minTile = 26;
      maxTile = 72;
    } else if (pieceCount <= 36) {
      minTile = 22;
      maxTile = 60;
    } else {
      minTile = 18;
      maxTile = 48;
    }
  } else if (isMobile) {
    // Mobile: let the available board space drive sizing.
    // The previous caps (20px-ish) made pieces comically tiny on phones.
    if (pieceCount <= 9) {
      minTile = 48;
      maxTile = 140;
    } else if (pieceCount <= 16) {
      minTile = 36;
      maxTile = 110;
    } else if (pieceCount <= 25) {
      minTile = 30;
      maxTile = 90;
    } else if (pieceCount <= 36) {
      minTile = 24;
      maxTile = 75;
    } else {
      minTile = 20;
      maxTile = 60;
    }
  } else {
    if (pieceCount <= 9) {
      minTile = 50;
      maxTile = 100;
    } else if (pieceCount <= 16) {
      minTile = 55;
      maxTile = 110;
    } else if (pieceCount <= 25) {
      minTile = 45;
      maxTile = 90;
    } else if (pieceCount <= 36) {
      minTile = 35;
      maxTile = 65;
    } else {
      minTile = 30;
      maxTile = 55;
    }
  }

  return Math.max(minTile, Math.min(maxTile, tile));
}

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};
