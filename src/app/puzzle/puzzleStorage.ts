// src/app/puzzle/puzzleStorage.ts

import type { Piece, GridSize } from "./types";

const PUZZLE_STATE_KEY = "phuzzle:puzzleState";

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
  groupId: string;
  inTray: boolean;
};

export type SavedPuzzleState = {
  version: 1;
  imageUrl: string;
  grid: GridSize;
  pieces: SavedPiece[];
  elapsedSeconds: number;
  savedAt: number; // timestamp
};

/**
 * Save current puzzle state to localStorage
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
    groupId: p.groupId,
    inTray: p.inTray,
  }));

  const state: SavedPuzzleState = {
    version: 1,
    imageUrl,
    grid,
    pieces: savedPieces,
    elapsedSeconds,
    savedAt: Date.now(),
  };

  try {
    localStorage.setItem(PUZZLE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save puzzle state:", e);
  }
}

/**
 * Load saved puzzle state from localStorage
 */
export function loadPuzzleState(): SavedPuzzleState | null {
  try {
    const raw = localStorage.getItem(PUZZLE_STATE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as SavedPuzzleState;

    // Validate version
    if (state.version !== 1) {
      console.warn("Unknown puzzle state version:", state.version);
      return null;
    }

    // Basic validation
    if (!state.imageUrl || !state.grid || !state.pieces) {
      return null;
    }

    return state;
  } catch (e) {
    console.warn("Failed to load puzzle state:", e);
    return null;
  }
}

/**
 * Clear saved puzzle state
 */
export function clearPuzzleState(): void {
  try {
    localStorage.removeItem(PUZZLE_STATE_KEY);
  } catch (e) {
    console.warn("Failed to clear puzzle state:", e);
  }
}

/**
 * Check if there's a saved game that matches current settings
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
