/**
 * playUtils – formatTime, createUndoRedoHandler.
 */
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Run a manager action and refresh state. Guard returns false to skip. Returns true if action ran. */
export function runManagerAction(
  manager: PuzzleManager | null,
  action: (m: PuzzleManager) => void,
  setState: (s: PuzzleState) => void,
  guard?: () => boolean,
): boolean {
  if (!manager || (guard && !guard())) return false;
  action(manager);
  setState(manager.getState());
  return true;
}

/** Captured positions for undo/redo snap-back animation */
export type UndoSnapBackFrom = Map<string, { x: number; y: number }>;

/** Undo/redo with sound and optional snap-back animation. Returns handler for use in onClick. */
export function createUndoRedoHandler(
  manager: PuzzleManager | null,
  action: "undo" | "redo",
  setState: (s: PuzzleState) => void,
  canRun: () => boolean,
  playSound: (s: "undo") => void,
  onSuccess?: () => void,
  onSnapBackAnimate?: (fromPositions: UndoSnapBackFrom) => void,
) {
  return () => {
    if (!manager || !canRun()) return;
    const state = manager.getState();
    const fromPositions = new Map<string, { x: number; y: number }>();
    for (const p of state.pieces) {
      if (!p.inTray) fromPositions.set(p.id, { x: p.x, y: p.y });
    }
    const fn =
      action === "undo" ? (m: PuzzleManager) => m.undo() : (m: PuzzleManager) => m.redo();
    if (runManagerAction(manager, fn, setState, () => canRun())) {
      playSound("undo");
      onSuccess?.();
      onSnapBackAnimate?.(fromPositions);
    }
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;

  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}
