import type { Piece } from "@/puzzle/types";

export type PieceCutType = "classic" | "irregular" | "hard";
export type VisualModifier = "none" | "fog" | "night" | "sepia";

export interface CompletionOverlayProps {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  pieces?: Piece[];
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
  copied?: boolean;
  canNativeShare?: boolean;
  onShareProgress?: () => void;
  onShareChallenge?: () => void;
  onCopyProgress?: () => void;
  onCopyChallenge?: () => void;
  onDownloadImage: () => void;
  onClose: () => void;
  precisionModeEnabled?: boolean;
  avgPrecisionPx?: number | null;
  precisionBonusPoints?: number | null;
  uiTone?: "competitive" | "calm";
  canReplay?: boolean;
  onReplayClick?: () => void;
  onNextPuzzle?: () => void;
}
