/**
 * puzzleStorage – save/load puzzle state to localStorage; restore from SavedPiece[].
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { logger } from "@/utils/logger";
import type { Piece, GridSize } from "@/puzzle/core/types";

const PUZZLE_STATE_KEY = "phuzzle:puzzleState";
const PUZZLE_BACKUP_KEY = "phuzzle:puzzleStateBackup";
const BACKUP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Current schema version. Bump when SavedPiece or SavedPuzzleState shape changes. */
export const PUZZLE_STATE_VERSION = 1;

/**
 * Minimal piece data needed to restore state.
 * We don't save shapePath (regenerated) or dimensions (computed from grid).
 */
export type SavedPiece = {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  isPlaced: boolean;
  locked: boolean;
  groupId: string;
  inTray: boolean;
  dragCount?: number;
};

export type SavedPuzzleState = {
  version: number;
  imageUrl: string;
  grid: GridSize;
  pieces: SavedPiece[];
  elapsedSeconds: number;
  savedAt: number;
};

export type LoadResult =
  | { ok: true; state: SavedPuzzleState }
  | { ok: false; reason: "corrupted" | "version_mismatch" | "invalid"; cleared: boolean };

function isValidPiece(p: unknown, grid: GridSize): p is SavedPiece {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.row === "number" &&
    o.row >= 0 &&
    o.row < grid.rows &&
    typeof o.col === "number" &&
    o.col >= 0 &&
    o.col < grid.cols &&
    typeof o.x === "number" &&
    typeof o.y === "number" &&
    typeof o.z === "number" &&
    typeof o.rotation === "number" &&
    typeof o.isPlaced === "boolean" &&
    typeof o.locked === "boolean" &&
    typeof o.groupId === "string" &&
    typeof o.inTray === "boolean"
  );
}

function validateState(raw: unknown): LoadResult {
  try {
    if (!raw || typeof raw !== "object")
      return { ok: false, reason: "corrupted", cleared: false };
    const state = raw as Record<string, unknown>;

    const version = state.version;
    if (typeof version !== "number")
      return { ok: false, reason: "corrupted", cleared: false };
    if (version !== PUZZLE_STATE_VERSION) {
      return { ok: false, reason: "version_mismatch", cleared: false };
    }

    const imageUrl = state.imageUrl;
    if (typeof imageUrl !== "string" || !imageUrl) {
      return { ok: false, reason: "invalid", cleared: false };
    }

    const grid = state.grid as GridSize | undefined;
    if (
      !grid ||
      typeof grid.rows !== "number" ||
      typeof grid.cols !== "number" ||
      grid.rows < 1 ||
      grid.cols < 1
    ) {
      return { ok: false, reason: "invalid", cleared: false };
    }

    const pieces = state.pieces;
    if (!Array.isArray(pieces) || pieces.length !== grid.rows * grid.cols) {
      return { ok: false, reason: "invalid", cleared: false };
    }

    const pieceIds = new Set<string>();
    for (let i = 0; i < pieces.length; i++) {
      if (!isValidPiece(pieces[i], grid)) {
        return { ok: false, reason: "invalid", cleared: false };
      }
      const id = (pieces[i] as SavedPiece).id;
      if (pieceIds.has(id)) return { ok: false, reason: "invalid", cleared: false };
      pieceIds.add(id);
    }

    const elapsedSeconds = state.elapsedSeconds;
    if (typeof elapsedSeconds !== "number" || elapsedSeconds < 0) {
      return { ok: false, reason: "invalid", cleared: false };
    }

    const savedAt = state.savedAt;
    if (typeof savedAt !== "number" || savedAt <= 0) {
      return { ok: false, reason: "invalid", cleared: false };
    }

    return {
      ok: true,
      state: {
        version,
        imageUrl,
        grid,
        pieces: pieces as SavedPiece[],
        elapsedSeconds,
        savedAt,
      },
    };
  } catch {
    return { ok: false, reason: "corrupted", cleared: false };
  }
}

function tryLoadFromStorage(key: string): LoadResult {
  try {
    const raw = safeLocalStorage.getItem(key);
    if (!raw) return { ok: false, reason: "corrupted", cleared: false };
    const parsed = JSON.parse(raw) as unknown;
    return validateState(parsed);
  } catch {
    return { ok: false, reason: "corrupted", cleared: false };
  }
}

function clearBoth(): void {
  try {
    safeLocalStorage.removeItem(PUZZLE_STATE_KEY);
    safeLocalStorage.removeItem(PUZZLE_BACKUP_KEY);
  } catch (e) {
    logger.warn("Failed to clear puzzle state:", e);
  }
}

/**
 * Save current puzzle state to localStorage.
 * On success, also updates the backup (previous good save).
 */
export function savePuzzleState(
  imageUrl: string,
  grid: GridSize,
  pieces: Piece[],
  elapsedSeconds: number,
): void {
  const savedPieces: SavedPiece[] = pieces.map((p) => ({
    id: p.id,
    row: p.row,
    col: p.col,
    x: p.x,
    y: p.y,
    z: p.z,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    locked: p.locked,
    groupId: p.groupId,
    inTray: p.inTray,
    dragCount: p.dragCount ?? 0,
  }));

  const state: SavedPuzzleState = {
    version: PUZZLE_STATE_VERSION,
    imageUrl,
    grid,
    pieces: savedPieces,
    elapsedSeconds,
    savedAt: Date.now(),
  };

  try {
    // Rotate: copy current main to backup before overwriting (fallback if new save gets corrupted)
    const existing = safeLocalStorage.getItem(PUZZLE_STATE_KEY);
    if (existing) {
      safeLocalStorage.setItem(PUZZLE_BACKUP_KEY, existing);
    }
    safeLocalStorage.setItem(PUZZLE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    logger.warn("Failed to save puzzle state:", e);
  }
}

/**
 * Load and validate saved puzzle state.
 * Tries main storage first; if corrupted or invalid, tries backup.
 * Returns null on failure and optionally clears bad data.
 */
export function loadPuzzleState(): SavedPuzzleState | null {
  const main = tryLoadFromStorage(PUZZLE_STATE_KEY);
  if (main.ok) return main.state;

  // Try backup
  const backup = tryLoadFromStorage(PUZZLE_BACKUP_KEY);
  if (backup.ok) {
    const state = backup.state;
    // Only use backup if not too old
    if (Date.now() - state.savedAt < BACKUP_MAX_AGE_MS) {
      try {
        // Restore backup to main so next load is fast
        safeLocalStorage.setItem(PUZZLE_STATE_KEY, JSON.stringify(state));
      } catch {
        // Ignore
      }
      return state;
    }
  }

  // Both failed or backup too old – clear corrupted data
  clearBoth();
  return null;
}

/**
 * Clear saved puzzle state (and backup)
 */
export function clearPuzzleState(): void {
  clearBoth();
}

/**
 * Check if there's a valid saved game that matches current settings
 */
export function hasSavedGame(imageUrl: string, grid: GridSize): boolean {
  const saved = loadPuzzleState();
  if (!saved) return false;
  return (
    saved.imageUrl === imageUrl &&
    saved.grid.rows === grid.rows &&
    saved.grid.cols === grid.cols
  );
}
