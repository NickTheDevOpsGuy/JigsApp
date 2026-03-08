import { useRef } from "react";
import { logger } from "@/utils/logger";

type FrameSampleState = {
  samples: number[];
  rollbackUntilMs: number;
  lastLogAtMs: number;
};

const SAMPLE_WINDOW = 120;
const LONG_FRAME_MS = 32;
const AVG_FRAME_THRESHOLD = 20;
const LONG_FRAME_RATIO_THRESHOLD = 0.18;
const ROLLBACK_MS = 3000;
const LOG_INTERVAL_MS = 4000;

export function useDevFrameSampler() {
  const stateRef = useRef<FrameSampleState>({
    samples: [],
    rollbackUntilMs: 0,
    lastLogAtMs: 0,
  });

  return {
    shouldRollback(dtMs: number, isDragging: boolean, pieceCount: number): boolean {
      if (!import.meta.env.DEV) return false;

      const now = performance.now();
      const state = stateRef.current;
      if (dtMs > 0) {
        state.samples.push(dtMs);
        if (state.samples.length > SAMPLE_WINDOW) state.samples.shift();
      }

      if (state.samples.length >= 45) {
        const sum = state.samples.reduce((acc, v) => acc + v, 0);
        const avg = sum / state.samples.length;
        const longCount = state.samples.filter((v) => v >= LONG_FRAME_MS).length;
        const longRatio = longCount / state.samples.length;

        if (avg >= AVG_FRAME_THRESHOLD || longRatio >= LONG_FRAME_RATIO_THRESHOLD) {
          state.rollbackUntilMs = now + ROLLBACK_MS;
          if (now - state.lastLogAtMs >= LOG_INTERVAL_MS) {
            logger.warn(
              `[Phuzzle] dev rollback on (avg=${avg.toFixed(1)}ms, long=${(
                longRatio * 100
              ).toFixed(1)}%, dragging=${isDragging}, pieces=${pieceCount})`,
            );
            state.lastLogAtMs = now;
          }
        }
      }

      return now < state.rollbackUntilMs;
    },
  };
}
