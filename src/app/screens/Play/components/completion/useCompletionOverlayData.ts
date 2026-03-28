/**
 * Completion overlay state:
 * - records completion stats and achievements
 * - derives leaderboard summaries
 * - share-card generation (Options menu)
 */
import { useEffect, useState, useCallback } from "react";
import { setBestTime } from "@/screens/Play/core/time/timeMode";
import {
  recordDailyCompletion,
  DAILY_DATE_KEY,
  getCurrentStreak,
  getLocalWeekMondayYmd,
  getTodayDateString,
  getDailyPuzzleNumber,
} from "@/daily/dailyPuzzleCore";
import {
  buildDailyShareMessage,
  getDailyShareCompletionGrid,
} from "@/screens/Play/core/share/shareMessages";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { recordCompletion } from "@/services/player/statsService";
import type { PlayerStatsData } from "@/services/player/statsService";
import { checkAndUnlockAchievements } from "@/services/player/achievementsService";
import { getPercentileRank } from "@/services/leaderboard/leaderboardService";
import { isShareCancelledError } from "@/screens/Play/hooks/share/shareCardImageShare";

type VisualModifier = "none" | "fog" | "night" | "sepia";
type PieceCutType = "classic" | "irregular" | "hard";

export type UseCompletionOverlayDataParams = {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  moveCount: number;
  rotationCount?: number;
  maxGroupSize?: number;
  accuracyPercent: number;
  usedHint: boolean;
  visualModifier: VisualModifier;
  isNewBest: boolean;
  isDaily: boolean;
  cutType: PieceCutType;
  undoCount: number;
  puzzleShareUrl?: string;
  puzzleName?: string;
  /** Called after Supabase record with updated stats (e.g. for 7-day streak toast). */
  onCompletionRecorded?: (stats: PlayerStatsData) => void;
  borderFrameBonus?: boolean;
  /** Play screen engagement toast (share errors, streak, etc.). */
  setShareToast?: (message: string | null) => void;
};

export type UseCompletionOverlayDataResult = ReturnType<typeof useCompletionOverlayData>;

