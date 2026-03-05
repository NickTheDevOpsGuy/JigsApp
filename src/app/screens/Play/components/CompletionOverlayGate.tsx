/**
 * CompletionOverlayGate – renders CompletionOverlay when puzzle is complete and not dismissed.
 * Keeps PlayScreen.tsx shorter by encapsulating the overlay props.
 */
import type { Piece, PuzzleState } from "@/puzzle/types";
import { CompletionOverlay } from "./CompletionOverlay";

export type VisualModifier = "none" | "fog" | "night" | "sepia";
export type PieceCutType = "classic" | "irregular" | "hard";

interface CompletionOverlayGateProps {
  show: boolean;
  elapsedSeconds: number;
  state: PuzzleState | null;
  imageUrl: string | undefined;
  undoCount: number;
  moveCount: number;
  dailyVisualModifier: VisualModifier;
  pieceCutType: PieceCutType;
  isNewBest: boolean;
  /** Path to this puzzle for share link (e.g. /daily or /play?session=xxx). */
  puzzleShareUrl: string;
  share: {
    copied: boolean;
    canNativeShare: boolean;
    handleCopyResults: () => void;
    handleNativeShare: () => void;
    handleCopyChallenge: () => void;
    handleNativeChallengeShare: () => void;
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
}

export function CompletionOverlayGate({
  show,
  elapsedSeconds,
  state,
  imageUrl,
  undoCount,
  moveCount,
  dailyVisualModifier,
  pieceCutType,
  isNewBest,
  puzzleShareUrl,
  share,
  onDownloadImage,
  onClose,
  usedHint,
  isDaily,
  precisionModeEnabled,
  precisionSnaps = [],
  adaptivePersonalityEnabled,
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
      accuracyPercent={accuracyPercent}
      usedHint={usedHint}
      visualModifier={dailyVisualModifier}
      isNewBest={isNewBest}
      isDaily={isDaily}
      cutType={pieceCutType}
      puzzleShareUrl={puzzleShareUrl}
      copied={share.copied}
      onShareProgress={share.handleNativeShare}
      onShareChallenge={share.handleNativeChallengeShare}
      onCopyProgress={share.handleCopyResults}
      onCopyChallenge={share.handleCopyChallenge}
      onDownloadImage={onDownloadImage}
      onClose={onClose}
      precisionModeEnabled={precisionModeEnabled}
      avgPrecisionPx={avgPrecisionPx}
      precisionBonusPoints={precisionBonusPoints}
      uiTone={uiTone}
    />
  );
}
