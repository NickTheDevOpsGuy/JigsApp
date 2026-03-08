/**
 * CompletionOverlay – success screen with direct share actions.
 */
import React, { useEffect, useCallback, useState } from "react";
import { X } from "lucide-react";
import styles from "./CompletionOverlay.module.css";
import { useCompletionOverlayData } from "./useCompletionOverlayData";
import { CompletionOverlayActions } from "./CompletionOverlayActions";
import { useCompletionOverlayMenus } from "./useCompletionOverlayMenus";
import { CompletionOverlayStats } from "./CompletionOverlayStats";
import type { CompletionOverlayProps } from "./completionOverlayTypes";
import { pickCompletionPhrase } from "./completionOverlayPhrases";

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
}: CompletionOverlayProps) {
  const [animPhase, setAnimPhase] = useState<"title" | "scale" | "glow" | "time">(
    "title",
  );
  const [imageError, setImageError] = useState(false);
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

  const hasShare =
    !!onShareProgress || !!onCopyProgress || !!onShareChallenge || !!onCopyChallenge;

  const hasReplayNext = !!(canReplay && onReplayClick) || !!onNextPuzzle;

  const completionPhrase = React.useMemo(
    () => pickCompletionPhrase(elapsedSeconds, moveCount),
    [elapsedSeconds, moveCount],
  );

  const handleClose = useCallback(() => onClose(), [onClose]);

  const completionData = useCompletionOverlayData({
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    accuracyPercent,
    usedHint,
    visualModifier,
    isNewBest,
    isDaily,
    cutType,
    undoCount,
    puzzleShareUrl,
  });

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
          <p className={styles.completeTitlePhrase}>{completionPhrase}</p>
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
          hasShare={hasShare}
          hasReplayNext={hasReplayNext}
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
