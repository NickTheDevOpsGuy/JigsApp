import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import type { PuzzleState } from "@/puzzle/core/types";

export interface UsePlayScreenLifecycleEffectsArgs {
  boardRef: RefObject<HTMLDivElement | null>;
  setBoardSize: (size: { w: number; h: number }) => void;
  viewport: { reset?: () => void };
  state: PuzzleState | null;
  completionDismissed: boolean;
  replayBarOpen: boolean;
  setReplayBarBoardRect: (
    rect: { top: number; left: number; width: number; height: number } | null,
  ) => void;
  puzzleKey: number | null;
  undoCountRef: MutableRefObject<number>;
  moveCountRef: MutableRefObject<number>;
  rotationCountRef: MutableRefObject<number>;
  maxGroupSizeRef: MutableRefObject<number>;
  precisionSnapsRef: MutableRefObject<number[]>;
  abandonCapturedRef: MutableRefObject<boolean>;
  usedHintRef: MutableRefObject<boolean>;
  showGhostHint: boolean;
  showGhostWhenIdle: boolean;
  setQuadrantTimes: Dispatch<SetStateAction<Record<0 | 1 | 2 | 3, number | null>>>;
  setCompletionDismissed: (v: boolean) => void;
  setCompletionImageUrl: (url: string | undefined) => void;
  setLives: Dispatch<SetStateAction<number>>;
  dynamicDifficultyEnabled: boolean;
  grid: { rows: number; cols: number } | null;
  dynamicDifficultyMultiplierRef: MutableRefObject<number>;
  getToleranceMultiplier: (rows: number, cols: number) => number;
  isHost: boolean;
  sessionIdFromUrl: string | null;
  session: { grid?: { rows: number; cols: number } } | null;
  sessionLoading: boolean;
  isCoarsePointer: boolean;
  setShowStreakToast: Dispatch<SetStateAction<boolean>>;
  setShareToast: Dispatch<SetStateAction<string | null>>;
  isPaused: boolean;
  audioManager: {
    setPaused: (p: boolean) => void;
    tryStartAmbientIfEnabled: () => void;
    leavePlayScreen: () => void;
  };
  manager: { getState: () => PuzzleState };
  recordSnapshotRef: MutableRefObject<() => void>;
  replay: { recordSnapshot: () => void };
  initialSnapshotRecordedRef: MutableRefObject<boolean>;
  replayStateRef: MutableRefObject<unknown>;
  elapsedSeconds: number;
  stateRef: MutableRefObject<PuzzleState | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  completionImageUrl: string | undefined;
  setState?: (st: PuzzleState) => void;
  setReplayBarOpen?: (open: boolean) => void;
  boardSize: { w: number; h: number };
}
