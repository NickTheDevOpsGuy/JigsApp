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
  };
  onDownloadImage: () => void;
  onClose: () => void;
  usedHint: boolean;
  isDaily: boolean;
  onGoHome?: () => void;
  onPlayAgain?: () => void;
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
  onGoHome,
  onPlayAgain,
}: CompletionOverlayGateProps) {
  if (!show || !state) return null;

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
      canNativeShare={share.canNativeShare}
      onCopyResults={share.handleCopyResults}
      onNativeShare={share.handleNativeShare}
      onDownloadImage={onDownloadImage}
      onClose={onClose}
      onGoHome={onGoHome}
      onPlayAgain={onPlayAgain}
    />
  );
}
