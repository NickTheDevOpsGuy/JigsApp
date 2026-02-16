/**
 * undoManager – limited undo/redo stack for piece moves.
 */
import type { SavedPiece } from "./puzzleStorage";
import type { Piece } from "./types";

const DEFAULT_LIMIT = 30;

/** Generic limited stack - pushes with cap, pops from top. */
function createLimitedStack<T>(limit: number) {
  const stack: T[] = [];
  return {
    push(item: T) {
      stack.push(item);
      if (stack.length > limit) stack.shift();
    },
    pop(): T | null {
      return stack.length === 0 ? null : (stack.pop() ?? null);
    },
    canPop(): boolean {
      return stack.length > 0;
    },
    clear() {
      stack.length = 0;
    },
  };
}

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
  private readonly undoStack: ReturnType<typeof createLimitedStack<SavedPiece[]>>;
  private readonly redoStack: ReturnType<typeof createLimitedStack<SavedPiece[]>>;

  constructor(limit = DEFAULT_LIMIT) {
    this.undoStack = createLimitedStack<SavedPiece[]>(limit);
    this.redoStack = createLimitedStack<SavedPiece[]>(limit);
  }

  push(pieces: Piece[]): void {
    this.undoStack.push(piecesToSaved(pieces));
    this.redoStack.clear();
  }

  pop(): SavedPiece[] | null {
    return this.undoStack.pop();
  }

  canUndo(): boolean {
    return this.undoStack.canPop();
  }

  pushRedo(pieces: Piece[]): void {
    this.redoStack.push(piecesToSaved(pieces));
  }

  popRedo(): SavedPiece[] | null {
    return this.redoStack.pop();
  }

  canRedo(): boolean {
    return this.redoStack.canPop();
  }

  clear(): void {
    this.undoStack.clear();
    this.redoStack.clear();
  }
}
