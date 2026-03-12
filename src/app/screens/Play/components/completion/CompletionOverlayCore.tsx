/**
 * CompletionOverlay – success screen with direct share actions.
 */
import React, { useEffect, useCallback, useState } from "react";
import { X } from "lucide-react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { useCompletionOverlayData } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { useCompletionConfetti } from "@/screens/Play/components/completion/useCompletionConfetti";
import { pickCompletionPhrase } from "@/screens/Play/components/completion/completionOverlayPhrases";
import { ACHIEVEMENT_DEFS } from "@/data/content/achievements";
import { CompletionOverlayActions } from "@/screens/Play/components/completion/CompletionOverlayActions";
import { CompletionOverlayStats } from "@/screens/Play/components/completion/CompletionOverlayStats";
import { useCompletionOverlayMenus } from "@/screens/Play/components/completion/useCompletionOverlayMenus";
import type { CompletionOverlayProps } from "@/screens/Play/components/completion/completionOverlayTypes";

const _ANIM_PHASE_TITLE_MS = 0;
const ANIM_PHASE_SCALE_MS = 400;
const ANIM_PHASE_GLOW_MS = 700;
const ANIM_PHASE_TIME_MS = 1000;

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
  pieces: _pieces,
  moveCount = 0,
  piecesPerMin = 0,
  rotationCount = 0,
  maxGroupSize = 0,
  accuracyPercent = 100,
  usedHint = false,
  visualModifier = "none",
  isNewBest = false,
  isDaily = false,
  cutType = "classic",
  undoCount = 0,
  copied = false,
  canNativeShare = false,
  onShareProgress,
  onShareChallenge,
  onCopyProgress,
  onCopyChallenge,
  onDownloadImage: _onDownloadImage,
  onClose,
  precisionModeEnabled: _precisionModeEnabled,
  avgPrecisionPx: _avgPrecisionPx,
  precisionBonusPoints: _precisionBonusPoints,
  uiTone: _uiTone,
  puzzleShareUrl = "/",
  canReplay = false,
  onReplayClick,
  onNextPuzzle,
  focusReturnRef,
  onCompletionRecorded,
  onNewBest,
}: CompletionOverlayProps) {
  const [animPhase, setAnimPhase] = useState<"title" | "scale" | "glow" | "time">(
    "title",
  );
  const [imageError, setImageError] = useState(false);

  useCompletionConfetti();

  useEffect(() => {
    if (isNewBest && onNewBest) onNewBest();
  }, [isNewBest, onNewBest]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const completionData = useCompletionOverlayData({
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    piecesPerMin: piecesPerMin ?? 0,
    maxGroupSize: maxGroupSize ?? 0,
    accuracyPercent,
    usedHint,
    visualModifier,
    isNewBest,
    isDaily,
    cutType,
    undoCount,
    puzzleShareUrl,
    onCompletionRecorded: onCompletionRecorded
      ? (stats) => onCompletionRecorded({ dailyStreak: stats.dailyStreak })
      : undefined,
  });
  const {
    shareMenuOpen,
    setShareMenuOpen,
    shareRef,
    shareTriggerRef,
    dropdownPosition,
    replayNextMenuOpen,
    setReplayNextMenuOpen,
    replayNextRef,
    replayNextTriggerRef,
    replayNextDropdownPosition,
  } = useCompletionOverlayMenus();

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimPhase("scale"), ANIM_PHASE_SCALE_MS);
    const t2 = setTimeout(() => setAnimPhase("glow"), ANIM_PHASE_GLOW_MS);
    const t3 = setTimeout(() => setAnimPhase("time"), ANIM_PHASE_TIME_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div className={styles.completeOverlay}>
      <div
        className={`${styles.completePanel} ${styles.completePanelNew}`}
        data-anim-phase={animPhase}
      >
        <button
          ref={focusReturnRef}
          type="button"
          className={styles.completeCloseBtn}
          onClick={handleClose}
          aria-label="Close"
          title="Close"
        >
          <X size={24} />
        </button>

        <div className={styles.completeTitleBlock} role="banner">
          <h2 className={styles.completeTitleText}>🧩 Puzzle complete!</h2>
          {isNewBest && (
            <p className={styles.completeTitlePhraseHighlight}>New personal best! 🏆</p>
          )}
          {isDaily && completionData.newlyUnlocked?.length === 0 && !isNewBest && (
            <p className={styles.completeTitlePhraseSub}>Daily streak +1 🔥</p>
          )}
          <p className={styles.completeTitlePhrase}>
            {pickCompletionPhrase(elapsedSeconds, moveCount, undoCount)}
          </p>
          {completionData.newlyUnlocked?.length > 0 && (() => {
            const firstId = completionData.newlyUnlocked[0];
            const achievement = ACHIEVEMENT_DEFS.find((a) => a.id === firstId);
            const text = achievement
              ? `${achievement.icon} Achievement unlocked: ${achievement.name}`
              : "Achievement unlocked! 🏆";
            return (
              <p className={styles.completeAchievementUnlock} role="status">
                {text}
              </p>
            );
          })()}
        </div>

        {imageUrl && !imageError && (
          <div
            className={`${styles.completeImageWrapNew} ${animPhase !== "title" ? styles.completeImageScaled : ""} ${animPhase === "glow" || animPhase === "time" ? styles.completeImageGlow : ""}`}
          >
            <img
              src={imageUrl}
              alt="Completed puzzle"
              className={styles.completeImageNew}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        <CompletionOverlayStats
          elapsedSeconds={elapsedSeconds}
          moveCount={moveCount}
          piecesPerMin={piecesPerMin}
          rotationCount={rotationCount}
          maxGroupSize={maxGroupSize}
        />

        <CompletionOverlayActions
          shareMenuOpen={shareMenuOpen}
          setShareMenuOpen={setShareMenuOpen}
          shareRef={shareRef}
          shareTriggerRef={shareTriggerRef}
          dropdownPosition={dropdownPosition}
          replayNextMenuOpen={replayNextMenuOpen}
          setReplayNextMenuOpen={setReplayNextMenuOpen}
          replayNextRef={replayNextRef}
          replayNextTriggerRef={replayNextTriggerRef}
          replayNextDropdownPosition={replayNextDropdownPosition}
          grid={grid}
          puzzleShareUrl={puzzleShareUrl}
          elapsedSeconds={elapsedSeconds}
          accuracyPercent={accuracyPercent}
          copied={copied}
          canNativeShare={canNativeShare}
          onShareProgress={onShareProgress}
          onCopyProgress={onCopyProgress}
          onShareChallenge={onShareChallenge}
          onCopyChallenge={onCopyChallenge}
          completionData={completionData}
          canReplay={canReplay}
          onReplayClick={onReplayClick}
          onNextPuzzle={onNextPuzzle}
        />
      </div>
    </div>
  );
}
