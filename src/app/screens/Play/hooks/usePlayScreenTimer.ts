/**
 * usePlayScreenTimer – elapsed/countdown/active ticks; auto-pause on countdown expiry.
 */
import { useEffect } from "react";
import { ACTIVE_IDLE_MS } from "../timeMode";
import type { TimeMode } from "../timeMode";
import type { PuzzleState } from "@/puzzle/types";

export function usePlayScreenTimer(args: {
  state: PuzzleState | null;
  isPaused: boolean;
  setIsPaused: (fn: (p: boolean) => boolean) => void;
  timeMode: TimeMode;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
  lastInteractionRef: React.MutableRefObject<number>;
}) {
  const {
    state,
    isPaused,
    setIsPaused,
    timeMode,
    setElapsedSeconds,
    lastInteractionRef,
  } = args;

  useEffect(() => {
    if (
      timeMode === "countdown" &&
      args.elapsedSeconds <= 0 &&
      !state?.isComplete &&
      !isPaused
    ) {
      setIsPaused(() => true);
    }
  }, [timeMode, args.elapsedSeconds, state?.isComplete, isPaused, setIsPaused]);

  useEffect(() => {
    if (state?.isComplete || isPaused) return;
    const isCountdown = timeMode === "countdown";
    const isActive = timeMode === "active";

    const id = setInterval(() => {
      setElapsedSeconds((s) => {
        if (isCountdown) {
          if (s <= 0) return 0;
          return s - 1;
        }
        if (isActive) {
          const idle = performance.now() - lastInteractionRef.current;
          if (idle > ACTIVE_IDLE_MS) return s;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state?.isComplete, isPaused, timeMode, setElapsedSeconds, lastInteractionRef]);
}
