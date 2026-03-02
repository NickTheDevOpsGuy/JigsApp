/**
 * Secondary effects for PlayScreen: completion analytics, toast timeouts,
 * reset refs on puzzle change, and drift interval. Selection auto-clear
 * stays in PlayScreen so it can use onExtendSelection.
 */
import React, { useEffect } from "react";
import posthog from "posthog-js";
import { consumeCurrentPuzzleId, recordPuzzleCompletion } from "@/data/packCompletion";
import { recordCompletion as recordAdaptiveCompletion } from "@/services/adaptiveDifficultyService";
import type { PuzzleState } from "@/puzzle/types";

export interface UsePlayScreenSecondaryEffectsParams {
  state: PuzzleState | null;
  puzzleKey: string | null;
  elapsedSeconds: number;
  sessionId: string | null;
  isCoarsePointer: boolean;
  timeMode: string;
  showStreakToast: boolean;
  setShowStreakToast: (v: boolean) => void;
  shareToast: string | null;
  setShareToast: (v: string | null) => void;
  driftModeEnabled: boolean;
  manager: { getState: () => PuzzleState; driftUnplacedPieces: () => void } | null;
  setState: (s: PuzzleState) => void;
  isPaused: boolean;
  completionCapturedRef: React.MutableRefObject<boolean>;
  onFireCapturedRef: React.MutableRefObject<boolean>;
  firstSnapCapturedRef: React.MutableRefObject<boolean>;
  zoomOnCompleteRunRef: React.MutableRefObject<boolean>;
  stateRef: React.MutableRefObject<PuzzleState | null>;
}

export function usePlayScreenSecondaryEffects({
  state,
  puzzleKey,
  elapsedSeconds,
  sessionId,
  isCoarsePointer,
  timeMode,
  showStreakToast,
  setShowStreakToast,
  shareToast,
  setShareToast,
  driftModeEnabled,
  manager,
  setState,
  isPaused,
  completionCapturedRef,
  onFireCapturedRef,
  firstSnapCapturedRef,
  zoomOnCompleteRunRef,
  stateRef,
}: UsePlayScreenSecondaryEffectsParams) {
  // Completion: pack completion, adaptive difficulty, posthog
  useEffect(() => {
    if (!state?.isComplete) return;
    const puzzleId = consumeCurrentPuzzleId();
    if (puzzleId) recordPuzzleCompletion(puzzleId);
    const g = state?.grid;
    if (g) {
      recordAdaptiveCompletion(g.rows, g.cols, elapsedSeconds);
    }
    if (!completionCapturedRef.current) {
      completionCapturedRef.current = true;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("puzzle_complete", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
        elapsed_seconds: elapsedSeconds,
      });
      if (sessionId) {
        posthog.capture("coop_session_completed", {
          grid_size: gridSize,
          device_type: isCoarsePointer ? "mobile" : "desktop",
          elapsed_seconds: elapsedSeconds,
        });
      }
    }
  }, [
    state?.isComplete,
    state?.grid,
    elapsedSeconds,
    isCoarsePointer,
    timeMode,
    sessionId,
    completionCapturedRef,
  ]);

  // Analytics: on_fire_toast_shown
  useEffect(() => {
    if (showStreakToast && !onFireCapturedRef.current) {
      onFireCapturedRef.current = true;
      const g = state?.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("on_fire_toast_shown", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
      });
    }
  }, [showStreakToast, state?.grid, isCoarsePointer, timeMode, onFireCapturedRef]);

  // Hint/toast screens auto-dismiss after 3 seconds
  const HINT_DISMISS_MS = 3_000;
  useEffect(() => {
    if (!showStreakToast) return;
    const t = setTimeout(() => setShowStreakToast(false), HINT_DISMISS_MS);
    return () => clearTimeout(t);
  }, [showStreakToast, setShowStreakToast]);

  useEffect(() => {
    if (!shareToast) return;
    const t = setTimeout(() => setShareToast(null), HINT_DISMISS_MS);
    return () => clearTimeout(t);
  }, [shareToast, setShareToast]);

  // Reset analytics refs when starting a new puzzle
  useEffect(() => {
    firstSnapCapturedRef.current = false;
    onFireCapturedRef.current = false;
    completionCapturedRef.current = false;
    zoomOnCompleteRunRef.current = false;
  }, [
    puzzleKey,
    firstSnapCapturedRef,
    onFireCapturedRef,
    completionCapturedRef,
    zoomOnCompleteRunRef,
  ]);

  // Drift mode: nudge unplaced pieces every ~10s
  useEffect(() => {
    const complete = state?.isComplete ?? false;
    if (!driftModeEnabled || !manager || complete || isPaused) return;
    const id = setInterval(() => {
      if (!manager || stateRef.current?.isComplete) return;
      manager.driftUnplacedPieces();
      setState(manager.getState());
    }, 10000);
    return () => clearInterval(id);
  }, [driftModeEnabled, manager, state?.isComplete, isPaused, setState, stateRef]);
}
