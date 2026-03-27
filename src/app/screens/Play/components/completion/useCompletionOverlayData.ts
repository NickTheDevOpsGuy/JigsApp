/**
 * Completion overlay state:
 * - records completion stats and achievements
 * - derives leaderboard summaries
 * - powers the image-first share modal
 */
import { useEffect, useState, useCallback, useRef } from "react";
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

type VisualModifier = "none" | "fog" | "night" | "sepia";
type PieceCutType = "classic" | "irregular" | "hard";

export type UseCompletionOverlayDataParams = {
  elapsedSeconds: number;
  grid?: { rows: number; cols: number };
  imageUrl?: string;
  moveCount: number;
  rotationCount?: number;
  piecesPerMin?: number;
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
};

export type UseCompletionOverlayDataResult = ReturnType<typeof useCompletionOverlayData>;

export function useCompletionOverlayData(params: UseCompletionOverlayDataParams) {
  const {
    elapsedSeconds,
    grid,
    imageUrl,
    moveCount,
    rotationCount = 0,
    piecesPerMin = 0,
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
  } = params;

  // Keep share links absolute when the overlay is opened from routes like /daily.
  const PLAY_BASE = "https://phuzzle.vercel.app";

  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [sharePopupMode, setSharePopupMode] = useState<"result" | "challenge" | null>(
    null,
  );
  const [dailyCopied, setDailyCopied] = useState(false);
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [masteryStreak, setMasteryStreak] = useState<number>(0);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [percentile, setPercentile] = useState<{
    topPercent: number;
    totalPlayers: number;
  } | null>(null);
  const [useSeasonalFrame, setUseSeasonalFrame] = useState(true);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

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
        });
        if (!stats || cancelled) return;

        setMasteryStreak(stats.masteryStreak ?? 0);
        setCompletionRecorded(true);
        onCompletionRecorded?.(stats);

        const unlocked = await checkAndUnlockAchievements({
          puzzlesCompleted: stats.puzzlesCompleted,
          dailyStreak: stats.dailyStreak,
          bestDailyStreak: stats.bestDailyStreak,
          lastCompletion: { elapsedSeconds, grid },
          undoCount,
        });

        if (!cancelled && unlocked.length > 0) {
          setNewlyUnlocked(unlocked);
        }
      } catch {
        if (!cancelled) {
          setCompletionRecorded(false);
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
  ]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current != null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const rankPosition =
    percentile && percentile.totalPlayers >= 1
      ? Math.max(
          1,
          Math.min(
            percentile.totalPlayers,
            percentile.totalPlayers -
              Math.round((percentile.topPercent / 100) * percentile.totalPlayers) +
              1,
          ),
        )
      : null;

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
        await generateAndShareCard({
          imageUrl,
          elapsedSeconds,
          moveCount,
          rotationCount,
          piecesPerMin,
          maxGroupSize,
          accuracyPercent,
          percentile,
          useSeasonalFrame,
          puzzleShareUrl,
          pieceCount: grid ? grid.rows * grid.cols : 0,
          puzzleName,
          mode,
        });
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
      piecesPerMin,
      maxGroupSize,
      accuracyPercent,
      percentile,
      useSeasonalFrame,
      puzzleShareUrl,
      grid,
      puzzleName,
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
      setDailyCopied(true);
      if (copyResetTimeoutRef.current != null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setDailyCopied(false);
        copyResetTimeoutRef.current = null;
      }, 2000);
    } catch {
      /* ignore */
    }
  }, [getDailyShareText]);

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
      } catch {
        await handleCopyDailyShare();
      }
    } else {
      await handleCopyDailyShare();
    }
  }, [getDailyShareText, puzzleShareUrl, handleCopyDailyShare]);

  const openSharePopup = useCallback((mode: "result" | "challenge") => {
    setSharePopupMode(mode);
    setSharePopupOpen(true);
  }, []);

  const closeSharePopup = useCallback(() => {
    setSharePopupOpen(false);
    setSharePopupMode(null);
  }, []);

  return {
    sharePopupOpen,
    sharePopupMode,
    openSharePopup,
    closeSharePopup,
    useSeasonalFrame,
    setUseSeasonalFrame,
    percentile,
    dailyStreak,
    masteryStreak,
    completionRecorded,
    rankPosition,
    percentileBadgeTier,
    newlyUnlocked,
    isGenerating,
    handleShareResultCard,
    handleShareChallengeCard,
    getDailyShareText,
    handleCopyDailyShare,
    handleNativeDailyShare,
    dailyCopied,
  };
}
