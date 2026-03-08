import type { MutableRefObject } from "react";
import type { SavedPiece } from "@/puzzle/storage/puzzleStorage";
import type { Theme } from "@/hooks/useTheme";
import type { PuzzleState } from "@/puzzle/core/types";

export type ResumeChoice = "resume" | "fresh" | null;

export type PlayScreenManagerOptions = {
  initialSessionPieces?: SavedPiece[];
  haptic?: (kind: "place" | "snap" | "rotate") => void;
  themeRef?: MutableRefObject<Theme | undefined>;
  onPlacementStreak?: () => void;
  snapScaleRef?: MutableRefObject<number>;
  snapToleranceOverride?: number;
  onSnapCheck?: () => void;
  wrongRotationHintRef?: MutableRefObject<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>;
  dragStartTimeRef?: MutableRefObject<number | null>;
  onPieceSnappedAnalytics?: (timeToSnapMs: number) => void;
  batterySaverMode?: boolean;
  relaxedModeEnabled?: boolean;
  elapsedSecondsRef?: MutableRefObject<number>;
  onQuadrantPlaced?: (quadrant: 0 | 1 | 2 | 3, elapsedSeconds: number) => void;
  onPrecisionSnap?: (precisionPx: number) => void;
  dynamicDifficultyMultiplierRef?: MutableRefObject<number>;
  onRecordReplaySnapshot?: () => void;
  stateRef?: MutableRefObject<PuzzleState | null>;
};
