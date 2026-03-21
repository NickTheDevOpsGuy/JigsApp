/**
 * CompletionOverlayGate – renders CompletionOverlay when puzzle is complete and not dismissed.
 * Keeps PlayScreen.tsx shorter by encapsulating the overlay props.
 */
import type { Piece, PuzzleState } from "@/puzzle/core/types";
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
    copied: boolean;
    canNativeShare: boolean;
    handleCopyResults: () => void;
    handleNativeShare: () => void;
    handleCopyChallenge: () => void;
    handleNativeChallengeShare: (challengeUrl?: string) => void;
    getProgressShareTextWithUrl: () => string;
    getChallengeShareTextWithUrl: (challengeUrl?: string) => string;
  };
  onDownloadImage: () => void;
  onClose: () => void;
  usedHint: boolean;
  isDaily: boolean;
  /** Precision Mode: show snap precision and bonus rank points */
  precisionModeEnabled?: boolean;
  precisionSnaps?: number[];
  /** Adaptive Personality: derive UI tone from pace for microcopy */
  adaptivePersonalityEnabled?: boolean;
  /** Replay: show Replay button; on click dismiss overlay and start playback. */
  canReplay?: boolean;
  onReplayClick?: () => void;
  /** Next Puzzle: primary CTA to start a new puzzle. */
  onNextPuzzle?: () => void;
  /** Ref for focus return when coming back from replay (e.g. close button). */
  focusReturnRef?: React.RefObject<HTMLButtonElement>;
  /** Called after Supabase completion record (e.g. for 7-day streak toast). */
  onCompletionRecorded?: (stats: { dailyStreak: number }) => void;
  /** Called once when overlay is shown with a new personal best (e.g. haptic). */
  onNewBest?: () => void;
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
  onDownloadImage,
  onClose,
  usedHint,
  isDaily,
  precisionModeEnabled,
  precisionSnaps = [],
  adaptivePersonalityEnabled,
  canReplay = false,
  onReplayClick,
  onNextPuzzle,
  focusReturnRef,
  onCompletionRecorded,
  onNewBest,
}: CompletionOverlayGateProps) {
  if (!show || !state) return null;

  const movesPerMin = moveCount / Math.max(0.1, elapsedSeconds / 60);
  const uiTone =
    adaptivePersonalityEnabled && elapsedSeconds >= 5
      ? movesPerMin >= 6
        ? ("competitive" as const)
        : ("calm" as const)
      : undefined;

  const precisionCount = precisionSnaps.length;
  const avgPrecisionPx =
    precisionCount > 0
      ? precisionSnaps.reduce((a, b) => a + b, 0) / precisionCount
      : null;
  const precisionBonusPoints =
    precisionModeEnabled && avgPrecisionPx != null
      ? Math.max(0, Math.round(30 - avgPrecisionPx))
      : null;

  const accuracyPercent =
    state.totalCount && state.totalCount > 0
      ? Math.round((state.totalCount / Math.max(moveCount, state.totalCount)) * 100)
      : 100;

  return (
    <CompletionOverlay
      elapsedSeconds={elapsedSeconds}
      grid={state.grid}
      pieces={(state.pieces ?? []) as Piece[]}
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
      copied={share.copied}
      canNativeShare={share.canNativeShare}
      onShareProgress={share.handleNativeShare}
      onShareChallenge={share.handleNativeChallengeShare}
      onCopyProgress={share.handleCopyResults}
      onCopyChallenge={share.handleCopyChallenge}
      shareProgressText={share.getProgressShareTextWithUrl()}
      shareChallengeText={share.getChallengeShareTextWithUrl()}
      onDownloadImage={onDownloadImage}
      onClose={onClose}
      precisionModeEnabled={precisionModeEnabled}
      avgPrecisionPx={avgPrecisionPx}
      precisionBonusPoints={precisionBonusPoints}
      uiTone={uiTone}
      canReplay={canReplay}
      onReplayClick={onReplayClick}
      onNextPuzzle={onNextPuzzle}
      focusReturnRef={focusReturnRef}
    />
  );
}
