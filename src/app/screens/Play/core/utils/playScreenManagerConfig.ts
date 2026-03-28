import type { MutableRefObject } from "react";
import type { SavedPiece } from "@/puzzle/storage/puzzleStorage";
import type { PuzzleState } from "@/puzzle/core/types";
import type { Theme } from "@/hooks/useTheme";

export function buildPlayScreenManagerConfig(args: {
  haptic?: (kind: "place" | "snap" | "rotate" | "lock") => void;
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
  quadrantCompleteSeenRef?: MutableRefObject<Set<0 | 1 | 2 | 3>>;
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
    quadrantCompleteSeenRef,
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
    quadrantCompleteSeenRef,
    onPieceSnappedAnalytics,
    onPrecisionSnap,
    dynamicDifficultyMultiplierRef,
    onRecordReplaySnapshot,
    stateRef,
  };
}
