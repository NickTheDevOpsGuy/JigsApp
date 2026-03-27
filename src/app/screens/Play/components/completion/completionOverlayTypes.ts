import type React from "react";

export type PieceCutType = "classic" | "irregular" | "hard";
export type VisualModifier = "none" | "fog" | "night" | "sepia";

export interface CompletionOverlayProps {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  undoCount?: number;
  moveCount?: number;
  piecesPerMin?: number;
  rotationCount?: number;
  maxGroupSize?: number;
  accuracyPercent?: number;
  usedHint?: boolean;
  visualModifier?: VisualModifier;
  isNewBest?: boolean;
  isDaily?: boolean;
  cutType?: PieceCutType;
  puzzleShareUrl?: string;
  ensureChallengeShareUrl?: () => Promise<string>;
  puzzleName?: string;
  copied?: boolean;
  canNativeShare?: boolean;
  onShareProgress?: () => void;
  onShareChallenge?: (challengeUrl?: string) => void;
  onCopyProgress?: () => void;
  onCopyChallenge?: (challengeUrl?: string) => void;
  onClose: () => void;
  canReplay?: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
  nextPuzzleLabel?: string;
  /** Ref for focus return when coming back from replay (e.g. close button). */
  focusReturnRef?: React.RefObject<HTMLButtonElement>;
  /** Called after Supabase completion record (e.g. for streak milestone toast). */
  onCompletionRecorded?: (stats: { dailyStreak: number }) => void;
  /** Called once when overlay is shown with a new personal best (e.g. haptic). */
  onNewBest?: () => void;
}
