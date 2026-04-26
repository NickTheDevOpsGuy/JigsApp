import React from "react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import type { PuzzleState, PieceCutType } from "@/puzzle/core/types";
import { STORAGE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { CompletionOverlayGate, ReplaySolveModal } from "@/screens/Play/components";

type CompletionProps = React.ComponentProps<typeof CompletionOverlayGate> | null;
type ReplayPortalProps = React.ComponentProps<typeof ReplaySolveModal> | null;

export function buildPlayScreenPageVisuals(args: {
  zenModeEnabled: boolean;
  dailyVisualModifier: "none" | "fog" | "night" | "sepia";
  fogStrength: number;
}): { pageClassName: string; pageStyle: React.CSSProperties | undefined } {
  const { zenModeEnabled, dailyVisualModifier, fogStrength } = args;
  const pageClassName = `${styles.page} ${zenModeEnabled ? styles.zenMode : ""} ${
    dailyVisualModifier === "fog"
      ? styles.modifierFog
      : dailyVisualModifier === "night"
        ? styles.modifierNight
        : dailyVisualModifier === "sepia"
          ? styles.modifierSepia
          : ""
  }`;
  const pageStyle: React.CSSProperties | undefined =
    dailyVisualModifier === "fog"
      ? {
          ["--fog-strength" as string]: String(Math.max(0, Math.min(0.45, fogStrength))),
        }
      : undefined;
  return { pageClassName, pageStyle };
}

export function buildCompletionProps(args: {
  /** True when we should show the win overlay (after completion animation or e2e). */
  showCompletionOverlay: boolean;
  completionDismissed: boolean;
  state: PuzzleState | null;
  displayElapsedSeconds: number;
  completionImageUrl?: string;
  fallbackImageUrl?: string;
  imageRefUrl?: string;
  undoCount: number;
  moveCount: number;
  rotationCount: number;
  maxGroupSize: number;
  dailyVisualModifier: "none" | "fog" | "night" | "sepia";
  pieceCutType: PieceCutType;
  isNewBest: boolean;
  puzzleShareUrl: string;
  puzzleName?: string;
  share: {
    handleCopyResults: () => void;
    handleNativeShare: () => Promise<void> | void;
    handleCopyChallenge: () => void;
    handleNativeChallengeShare: (challengeUrl?: string) => Promise<void> | void;
    setShareToast: (message: string | null) => void;
  };
  onClose: () => void;
  usedHint: boolean;
  isDaily: boolean;
  canReplay: boolean;
  onReplayClick: () => void;
  onNextPuzzle: () => void;
  nextPuzzleLabel?: string;
  focusReturnRef?: React.RefObject<HTMLButtonElement>;
  onCompletionRecorded?: (stats: { dailyStreak: number }) => void;
  onNewBest?: () => void;
  boardAnchorRef?: React.RefObject<HTMLElement | null>;
  /** Full border completed this session; small XP bonus at record time. */
  borderFrameBonus: boolean;
  /** Elapsed seconds when each board quarter was fully completed (for area-pace summary). */
  quadrantTimes?: Record<0 | 1 | 2 | 3, number | null>;
}): CompletionProps {
  const {
    showCompletionOverlay,
    completionDismissed,
    focusReturnRef,
    state,
    displayElapsedSeconds,
    completionImageUrl,
    fallbackImageUrl,
    imageRefUrl,
    undoCount,
    moveCount,
    rotationCount,
    maxGroupSize,
    dailyVisualModifier,
    pieceCutType,
    isNewBest,
    puzzleShareUrl,
    puzzleName,
    share,
    onClose,
    usedHint,
    canReplay,
    onReplayClick,
    onNextPuzzle,
    nextPuzzleLabel,
    onCompletionRecorded,
    onNewBest,
    boardAnchorRef,
    borderFrameBonus,
    quadrantTimes,
  } = args;

  const focusReturnRefProp = focusReturnRef != null ? { focusReturnRef } : undefined;
  const boardAnchorRefProp = boardAnchorRef != null ? { boardAnchorRef } : undefined;

  if (!showCompletionOverlay || completionDismissed) return null;
  if (!state) return null;

  return {
    show: true,
    elapsedSeconds: displayElapsedSeconds,
    state,
    // Treat empty string src as missing — imgRef.current?.src is "" before load
    imageUrl:
      (imageRefUrl || undefined) ??
      (completionImageUrl || undefined) ??
      (fallbackImageUrl || undefined),
    undoCount,
    moveCount,
    rotationCount,
    maxGroupSize,
    dailyVisualModifier,
    pieceCutType,
    isNewBest,
    puzzleShareUrl,
    puzzleName,
    share,
    onClose,
    usedHint,
    isDaily: args.isDaily,
    canReplay,
    onReplayClick,
    onNextPuzzle,
    nextPuzzleLabel,
    onCompletionRecorded,
    onNewBest,
    ...focusReturnRefProp,
    ...boardAnchorRefProp,
    borderFrameBonus,
    ...(quadrantTimes != null ? { quadrantTimes } : {}),
  };
}

export function buildReplayPortalProps(args: {
  replayBarOpen: boolean;
  isReplayPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onSkipBack5: () => void;
  onSkipForward5: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentIndex: number;
  totalSnapshots: number;
  elapsedSeconds: number;
  totalSeconds: number;
  onSeek: (index: number) => void;
  boardRect?: { top: number; left: number; width: number; height: number };
  speedExplicitlyChosen: boolean;
  onClose: () => void;
}): ReplayPortalProps {
  const {
    replayBarOpen,
    isReplayPaused,
    onPlay,
    onPause,
    onRewind,
    onFastForward,
    onSkipBack5,
    onSkipForward5,
    speed,
    onSpeedChange,
    currentIndex,
    totalSnapshots,
    elapsedSeconds,
    totalSeconds,
    onSeek,
    boardRect,
    speedExplicitlyChosen,
    onClose,
  } = args;

  if (!replayBarOpen) return null;

  return {
    isPaused: isReplayPaused,
    onPlay,
    onPause,
    onRewind,
    onFastForward,
    onSkipBack5,
    onSkipForward5,
    speed,
    onSpeedChange,
    currentIndex,
    totalSnapshots,
    elapsedSeconds,
    totalSeconds,
    onSeek,
    boardRect,
    speedExplicitlyChosen,
    onClose,
  };
}

export function getCompletionImageFallback(): string | undefined {
  return safeLocalStorage.getItem(STORAGE_KEY) ?? undefined;
}
