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
  private undoStack: SavedPiece[][] = [];
  private redoStack: SavedPiece[][] = [];
  private readonly limit: number;

  constructor(limit = DEFAULT_LIMIT) {
    this.limit = limit;
  }

  push(pieces: Piece[]): void {
    this.undoStack.push(piecesToSaved(pieces));
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
  }

  pop(): SavedPiece[] | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack.pop() ?? null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  redoPop(): SavedPiece[] | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack.pop() ?? null;
  }

  redoPush(pieces: Piece[]): void {
    this.redoStack.push(piecesToSaved(pieces));
    if (this.redoStack.length > this.limit) this.redoStack.shift();
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
