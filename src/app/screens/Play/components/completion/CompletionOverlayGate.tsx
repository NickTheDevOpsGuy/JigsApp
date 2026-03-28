/**
 * CompletionOverlayGate renders the win overlay only when the solved puzzle should
 * still be visible, so the main Play screen can treat it as one derived overlay prop.
 */
import type React from "react";
import type { PuzzleState } from "@/puzzle/core/types";
import { CompletionOverlay } from "@/screens/Play/components/completion/CompletionOverlay";

export type VisualModifier = "none" | "fog" | "night" | "sepia";
export type PieceCutType = "classic" | "irregular" | "hard";

interface CompletionOverlayGateProps {
  show: boolean;
  elapsedSeconds: number;
  state: PuzzleState | null;
  imageUrl: string | undefined;
  undoCount: number;
  moveCount: number;
  rotationCount?: number;
  maxGroupSize?: number;
  dailyVisualModifier: VisualModifier;
  pieceCutType: PieceCutType;
  isNewBest: boolean;
  /** Path to this puzzle for share link (e.g. /daily or /play?session=xxx). */
  puzzleShareUrl: string;
  puzzleName?: string;
  share: {
    handleCopyResults: () => void;
    handleNativeShare: () => void;
    handleCopyChallenge: () => void;
    handleNativeChallengeShare: (challengeUrl?: string) => void;
    setShareToast: (message: string | null) => void;
  };
  onClose: () => void;
  usedHint: boolean;
  isDaily: boolean;
  /** Replay: show Replay button; on click dismiss overlay and start playback. */
  canReplay?: boolean;
  onReplayClick?: () => void;
  /** Next Puzzle: primary CTA to start a new puzzle. */
  onNextPuzzle?: () => void;
  nextPuzzleLabel?: string;
  /** Ref for focus return when coming back from replay (e.g. close button). */
  focusReturnRef?: React.RefObject<HTMLButtonElement>;
  /** Called after Supabase completion record (e.g. for 7-day streak toast). */
  onCompletionRecorded?: (stats: { dailyStreak: number }) => void;
  /** Called once when overlay is shown with a new personal best (e.g. haptic). */
  onNewBest?: () => void;
  /** Center the win dialog on the puzzle board (viewport-fixed, measured async). */
  boardAnchorRef?: React.RefObject<HTMLElement | null>;
  borderFrameBonus?: boolean;
  quadrantTimes?: Record<0 | 1 | 2 | 3, number | null>;
}

export function CompletionOverlayGate({
  show,
  elapsedSeconds,
  state,
  imageUrl,
  undoCount,
  moveCount,
  rotationCount = 0,
  maxGroupSize = 0,
  dailyVisualModifier,
  pieceCutType,
  isNewBest,
  puzzleShareUrl,
  puzzleName,
  share,
  onClose,
  usedHint,
  isDaily,
  canReplay = false,
  onReplayClick,
  onNextPuzzle,
  nextPuzzleLabel,
  focusReturnRef,
  onCompletionRecorded,
  onNewBest,
  boardAnchorRef,
  borderFrameBonus = false,
  quadrantTimes,
}: CompletionOverlayGateProps) {
  if (!show || !state) return null;

  const accuracyPercent =
    state.totalCount && state.totalCount > 0
      ? Math.round((state.totalCount / Math.max(moveCount, state.totalCount)) * 100)
      : 100;

  const movesPerMin = moveCount / Math.max(0.1, elapsedSeconds / 60);

  return (
    <CompletionOverlay
      elapsedSeconds={elapsedSeconds}
      grid={state.grid}
      imageUrl={imageUrl}
      undoCount={undoCount}
      moveCount={moveCount}
      piecesPerMin={movesPerMin}
      rotationCount={rotationCount}
      maxGroupSize={maxGroupSize}
      accuracyPercent={accuracyPercent}
      usedHint={usedHint}
      visualModifier={dailyVisualModifier}
      isNewBest={isNewBest}
      onCompletionRecorded={onCompletionRecorded}
      onNewBest={onNewBest}
      isDaily={isDaily}
      cutType={pieceCutType}
      puzzleShareUrl={puzzleShareUrl}
      puzzleName={puzzleName}
      onShareProgress={share.handleNativeShare}
      onShareChallenge={share.handleNativeChallengeShare}
      onCopyProgress={share.handleCopyResults}
      onCopyChallenge={share.handleCopyChallenge}
      setShareToast={share.setShareToast}
      onClose={onClose}
      canReplay={canReplay}
      onReplayClick={onReplayClick}
      onNextPuzzle={onNextPuzzle}
      nextPuzzleLabel={nextPuzzleLabel}
      focusReturnRef={focusReturnRef}
      boardAnchorRef={boardAnchorRef}
      borderFrameBonus={borderFrameBonus}
      quadrantTimes={quadrantTimes}
    />
  );
}
