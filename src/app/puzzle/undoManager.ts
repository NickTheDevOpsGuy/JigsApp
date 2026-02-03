import type { SavedPiece } from "./puzzleStorage";
import type { Piece } from "./types";

const DEFAULT_LIMIT = 30;

export function piecesToSaved(pieces: Piece[]): SavedPiece[] {
  return pieces.map((p) => ({
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
  }));
}

export class UndoManager {
  private history: SavedPiece[][] = [];
  private readonly limit: number;

  constructor(limit = DEFAULT_LIMIT) {
    this.limit = limit;
  }

  push(pieces: Piece[]): void {
    this.history.push(piecesToSaved(pieces));
    if (this.history.length > this.limit) {
      this.history.shift();
    }
  }

  pop(): SavedPiece[] | null {
    if (this.history.length === 0) return null;
    return this.history.pop() ?? null;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  clear(): void {
    this.history = [];
  }
}
