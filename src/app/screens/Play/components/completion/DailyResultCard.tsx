/**
 * DailyResultCard – the Wordle-style share panel shown after completing the daily.
 *
 * What Wordle nails that we were missing:
 * 1. Emoji grid — instantly shareable, shows "how hard was yours" without spoilers
 * 2. Countdown to next puzzle — creates urgency and a reason to come back
 * 3. Share button is THE primary action, not buried in a dropdown
 * 4. Streak is the emotional headline — number is huge
 *
 * Wires entirely into existing dailyPuzzleCore data — no new storage.
 */
import { useState, useEffect, useCallback } from "react";
import { Share2, Check, Flame, Timer } from "lucide-react";
import {
  syncServerTime,
  getSyncedNow,
  getSecondsUntilNextUtcMidnight,
} from "@/services/player/serverTimeService";
import { isSupabaseConfigured } from "@/supabase/client";
import {
  getCurrentStreak,
  getDailyPuzzleNumber,
  getTodayDateString,
  getStreakFreezeCount,
} from "@/daily/dailyPuzzleCore";
import {
  buildDailyShareMessage,
  getDailyShareCompletionGrid,
} from "@/screens/Play/core/share/shareMessages";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import styles from "./DailyResultCard.module.css";

type Props = {
  elapsedSeconds: number;
  moveCount: number;
  undoCount: number;
  usedHint: boolean;
  grid: { rows: number; cols: number } | undefined;
  puzzleShareUrl: string;
  canNativeShare: boolean;
  /** Called when share completes so parent can show a toast */
  onShared?: () => void;
};

/** Same rule as DailyCountdown: UTC midnight + server offset when Supabase is configured. */
function useNextPuzzleCountdown() {
  const [label, setLabel] = useState("");
  const [synced, setSynced] = useState(false);

  const tick = useCallback(() => {
    const now = getSyncedNow();
    const secs = getSecondsUntilNextUtcMidnight(now);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    setLabel(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      void syncServerTime().then(() => {
        setSynced(true);
        tick();
      });
    } else {
      setSynced(true);
      tick();
    }
  }, [tick]);

  useEffect(() => {
    if (!synced) return;
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [synced, tick]);

  return label;
}

function buildEmojiGrid(
  pieceCount: number,
  elapsedSeconds: number,
  _moveCount: number,
  usedHint: boolean,
  undoCount: number,
): string {
  // Map solve quality to emoji rows — same idea as Wordle's coloured squares
  // Each row = a "round" of 4 pieces placed; colour = speed/accuracy
  const totalPieces = pieceCount;
  const cleanSolve = undoCount === 0 && !usedHint;

  // 3 rows of up to 4 squares representing thirds of the puzzle
  const third = Math.ceil(totalPieces / 3);
  const rows: string[] = [];
  for (let r = 0; r < 3; r++) {
    const piecesInSection = Math.min(third, totalPieces - r * third);
    if (piecesInSection <= 0) break;
    // Emoji based on pace — fast = 🟩, medium = 🟨, slow = 🟥, hint = ⬜
    const sectionSecs = (elapsedSeconds / totalPieces) * piecesInSection;
    const pace = sectionSecs / piecesInSection;
    let sq: string;
    if (usedHint && r === 0) sq = "⬜";
    else if (pace < 8) sq = "🟩";
    else if (pace < 20) sq = "🟨";
    else sq = "🟥";
    rows.push(Array(Math.min(4, piecesInSection)).fill(sq).join(""));
  }
  if (cleanSolve) rows.push("⭐");
  return rows.join("\n");
}

export function DailyResultCard({
  elapsedSeconds,
  moveCount,
  undoCount,
  usedHint,
  grid,
  puzzleShareUrl,
  canNativeShare,
  onShared,
}: Props) {
  const streak = getCurrentStreak();
  const freezeCount = getStreakFreezeCount();
  const dailyNumber = getDailyPuzzleNumber();
  const countdown = useNextPuzzleCountdown();
  const pieceCount = grid ? grid.rows * grid.cols : 0;
  const [copied, setCopied] = useState(false);
  const cleanSolve = undoCount === 0 && !usedHint;

  const emojiGrid = buildEmojiGrid(
    pieceCount,
    elapsedSeconds,
    moveCount,
    usedHint,
    undoCount,
  );

  const getShareText = useCallback((): string => {
    const PLAY_BASE = "https://phuzzle.vercel.app";
    const link = puzzleShareUrl.startsWith("http")
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
      dailyNumber,
      pieceCount,
      elapsedSeconds,
      moveCount,
      dailyLink: link,
      completionGrid,
    });
  }, [
    puzzleShareUrl,
    pieceCount,
    elapsedSeconds,
    moveCount,
    usedHint,
    undoCount,
    dailyNumber,
  ]);

  const handleShare = useCallback(async () => {
    const text = getShareText();
    const PLAY_BASE = "https://phuzzle.vercel.app";
    const link = puzzleShareUrl.startsWith("http")
      ? puzzleShareUrl
      : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;
    try {
      if (canNativeShare && navigator.share) {
        await navigator.share({ text, url: link });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
      onShared?.();
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
        onShared?.();
      } catch {
        /* ignore */
      }
    }
  }, [getShareText, puzzleShareUrl, canNativeShare, onShared]);

  return (
    <div className={styles.card}>
      {/* Headline: streak is the emotional hook */}
      <div className={styles.streakRow}>
        <Flame size={28} className={styles.flame} aria-hidden />
        <div className={styles.streakInfo}>
          <span className={styles.streakNum}>{streak}</span>
          <span className={styles.streakLabel}>day streak</span>
        </div>
        {freezeCount > 0 && (
          <span className={styles.freezeBadge} title="Streak Freeze available">
            🧊×{freezeCount}
          </span>
        )}
      </div>

      {/* Puzzle number + date */}
      <div className={styles.meta}>
        <span className={styles.puzzleNum}>Phuzzle #{dailyNumber}</span>
        <span className={styles.date}>{getTodayDateString()}</span>
      </div>

      {/* Stats — time and pieces, clean badge */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{formatTime(elapsedSeconds)}</span>
          <span className={styles.statLbl}>Time</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{moveCount}</span>
          <span className={styles.statLbl}>Moves</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{pieceCount}</span>
          <span className={styles.statLbl}>Pieces</span>
        </div>
        {cleanSolve && (
          <div className={styles.stat}>
            <span className={styles.statVal}>⭐</span>
            <span className={styles.statLbl}>Clean!</span>
          </div>
        )}
      </div>

      {/* Emoji grid — the Wordle moment */}
      <pre className={styles.emojiGrid} aria-label="Solve summary">
        {emojiGrid}
      </pre>

      {/* Share — primary action, full width, impossible to miss */}
      <button
        type="button"
        className={styles.shareBtn}
        onClick={() => void handleShare()}
        aria-label={copied ? "Copied to clipboard" : "Share result"}
      >
        {copied ? (
          <>
            <Check size={16} aria-hidden /> Copied!
          </>
        ) : (
          <>
            <Share2 size={16} aria-hidden /> {canNativeShare ? "Share" : "Copy Result"}
          </>
        )}
      </button>

      {/* Countdown — creates urgency and reason to return */}
      <div className={styles.countdown}>
        <Timer size={13} aria-hidden />
        <span className={styles.countdownLabel}>Next puzzle in</span>
        <span className={styles.countdownTime}>{countdown}</span>
      </div>
    </div>
  );
}
