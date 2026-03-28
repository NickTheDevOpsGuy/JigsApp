/**
 * Toast + ref when the player first completes the full border (perimeter) this session.
 * Ref is consumed at win for a small XP bonus; baseline handles save restore.
 */
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import posthog from "posthog-js";
import type { PuzzleState } from "@/puzzle/core/types";
import { areAllBorderPiecesCorrect } from "@/puzzle/manager/state/borderFrame";

export function useBorderFrameMilestone(
  state: PuzzleState | null,
  puzzleKey: string | number | null,
  isCoarsePointer: boolean,
  timeMode: string,
  borderFrameBonusEarnedRef: MutableRefObject<boolean>,
): string | null {
  const [message, setMessage] = useState<string | null>(null);
  const prevBorderCompleteRef = useRef(false);
  const baselineKeyRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (!state || puzzleKey == null) return;

    const keyChanged = baselineKeyRef.current !== puzzleKey;
    if (keyChanged) {
      baselineKeyRef.current = puzzleKey;
      prevBorderCompleteRef.current = areAllBorderPiecesCorrect(state.pieces, state.grid);
      borderFrameBonusEarnedRef.current = false;
      setMessage(null);
      return;
    }

    const ok = areAllBorderPiecesCorrect(state.pieces, state.grid);
    if (!ok && prevBorderCompleteRef.current) {
      borderFrameBonusEarnedRef.current = false;
    }
    if (ok && !prevBorderCompleteRef.current) {
      borderFrameBonusEarnedRef.current = true;
      if (!state.isComplete) {
        setMessage("🖼️ Frame complete — every edge piece locked in!");
        posthog.capture("border_frame_milestone", {
          grid_size: `${state.grid.rows}x${state.grid.cols}`,
          device_type: isCoarsePointer ? "mobile" : "desktop",
          time_mode: timeMode,
        });
      }
    }
    prevBorderCompleteRef.current = ok;
  }, [state, puzzleKey, isCoarsePointer, timeMode, borderFrameBonusEarnedRef]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  return message;
}
