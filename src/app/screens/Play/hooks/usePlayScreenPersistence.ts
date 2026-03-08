/**
 * PlayScreen persistence: auto-save, co-op push/apply, tab-hide flush + abandon analytics.
 */
import React, { useEffect, useRef } from "react";
import posthog from "posthog-js";
import type { PuzzleState } from "@/puzzle/types";
import { savePuzzleState } from "@/puzzle/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { logger } from "@/utils/logger";
import { STORAGE_KEY } from "../playScreenUtils";
import type { PuzzleSessionState } from "@/services/puzzleSessionService";

const SAVE_DEBOUNCE_MS = 500;
const SAVE_EVERY_N_MOVES = 3;

export type UsePlayScreenPersistenceParams = {
  state: PuzzleState | null;
  elapsedSeconds: number;
  sessionId: string | null;
  pushState: (
    pieces: PuzzleState["pieces"],
    elapsed: number,
    isComplete: boolean,
  ) => void;
  remoteState: PuzzleSessionState | null;
  manager: {
    restoreFromSaved: (pieces: PuzzleSessionState["pieces"]) => void;
    getState: () => PuzzleState;
  } | null;
  setState: (s: PuzzleState) => void;
  setElapsedSeconds: (n: number) => void;
  clearRemoteState: () => void;
  stateRef: React.MutableRefObject<PuzzleState | null>;
  elapsedSecondsRef: React.MutableRefObject<number>;
  undoCountRef: React.MutableRefObject<number>;
  abandonCapturedRef: React.MutableRefObject<boolean>;
};

export function usePlayScreenPersistence({
  state,
  elapsedSeconds,
  sessionId,
  pushState,
  remoteState,
  manager,
  setState,
  setElapsedSeconds,
  clearRemoteState,
  stateRef,
  elapsedSecondsRef,
  undoCountRef,
  abandonCapturedRef,
}: UsePlayScreenPersistenceParams): void {
  const lastSavedPlacedCountRef = useRef(0);

  useEffect(() => {
    if (!state || state.isComplete) return;
    const url = safeLocalStorage.getItem(STORAGE_KEY) || "";
    if (!url) return;
    const placed = state.placedCount ?? 0;
    const movesSinceSave = placed - lastSavedPlacedCountRef.current;
    if (movesSinceSave >= SAVE_EVERY_N_MOVES) {
      savePuzzleState(url, state.grid, state.pieces, elapsedSeconds);
      lastSavedPlacedCountRef.current = placed;
      return;
    }
    const id = setTimeout(
      () => savePuzzleState(url, state.grid, state.pieces, elapsedSeconds),
      SAVE_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [state, elapsedSeconds]);

  useEffect(() => {
    if (!sessionId || !state || state.isComplete) return;
    pushState(state.pieces, elapsedSeconds, state.isComplete);
  }, [sessionId, state, elapsedSeconds, pushState]);

  useEffect(() => {
    if (!remoteState || !manager) return;
    try {
      manager.restoreFromSaved(remoteState.pieces);
      setState(manager.getState());
      setElapsedSeconds(remoteState.elapsedSeconds);
      clearRemoteState();
    } catch (e) {
      logger.warn("Failed to apply remote state:", e);
      clearRemoteState();
    }
  }, [remoteState, manager, setState, setElapsedSeconds, clearRemoteState]);

  useEffect(() => {
    const flush = () => {
      const s = stateRef.current;
      if (!s || s.isComplete) return;
      const url = safeLocalStorage.getItem(STORAGE_KEY) || "";
      if (!url) return;
      savePuzzleState(url, s.grid, s.pieces, elapsedSecondsRef.current);
      const placed = s.placedCount ?? 0;
      const total = s.totalCount ?? 1;
      const elapsed = elapsedSecondsRef.current;
      const undos = undoCountRef.current;
      const pct = total > 0 ? (placed / total) * 100 : 0;
      const looksAbandoned =
        placed === 0 ||
        (elapsed < 45 && pct < 5) ||
        (undos > 0 && placed > 0 && undos >= placed * 2);
      if (looksAbandoned && !abandonCapturedRef.current) {
        abandonCapturedRef.current = true;
        posthog.capture("puzzle_abandoned", {
          placed_count: placed,
          total_count: total,
          elapsed_seconds: elapsed,
          undo_count: undos,
          grid: s.grid ? `${s.grid.rows}x${s.grid.cols}` : "unknown",
        });
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => flush();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [stateRef, elapsedSecondsRef, undoCountRef, abandonCapturedRef]);
}
