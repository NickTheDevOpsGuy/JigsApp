import React from "react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import type { PuzzleState, PieceCutType } from "@/puzzle/core/types";
import { STORAGE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { CompletionOverlayGate, ReplayBar } from "@/screens/Play/components";

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
    copied: boolean;
    canNativeShare: boolean;
    handleCopyResults: () => void;
    handleNativeShare: () => Promise<void> | void;
    handleCopyChallenge: () => void;
    handleNativeChallengeShare: (challengeUrl?: string) => Promise<void> | void;
    getProgressShareTextWithUrl: () => string;
    getChallengeShareTextWithUrl: (challengeUrl?: string) => string;
  };
  onDownloadImage: () => Promise<void> | void;
  onClose: () => void;
  usedHint: boolean;
  isDaily: boolean;
  precisionModeEnabled: boolean;
  precisionSnaps: number[];
  adaptivePersonalityEnabled: boolean;
  canReplay: boolean;
  onReplayClick: () => void;
  onNextPuzzle: () => void;
  focusReturnRef?: React.RefObject<HTMLButtonElement>;
  onCompletionRecorded?: (stats: { dailyStreak: number }) => void;
  onNewBest?: () => void;
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
    onDownloadImage,
    onClose,
    usedHint,
    precisionModeEnabled,
    precisionSnaps,
    adaptivePersonalityEnabled,
    canReplay,
    onReplayClick,
    onNextPuzzle,
    onCompletionRecorded,
    onNewBest,
  } = args;

  const focusReturnRefProp = focusReturnRef != null ? { focusReturnRef } : undefined;

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
    onDownloadImage,
    onClose,
    usedHint,
    isDaily: args.isDaily,
    precisionModeEnabled,
    precisionSnaps,
    adaptivePersonalityEnabled,
    canReplay,
    onReplayClick,
    onNextPuzzle,
    onCompletionRecorded,
    onNewBest,
    ...focusReturnRefProp,
  };
}

export function buildReplayPortalProps(args: {
  replayBarOpen: boolean;
  isReplayPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onSkipBack15: () => void;
  onSkipForward15: () => void;
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
    onSkipBack15,
    onSkipForward15,
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
    onSkipBack15,
    onSkipForward15,
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
