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
  puzzleName?: string;
  onShareProgress?: () => void;
  onShareChallenge?: (challengeUrl?: string) => void;
  onCopyProgress?: () => void;
  onCopyChallenge?: (challengeUrl?: string) => void;
  /** Toast line for share failures (Play screen `shareToast`). */
  setShareToast?: (message: string | null) => void;
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
  boardAnchorRef?: React.RefObject<HTMLElement | null>;
  /** Perimeter frame completed this session (XP bonus + summary chip). */
  borderFrameBonus?: boolean;
  /** When each quarter of the board was fully finished (slowest-first summary on win). */
  quadrantTimes?: Record<0 | 1 | 2 | 3, number | null>;
  /** Challenge target from shared challenge links. */
  challengeTarget?: {
    elapsedSeconds: number;
    moveCount: number | null;
  } | null;
  isPackPuzzle?: boolean;
}
