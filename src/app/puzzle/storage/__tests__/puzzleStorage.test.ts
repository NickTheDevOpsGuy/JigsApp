import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  savePuzzleState,
  loadPuzzleState,
  clearPuzzleState,
  hasSavedGame,
  PUZZLE_STATE_VERSION,
  type SavedPuzzleState,
} from "@/puzzle/storage/puzzleStorage";
import type { Piece } from "@/puzzle/core/types";

let store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    store = {};
  },
  get length() {
    return Object.keys(store).length;
  },
  key: () => null,
};

function makeValidPiece(id: string, row: number, col: number): Piece {
  return {
    id,
    row,
    col,
    x: 0,
    y: 0,
    z: 0,
    w: 80,
    h: 80,
    tileW: 60,
    tileH: 60,
    pad: 10,
    targetX: col * 60,
    targetY: row * 60,
    rotation: 0,
    targetRotation: 0,
    isPlaced: false,
    locked: false,
    groupId: id,
    inTray: true,
    shapePath: "",
    edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
  } as Piece;
}

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  store = {};
});

describe("puzzleStorage", () => {
  describe("savePuzzleState / loadPuzzleState", () => {
    it("saves and loads valid state", () => {
      const imageUrl = "data:image/png;base64,abc";
      const grid = { rows: 3, cols: 3 };
      const pieces = Array.from({ length: 9 }, (_, i) =>
        makeValidPiece(`p${i}`, Math.floor(i / 3), i % 3),
      );

      savePuzzleState(imageUrl, grid, pieces, 120);

      const loaded = loadPuzzleState();
      expect(loaded).not.toBeNull();
      expect(loaded!.imageUrl).toBe(imageUrl);
      expect(loaded!.grid).toEqual(grid);
      expect(loaded!.pieces).toHaveLength(9);
      expect(loaded!.elapsedSeconds).toBe(120);
      expect(loaded!.version).toBe(PUZZLE_STATE_VERSION);
    });

    it("returns null for corrupted JSON", () => {
      store["phuzzle:puzzleState"] = "not valid json {";
      expect(loadPuzzleState()).toBeNull();
    });

    it("returns null for version mismatch", () => {
      const valid: SavedPuzzleState = {
        version: 99,
        imageUrl: "data:image/png;base64,x",
        grid: { rows: 2, cols: 2 },
        pieces: [0, 1, 2, 3].map((i) =>
          makeValidPiece(`p${i}`, Math.floor(i / 2), i % 2),
        ),
        elapsedSeconds: 0,
        savedAt: Date.now(),
      };
      store["phuzzle:puzzleState"] = JSON.stringify(valid);
      expect(loadPuzzleState()).toBeNull();
    });

    it("returns null for invalid piece count", () => {
      const valid: SavedPuzzleState = {
        version: PUZZLE_STATE_VERSION,
        imageUrl: "data:image/png;base64,x",
        grid: { rows: 2, cols: 2 },
        pieces: [makeValidPiece("p0", 0, 0)], // only 1 piece, should be 4
        elapsedSeconds: 0,
        savedAt: Date.now(),
      };
      store["phuzzle:puzzleState"] = JSON.stringify(valid);
      expect(loadPuzzleState()).toBeNull();
    });
  });

  describe("clearPuzzleState", () => {
    it("removes saved state", () => {
      const imageUrl = "data:image/png;base64,x";
      const grid = { rows: 2, cols: 2 };
      const pieces = [0, 1, 2, 3].map((i) =>
        makeValidPiece(`p${i}`, Math.floor(i / 2), i % 2),
      );
      savePuzzleState(imageUrl, grid, pieces, 0);
      expect(loadPuzzleState()).not.toBeNull();

      clearPuzzleState();
      expect(loadPuzzleState()).toBeNull();
    });
  });

  describe("hasSavedGame", () => {
    it("returns true when saved game matches", () => {
      const imageUrl = "data:image/png;base64,match";
      const grid = { rows: 4, cols: 4 };
      const pieces = Array.from({ length: 16 }, (_, i) =>
        makeValidPiece(`p${i}`, Math.floor(i / 4), i % 4),
      );
      savePuzzleState(imageUrl, grid, pieces, 0);

      expect(hasSavedGame(imageUrl, grid)).toBe(true);
    });

    it("returns false when image differs", () => {
      const imageUrl = "data:image/png;base64,saved";
      const grid = { rows: 2, cols: 2 };
      const pieces = [0, 1, 2, 3].map((i) =>
        makeValidPiece(`p${i}`, Math.floor(i / 2), i % 2),
      );
      savePuzzleState(imageUrl, grid, pieces, 0);

      expect(hasSavedGame("data:image/png;base64,different", grid)).toBe(false);
    });

    it("returns false when grid differs", () => {
      const imageUrl = "data:image/png;base64,x";
      const grid = { rows: 3, cols: 3 };
      const pieces = Array.from({ length: 9 }, (_, i) =>
        makeValidPiece(`p${i}`, Math.floor(i / 3), i % 3),
      );
      savePuzzleState(imageUrl, grid, pieces, 0);

      expect(hasSavedGame(imageUrl, { rows: 4, cols: 4 })).toBe(false);
    });

    it("returns false when no saved state", () => {
      expect(hasSavedGame("data:x", { rows: 2, cols: 2 })).toBe(false);
    });
  });
});
