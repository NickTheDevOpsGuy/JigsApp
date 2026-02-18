/**
 * usePlayScreenEffects – milestones, completion analytics, toast timeouts.
 * Preserves state?.placedCount and state?.isComplete for winner detection.
 */
import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import type { PuzzleState } from "@/puzzle/types";
import { consumeCurrentPuzzleId, recordPuzzleCompletion } from "@/data/packCompletion";

const MILESTONE_THRESHOLDS = [25, 33, 50, 66, 75] as const;
const MILESTONE_MESSAGES: Record<number, string> = {
  25: "🥉 25% Early win.",
  33: "📈 33% Making progress.",
  50: "🥈 50% Big motivation spike.",
  66: "💪 66% Momentum building.",
  75: "🥇 75% Almost there!",
};

type Options = {
  state: PuzzleState | null;
  puzzleKey: number;
  elapsedSeconds: number;
  sessionId: string | null;
  isCoarsePointer: boolean;
  timeMode: string;
  milestoneMessage: string | null;
  setMilestoneMessage: (m: string | null) => void;
  showStreakToast: boolean;
  setShowStreakToast: (v: boolean) => void;
  shareToast: string | null;
  setShareToast: (v: string | null) => void;
};

export function usePlayScreenEffects({
  state,
  puzzleKey,
  elapsedSeconds,
  sessionId,
  isCoarsePointer,
  timeMode,
  milestoneMessage,
  setMilestoneMessage,
  showStreakToast,
  setShowStreakToast,
  shareToast,
  setShareToast,
}: Options) {
  const lastMilestoneRef = useRef(0);
  const firstSnapCapturedRef = useRef(false);
  const onFireCapturedRef = useRef(false);
  const completionCapturedRef = useRef(false);

  useEffect(() => {
    if (!state || state.isComplete) return;
    const placed = state.placedCount ?? 0;
    const total = state.totalCount ?? 0;
    if (total === 0) return;
    const pct = (placed / total) * 100;
    const hit = MILESTONE_THRESHOLDS.find(
      (t) => pct >= t && lastMilestoneRef.current < t,
    );
    if (hit) {
      lastMilestoneRef.current = hit;
      setMilestoneMessage(MILESTONE_MESSAGES[hit]);
      const g = state.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("milestone_popup_shown", {
        milestone_percent: hit,
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
      });
    }
  }, [
    state?.placedCount,
    state?.totalCount,
    state?.isComplete,
    state?.grid,
    isCoarsePointer,
    timeMode,
  ]);

  useEffect(() => {
    if (!milestoneMessage) return;
    const t = setTimeout(() => setMilestoneMessage(null), 2000);
    return () => clearTimeout(t);
  }, [milestoneMessage, setMilestoneMessage]);

  useEffect(() => {
    if (!state) return;
    if (state.placedCount === 0) lastMilestoneRef.current = 0;
  }, [state?.placedCount, puzzleKey]);

  useEffect(() => {
    if (!state?.isComplete) return;
    const puzzleId = consumeCurrentPuzzleId();
    if (puzzleId) recordPuzzleCompletion(puzzleId);
    if (!completionCapturedRef.current) {
      completionCapturedRef.current = true;
      const g = state?.grid;
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
  ]);

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
  }, [showStreakToast, state?.grid, isCoarsePointer, timeMode]);

  useEffect(() => {
    if (!showStreakToast) return;
    const t = setTimeout(() => setShowStreakToast(false), 2000);
    return () => clearTimeout(t);
  }, [showStreakToast]);

  useEffect(() => {
    if (!shareToast) return;
    const t = setTimeout(() => setShareToast(null), 3000);
    return () => clearTimeout(t);
  }, [shareToast]);

  useEffect(() => {
    if (!state || firstSnapCapturedRef.current) return;
    const placed = state.placedCount ?? 0;
    if (placed >= 1) {
      firstSnapCapturedRef.current = true;
      const g = state.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("first_piece_placed", {
        time_to_first_snap_seconds: elapsedSeconds,
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
      });
    }
  }, [state?.placedCount, state?.grid, elapsedSeconds, isCoarsePointer, timeMode]);

  useEffect(() => {
    firstSnapCapturedRef.current = false;
    onFireCapturedRef.current = false;
    completionCapturedRef.current = false;
  }, [puzzleKey]);
}
