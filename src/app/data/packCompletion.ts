/**
 * packCompletion – track completed puzzle IDs in localStorage for pack progress.
 */
const STORAGE_KEY = "phuzzle:completedPuzzles";
const CURRENT_PUZZLE_KEY = "phuzzle:currentPuzzleId";

/** Get set of completed puzzle IDs */
export function getCompletedPuzzleIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/** Record a puzzle as completed */
export function recordPuzzleCompletion(puzzleId: string): void {
  try {
    const completed = getCompletedPuzzleIds();
    completed.add(puzzleId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    /* ignore */
  }
}

/** Get progress for a pack: { completed, total } */
export function getPackProgress(puzzleIds: string[]): {
  completed: number;
  total: number;
} {
  const completed = getCompletedPuzzleIds();
  const count = puzzleIds.filter((id) => completed.has(id)).length;
  return { completed: count, total: puzzleIds.length };
}

/** Check if a pack is fully completed */
export function isPackComplete(puzzleIds: string[]): boolean {
  return getPackProgress(puzzleIds).completed === puzzleIds.length;
}

/** Store the current puzzle ID when starting (for completion tracking) */
export function setCurrentPuzzleId(puzzleId: string | null): void {
  try {
    if (puzzleId) {
      localStorage.setItem(CURRENT_PUZZLE_KEY, puzzleId);
    } else {
      localStorage.removeItem(CURRENT_PUZZLE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Get and clear the current puzzle ID (call on completion) */
export function consumeCurrentPuzzleId(): string | null {
  try {
    const id = localStorage.getItem(CURRENT_PUZZLE_KEY);
    localStorage.removeItem(CURRENT_PUZZLE_KEY);
    return id;
  } catch {
    return null;
  }
}
