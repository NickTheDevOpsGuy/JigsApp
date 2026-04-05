/**
 * CompletionOverlay – phased celebration win screen: Phase 1 image + pulse/ripple,
 * Phase 2 stats bar slide down, Phase 3 achievement text. One primary Next Puzzle;
 * secondary actions in the Options menu. No confetti, no X close.
 */
import { useEffect, useMemo, useState } from "react";
import styles from "@/screens/Play/components/completion/styles/CompletionOverlay.module.css";
import { AppModal } from "@/components/AppModal";
import { useCompletionOverlayData } from "@/screens/Play/components/completion/useCompletionOverlayData";
import { CompletionOverlayActions } from "@/screens/Play/components/completion/CompletionOverlayActions";
import { CompletionOverlayStats } from "@/screens/Play/components/completion/CompletionOverlayStats";
import { pickCompletionPhrase } from "@/screens/Play/components/completion/completionOverlayPhrases";
import type { CompletionOverlayProps } from "@/screens/Play/components/completion/completionOverlayTypes";
import { ACHIEVEMENT_DEFS } from "@/data/content/achievements";
import { BORDER_FRAME_XP_BONUS } from "@/services/player/statsService";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PHASE2_MS = 600;
const PHASE3_MS = 1200;

function formatDailyStreakXpChip(gained: number, streakMultiplier: number): string {
  if (streakMultiplier <= 1.01) return `+${gained} XP`;
  const rounded = Math.round(streakMultiplier * 100) / 100;
  const multLabel = Number.isInteger(rounded)
    ? `${rounded}`
    : `${rounded}`.replace(/\.?0+$/, "");
  return `+${gained} XP · ${multLabel}×`;
}

export function CompletionOverlay({
  elapsedSeconds,
  grid,
  imageUrl,
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
  onShareProgress,
  onShareChallenge,
  onCopyProgress,
  onCopyChallenge,
  setShareToast,
  onClose,
  puzzleShareUrl = "/",
  puzzleName,
  canReplay = false,
  onReplayClick,
  onNextPuzzle,
  nextPuzzleLabel = "Next Puzzle",
  focusReturnRef,
  onCompletionRecorded,
  onNewBest,
  boardAnchorRef,
  borderFrameBonus = false,
}: CompletionOverlayProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [imageError, setImageError] = useState(false);
  const useCompactMobileWinLayout = useMediaQuery(
    "(max-width: 640px), (max-height: 720px)",
  );

  useEffect(() => {
    if (isNewBest && onNewBest) onNewBest();
  }, [isNewBest, onNewBest]);

  const completionData = useCompletionOverlayData({
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    rotationCount,
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
    borderFrameBonus,
    setShareToast,
  });

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

  const pieceCount = grid ? grid.rows * grid.cols : 0;

  const summaryChips: string[] = [];

  if (completionData.percentileBadgeTier) {
    summaryChips.push(completionData.percentileBadgeTier);
  }
  if (isDaily && completionData.dailyStreak >= 1) {
    const d = completionData.dailyStreak;
    summaryChips.push(`${d}-day streak`);
  }
  if (isDaily && completionData.lastXpReward) {
    summaryChips.push(
      formatDailyStreakXpChip(
        completionData.lastXpReward.gained,
        completionData.lastXpReward.streakMultiplier,
      ),
    );
  }
  if (borderFrameBonus) {
    summaryChips.push(`+${BORDER_FRAME_XP_BONUS} XP`);
  }
  if (completionData.masteryStreak > 0) {
    summaryChips.push(`Mastery ${completionData.masteryStreak}`);
  }
  for (const achId of completionData.newlyUnlocked) {
    const def = ACHIEVEMENT_DEFS.find((a) => a.id === achId);
    summaryChips.push(def ? `${def.icon} ${def.name}` : `Badge: ${achId}`);
  }

  const celebrationMessage = useMemo(
    () => pickCompletionPhrase(elapsedSeconds, moveCount, undoCount),
    [elapsedSeconds, moveCount, undoCount],
  );
  const modalBoardAnchorRef = useCompactMobileWinLayout ? undefined : boardAnchorRef;

  return (
    <AppModal
      isOpen
      onClose={onNextPuzzle ?? onClose}
      surface="bare"
      size="xl"
      tone="celebration"
      align="center"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      backdropClassName={styles.completeWinBackdrop}
      dialogClassName={[
        styles.completeWinDialog,
        modalBoardAnchorRef ? styles.completeWinDialogAnchored : "",
      ]
        .filter(Boolean)
        .join(" ")}
      bodyClassName={styles.completeWinModalBody}
      anchorRef={modalBoardAnchorRef}
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
          <h2 className={styles.completePhasedTitle}>Complete</h2>

          {isDaily && completionData.dailyStreak >= 2 && (
            <div
              className={`${styles.completeStreakIndicator} ${phase >= 2 ? styles.completeStreakIndicatorVisible : ""}`}
              role="status"
              aria-live="polite"
              aria-label={`${completionData.dailyStreak} day daily streak`}
            >
              <span className={styles.completeStreakShimmer} aria-hidden />
              <span className={styles.completeStreakFlame} aria-hidden>
                🔥
              </span>
              <span className={styles.completeStreakLabel}>
                <span className={styles.completeStreakCount}>
                  {completionData.dailyStreak}
                </span>
                <span className={styles.completeStreakSuffix}>day streak</span>
              </span>
            </div>
          )}

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

          {phase >= 3 && celebrationMessage && (
            <p
              className={styles.completeAchievementPhased}
              role="status"
              aria-live="polite"
            >
              {celebrationMessage}
            </p>
          )}
        </div>

        <CompletionOverlayActions
          onShareProgress={onShareProgress}
          onCopyProgress={onCopyProgress}
          onShareChallenge={onShareChallenge}
          onCopyChallenge={onCopyChallenge}
          completionData={completionData}
          canReplay={canReplay}
          onReplayClick={onReplayClick}
          onNextPuzzle={onNextPuzzle}
          nextPuzzleLabel={nextPuzzleLabel}
          isDaily={isDaily}
          focusReturnRef={focusReturnRef}
        />
      </div>
    </AppModal>
  );
}
