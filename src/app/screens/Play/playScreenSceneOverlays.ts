import React from "react";
import styles from "./PlayScreen.module.css";
import type { PuzzleState, PieceCutType } from "@/puzzle/types";
import { isDailyPuzzleSession } from "@/daily/dailyPuzzleCore";
import { STORAGE_KEY } from "./playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { CompletionOverlayGate, ReplayBar } from "./components";

type CompletionProps = React.ComponentProps<typeof CompletionOverlayGate> | null;
type ReplayPortalProps = React.ComponentProps<typeof ReplayBar> | null;

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
  isComplete: boolean;
  completionDismissed: boolean;
  showE2ECompletion: boolean;
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
  share: {
    copied: boolean;
    canNativeShare: boolean;
    handleCopyResults: () => void;
    handleNativeShare: () => Promise<void> | void;
    handleCopyChallenge: () => void;
    handleNativeChallengeShare: () => Promise<void> | void;
  };
  onDownloadImage: () => Promise<void> | void;
  onClose: () => void;
  usedHint: boolean;
  precisionModeEnabled: boolean;
  precisionSnaps: number[];
  adaptivePersonalityEnabled: boolean;
  canReplay: boolean;
  onReplayClick: () => void;
  onNextPuzzle: () => void;
}): CompletionProps {
  const {
    isComplete,
    completionDismissed,
    showE2ECompletion,
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
    share,
    onDownloadImage,
    onClose,
    usedHint,
    precisionModeEnabled,
    precisionSnaps,
    adaptivePersonalityEnabled,
    canReplay,
    onReplayClick,
    onNextPuzzle,
  } = args;

  if (
    !((isComplete && !completionDismissed) || (showE2ECompletion && !completionDismissed))
  ) {
    return null;
  }
  if (!state) return null;

  return {
    show: true,
    elapsedSeconds: displayElapsedSeconds,
    state,
    imageUrl: completionImageUrl ?? fallbackImageUrl ?? imageRefUrl ?? undefined,
    undoCount,
    moveCount,
    rotationCount,
    maxGroupSize,
    dailyVisualModifier,
    pieceCutType,
    isNewBest,
    puzzleShareUrl,
    share,
    onDownloadImage,
    onClose,
    usedHint,
    isDaily: isDailyPuzzleSession(),
    precisionModeEnabled,
    precisionSnaps,
    adaptivePersonalityEnabled,
    canReplay,
    onReplayClick,
    onNextPuzzle,
  };
}

export function buildReplayPortalProps(args: {
  replayBarOpen: boolean;
  isReplayPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentIndex: number;
  totalSnapshots: number;
  elapsedSeconds: number;
  totalSeconds: number;
  onSeek: (index: number) => void;
  boardRect?: { left: number; width: number };
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