export function useCompletionOverlayData(params: UseCompletionOverlayDataParams) {
  const {
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    rotationCount = 0,
    maxGroupSize = 0,
    accuracyPercent,
    usedHint,
    visualModifier,
    isNewBest,
    isDaily,
    cutType,
    undoCount,
    puzzleShareUrl = "/",
    puzzleName,
    onCompletionRecorded,
    borderFrameBonus = false,
    setShareToast,
  } = params;

  // Keep share links absolute when the overlay is opened from routes like /daily.
  const PLAY_BASE = "https://phuzzle.vercel.app";

  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [masteryStreak, setMasteryStreak] = useState<number>(0);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [percentile, setPercentile] = useState<{
    topPercent: number;
    totalPlayers: number;
  } | null>(null);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const [lastXpReward, setLastXpReward] = useState<{
    gained: number;
    streakMultiplier: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isNewBest && grid) {
      setBestTime(grid.rows, grid.cols, elapsedSeconds);
    }
  }, [isNewBest, grid, elapsedSeconds]);

  useEffect(() => {
    if (!isDaily) return;
    const newStreak = recordDailyCompletion(elapsedSeconds);
    setDailyStreak(newStreak);
    const weekKey = getLocalWeekMondayYmd(getTodayDateString());
    safeLocalStorage.setItem(`phuzzle:weeklyAlbumNudge:${weekKey}`, "true");
    safeLocalStorage.removeItem(DAILY_DATE_KEY);
  }, [isDaily, elapsedSeconds]);

  useEffect(() => {
    if (!grid) return;
    let cancelled = false;

    void getPercentileRank(grid.rows, grid.cols, elapsedSeconds, visualModifier)
      .then((result) => {
        if (!cancelled) {
          setPercentile(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPercentile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [grid?.rows, grid?.cols, elapsedSeconds, visualModifier]);

  useEffect(() => {
    if (!grid) return;
    let cancelled = false;

    const run = async () => {
      try {
        const nextDailyStreak = isDaily ? getCurrentStreak() : 0;
        const stats = await recordCompletion({
          elapsedSeconds,
          grid,
          isDaily: !!isDaily,
          dailyStreak: nextDailyStreak,
          usedUndo: undoCount > 0,
          usedHint,
          cutType,
          visualModifier,
          moveCount,
          undoCount,
          completionSource: isDaily ? "daily" : "custom",
          borderFrameBonus,
        });
        if (!stats || cancelled) return;

        setMasteryStreak(stats.masteryStreak ?? 0);
        if (stats.lastXpGained != null && stats.dailyStreakXpMultiplier != null) {
          setLastXpReward({
            gained: stats.lastXpGained,
            streakMultiplier: stats.dailyStreakXpMultiplier,
          });
        }
        setCompletionRecorded(true);
        onCompletionRecorded?.(stats);

        const placementAccuracyPerfect =
          accuracyPercent >= 100 && grid.rows * grid.cols > 0;

        const unlocked = await checkAndUnlockAchievements({
          puzzlesCompleted: stats.puzzlesCompleted,
          dailyStreak: stats.dailyStreak,
          bestDailyStreak: stats.bestDailyStreak,
          lastCompletion: { elapsedSeconds, grid },
          undoCount,
          placementAccuracyPerfect,
        });

        if (!cancelled && unlocked.length > 0) {
          setNewlyUnlocked(unlocked);
        }
      } catch {
        if (!cancelled) {
          setCompletionRecorded(false);
          setLastXpReward(null);
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [
    elapsedSeconds,
    grid,
    isDaily,
    cutType,
    moveCount,
    undoCount,
    usedHint,
    visualModifier,
    onCompletionRecorded,
    borderFrameBonus,
    accuracyPercent,
  ]);

  const percentileBadgeTier =
    percentile && percentile.totalPlayers >= 1
      ? percentile.topPercent <= 10
        ? "Top 10%"
        : percentile.topPercent <= 25
          ? "Top 25%"
          : percentile.topPercent <= 50
            ? "Top 50%"
            : null
      : null;

  const runShareCard = useCallback(
    async (mode: "result" | "challenge") => {
      if (!imageUrl || isGenerating) return;
      setIsGenerating(true);
      try {
        const { generateAndShareCard } =
          await import("@/screens/Play/hooks/share/useShareCardImageCore");
        const ok = await generateAndShareCard({
          imageUrl,
          elapsedSeconds,
          moveCount,
          rotationCount,
          maxGroupSize,
          accuracyPercent,
          puzzleShareUrl,
          pieceCount: grid ? grid.rows * grid.cols : 0,
          puzzleName,
          mode,
        });
        if (!ok) {
          setShareToast?.("Could not build share image.");
        }
      } catch (e) {
        if (!isShareCancelledError(e)) {
          setShareToast?.("Couldn't share the card. Check downloads or try again.");
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [
      imageUrl,
      isGenerating,
      elapsedSeconds,
      moveCount,
      rotationCount,
      maxGroupSize,
      accuracyPercent,
      puzzleShareUrl,
      grid,
      puzzleName,
      setShareToast,
    ],
  );

  const handleShareResultCard = useCallback(async () => {
    await runShareCard("result");
  }, [runShareCard]);

  const handleShareChallengeCard = useCallback(async () => {
    await runShareCard("challenge");
  }, [runShareCard]);

  const getDailyShareText = useCallback((): string => {
    if (!grid || !isDaily) return "";
    const pieceCount = grid.rows * grid.cols;
    const dailyLink = puzzleShareUrl.startsWith("http")
      ? puzzleShareUrl
      : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
    const completionGrid = getDailyShareCompletionGrid({
      pieceCount,
      elapsedSeconds,
      moveCount,
      usedHint,
      undoCount,
    });
    return buildDailyShareMessage({
      dailyNumber: getDailyPuzzleNumber(),
      pieceCount,
      elapsedSeconds,
      moveCount,
      dailyLink,
      completionGrid,
    });
  }, [grid, isDaily, puzzleShareUrl, elapsedSeconds, moveCount, usedHint, undoCount]);

  const handleCopyDailyShare = useCallback(async () => {
    const text = getDailyShareText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setShareToast?.("Copied!");
    } catch {
      setShareToast?.("Couldn't copy daily summary.");
    }
  }, [getDailyShareText, setShareToast]);

  const handleNativeDailyShare = useCallback(async () => {
    const text = getDailyShareText();
    if (!text) return;
    const dailyLink = puzzleShareUrl.startsWith("http")
      ? puzzleShareUrl
      : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Phuzzle Daily",
          text,
          url: dailyLink,
        });
      } catch (e) {
        if (isShareCancelledError(e)) return;
        await handleCopyDailyShare();
      }
    } else {
      await handleCopyDailyShare();
    }
  }, [getDailyShareText, puzzleShareUrl, handleCopyDailyShare]);

  return {
    percentile,
    dailyStreak,
    masteryStreak,
    completionRecorded,
    percentileBadgeTier,
    newlyUnlocked,
    isGenerating,
    handleShareResultCard,
    handleShareChallengeCard,
    handleNativeDailyShare,
    lastXpReward,
  };
}
