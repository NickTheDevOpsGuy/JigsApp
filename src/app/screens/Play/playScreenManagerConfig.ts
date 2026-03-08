import type { MutableRefObject } from "react";
import type { SavedPiece } from "@/puzzle/puzzleStorage";
import type { PuzzleState } from "@/puzzle/types";
import type { Theme } from "@/hooks/useTheme";

export function buildPlayScreenManagerConfig(args: {
  haptic?: (kind: "place" | "snap" | "rotate") => void;
  themeRef: MutableRefObject<Theme | undefined>;
  onPlacementStreak: () => void;
  initialSessionPieces?: SavedPiece[];
  snapScaleRef: MutableRefObject<number>;
  onSnapCheck: () => void;
  snapToleranceOverride: number;
  wrongRotationHintRef: MutableRefObject<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>;
  dragStartTimeRef: MutableRefObject<number | null>;
  batterySaverMode: boolean;
  relaxedModeEnabled: boolean;
  elapsedSecondsRef: MutableRefObject<number>;
  onQuadrantPlaced?: (q: 0 | 1 | 2 | 3, sec: number) => void;
  onPieceSnappedAnalytics: (timeToSnapMs: number) => void;
  onPrecisionSnap?: (precisionPx: number) => void;
  dynamicDifficultyMultiplierRef?: MutableRefObject<number>;
  onRecordReplaySnapshot: () => void;
  stateRef: MutableRefObject<PuzzleState | null>;
}) {
  const {
    haptic,
    themeRef,
    onPlacementStreak,
    initialSessionPieces,
    snapScaleRef,
    onSnapCheck,
    snapToleranceOverride,
    wrongRotationHintRef,
    dragStartTimeRef,
    batterySaverMode,
    relaxedModeEnabled,
    elapsedSecondsRef,
    onQuadrantPlaced,
    onPieceSnappedAnalytics,
    onPrecisionSnap,
    dynamicDifficultyMultiplierRef,
    onRecordReplaySnapshot,
    stateRef,
  } = args;
  return {
    haptic,
    themeRef,
    onPlacementStreak,
    initialSessionPieces,
    snapScaleRef,
    onSnapCheck,
    snapToleranceOverride,
    wrongRotationHintRef,
    dragStartTimeRef,
    batterySaverMode,
    relaxedModeEnabled,
    elapsedSecondsRef,
    onQuadrantPlaced,
    onPieceSnappedAnalytics,
    onPrecisionSnap,
    dynamicDifficultyMultiplierRef,
    onRecordReplaySnapshot,
    stateRef,
  };
}
