/**
 * usePlayScreenMilestones – milestone callouts at 25%, 33%, 50%, 66%, 75%.
 * Returns the current milestone message (or null) and manages auto-dismiss + analytics.
 */
import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import type { PuzzleState } from "@/puzzle/types";

const MILESTONE_THRESHOLDS = [25, 33, 50, 66, 75] as const;
const MILESTONE_MESSAGES: Record<number, string> = {
  25: "🥉 25% Early win.",
  33: "📈 33% Making progress.",
  50: "🥈 50% Big motivation spike.",
  66: "💪 66% Momentum building.",
  75: "🥇 75% Almost there!",
};

export function usePlayScreenMilestones(
  state: PuzzleState | null,
  puzzleKey: string | number,
  isCoarsePointer: boolean,
  timeMode: string,
): string | null {
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
  const lastMilestoneRef = useRef<number>(0);

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
  }, [milestoneMessage]);

  useEffect(() => {
    if (!state) return;
    if (state.placedCount === 0) lastMilestoneRef.current = 0;
  }, [state?.placedCount, puzzleKey]);

  return milestoneMessage;
}
