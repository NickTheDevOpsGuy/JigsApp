/**
 * CompletionOverlay – phased celebration win screen: Phase 1 image + pulse/ripple,
 * Phase 2 stats bar slide down, Phase 3 achievement text. One primary Next Puzzle;
 * secondary actions in More Options and Share Results dropdowns. No confetti, no X close.
 */
import { useEffect, useMemo, useState } from "react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { AppModal } from "@/components/AppModal";
import { useCompletionOverlayData } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { CompletionOverlayActions } from "@/screens/Play/components/completion/CompletionOverlayActions";
import { CompletionOverlayStats } from "@/screens/Play/components/completion/CompletionOverlayStats";
import { useCompletionOverlayMenus } from "@/screens/Play/components/completion/useCompletionOverlayMenus";
import { pickCompletionPhrase } from "@/screens/Play/components/completion/completionOverlayPhrases";
import type { CompletionOverlayProps } from "@/screens/Play/components/completion/completionOverlayTypes";

const PHASE2_MS = 600;
const PHASE3_MS = 1200;

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
  shareProgressText,
  shareChallengeText,
  onDownloadImage: _onDownloadImage,
  onClose,
  precisionModeEnabled: _precisionModeEnabled,
  avgPrecisionPx: _avgPrecisionPx,
  precisionBonusPoints: _precisionBonusPoints,
  uiTone: _uiTone,
  puzzleShareUrl = "/",
  ensureChallengeShareUrl,
  puzzleName,
  canReplay = false,
  onReplayClick,
  onNextPuzzle,
  nextPuzzleLabel = "Next Puzzle",
  focusReturnRef,
  onCompletionRecorded,
  onNewBest,
}: CompletionOverlayProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isNewBest && onNewBest) onNewBest();
  }, [isNewBest, onNewBest]);

  const completionData = useCompletionOverlayData({
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    rotationCount,
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
    puzzleName,
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
    const t2 = setTimeout(() => setPhase(2), PHASE2_MS);
    const t3 = setTimeout(() => setPhase(3), PHASE3_MS);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /* Share / challenge popup is its own AppModal; let it handle Escape first. */
      if (completionData.sharePopupOpen) return;

      e.preventDefault();

      if (onNextPuzzle) {
        onNextPuzzle();
      } else {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNextPuzzle, completionData.sharePopupOpen]);

  const pieceCount = grid ? grid.rows * grid.cols : 0;
  const cleanSolve = undoCount === 0 && !usedHint;
  const achievements: string[] = [];
  const summaryChips: string[] = [];

  if (cleanSolve) achievements.push("⭐ Clean Solve");
  if (isNewBest) achievements.push("🏆 New Personal Best");
  if (isDaily && completionData.newlyUnlocked?.length === 0 && !isNewBest) {
    achievements.push("🔥 Streak Progress");
  }

  if (completionData.percentileBadgeTier) {
    summaryChips.push(completionData.percentileBadgeTier);
  }
  if (isDaily && completionData.dailyStreak > 0) {
    summaryChips.push(`${completionData.dailyStreak}-day daily streak`);
  }
  if (completionData.masteryStreak > 0) {
    summaryChips.push(`Mastery ${completionData.masteryStreak}`);
  }
  if (completionData.newlyUnlocked.length > 0) {
    summaryChips.push(
      `${completionData.newlyUnlocked.length} achievement${
        completionData.newlyUnlocked.length === 1 ? "" : "s"
      } unlocked`,
    );
  }

  const celebrationMessages = useMemo(() => {
    const skillMessages: string[] = [
      pickCompletionPhrase(elapsedSeconds, moveCount, undoCount),
    ];

    if (accuracyPercent >= 95) {
      skillMessages.push("Precision game. Your piece placement was sharp.");
    }
    if (piecesPerMin >= 6) {
      skillMessages.push("Fast hands, sharp eyes. That was a quick solve.");
    }
    if (maxGroupSize >= Math.max(4, Math.ceil(pieceCount * 0.45))) {
      skillMessages.push("Great pattern recognition. You built big sections smoothly.");
    }
    if (cleanSolve) {
      skillMessages.push("Clean decisions all the way through. Nice control.");
    }
    if (isNewBest) {
      skillMessages.push("That pace was real skill. You just raised your own bar.");
    }

    return [...new Set([...skillMessages, ...achievements])];
  }, [
    accuracyPercent,
    achievements,
    cleanSolve,
    elapsedSeconds,
    isNewBest,
    maxGroupSize,
    moveCount,
    pieceCount,
    piecesPerMin,
    undoCount,
  ]);

  return (
    <AppModal
      isOpen
      onClose={onNextPuzzle ?? onClose}
      surface="bare"
      size="xl"
      tone="celebration"
      align="top"
      topOffsetPx={24}
      showCloseButton={false}
      backdropClassName={styles.completeWinBackdrop}
      dialogClassName={styles.completeWinDialog}
      bodyClassName={styles.completeWinModalBody}
    >
      <div
        className={styles.completePanelPhased}
        data-phase={phase}
        data-phase1={phase >= 1 ? "true" : undefined}
        data-phase2={phase >= 2 ? "true" : undefined}
        data-phase3={phase >= 3 ? "true" : undefined}
      >
        <CompletionOverlayStats
          elapsedSeconds={elapsedSeconds}
          moveCount={moveCount}
          pieceCount={pieceCount}
          piecesPerMin={piecesPerMin}
          rotationCount={rotationCount}
          maxGroupSize={maxGroupSize}
          phase={phase}
        />

        <div className={styles.completeCelebrationBlock}>
          <h2 className={styles.completePhasedTitle}>Puzzle Complete</h2>

          {summaryChips.length > 0 && (
            <div
              className={styles.completeSummaryChips}
              aria-label="Completion highlights"
            >
              {summaryChips.map((chip) => (
                <span key={chip} className={styles.completeSummaryChip}>
                  {chip}
                </span>
              ))}
            </div>
          )}

          {imageUrl && !imageError && (
            <div className={styles.completeImageWrapPhased}>
              <img
                src={imageUrl}
                alt="Completed puzzle"
                className={styles.completeImagePhased}
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {phase >= 3 && celebrationMessages.length > 0 && (
            <AchievementCycler achievements={celebrationMessages} />
          )}
        </div>

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
          ensureChallengeShareUrl={ensureChallengeShareUrl}
          elapsedSeconds={elapsedSeconds}
          moveCount={moveCount}
          accuracyPercent={accuracyPercent}
          copied={copied}
          canNativeShare={canNativeShare}
          onShareProgress={onShareProgress}
          onCopyProgress={onCopyProgress}
          onShareChallenge={onShareChallenge}
          onCopyChallenge={onCopyChallenge}
          shareProgressText={shareProgressText}
          shareChallengeText={shareChallengeText}
          completionData={completionData}
          canReplay={canReplay}
          onReplayClick={onReplayClick}
          onNextPuzzle={onNextPuzzle}
          nextPuzzleLabel={nextPuzzleLabel}
          onClose={onClose}
          isDaily={isDaily}
          focusReturnRef={focusReturnRef}
        />
      </div>
    </AppModal>
  );
}

function AchievementCycler({ achievements }: { achievements: string[] }) {
  const [index, setIndex] = useState(0);
  const ACHIEVEMENT_CYCLE_MS = 20000;

  useEffect(() => {
    if (achievements.length <= 1) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % achievements.length);
    }, ACHIEVEMENT_CYCLE_MS);

    return () => clearInterval(id);
  }, [achievements.length]);

  const text = achievements[index] ?? achievements[0];

  return (
    <p className={styles.completeAchievementPhased} role="status" aria-live="polite">
      {text}
    </p>
  );
}
