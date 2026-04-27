/**
 * DailyResultCard – the Wordle-style share panel shown after completing the daily.
 *
 * What Wordle nails that we were missing:
 * 1. Emoji grid — instantly shareable, shows "how hard was yours" without spoilers
 * 2. Countdown to next puzzle — creates urgency and a reason to come back
 * 3. Share button is THE primary action, not buried in a dropdown
 * 4. Streak is the emotional headline — number is huge
 *
 * Wires into existing dailyPuzzleCore/share data — no new storage.
 */
import { useState, useEffect, useCallback } from "react";
import { Share2, Check, Flame, Timer } from "lucide-react";
import {
  getDailyPuzzleNumber,
  getTodayDateString,
  getStreakFreezeCount,
} from "@/daily/dailyPuzzleCore";
import { getDailyShareCompletionGrid } from "@/screens/Play/core/share/shareMessages";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import styles from "./DailyResultCard.module.css";

type Props = {
  elapsedSeconds: number;
  moveCount: number;
  undoCount: number;
  usedHint: boolean;
  grid: { rows: number; cols: number } | undefined;
  dailyStreak: number;
  canNativeShare: boolean;
  onShare: () => Promise<void> | void;
};

function useNextPuzzleCountdown() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

export function DailyResultCard({
  elapsedSeconds,
  moveCount,
  undoCount,
  usedHint,
  grid,
  dailyStreak,
  canNativeShare,
  onShare,
}: Props) {
  const freezeCount = getStreakFreezeCount();
  const dailyNumber = getDailyPuzzleNumber();
  const countdown = useNextPuzzleCountdown();
  const pieceCount = grid ? grid.rows * grid.cols : 0;
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cleanSolve = undoCount === 0 && !usedHint;

  const completionGrid = getDailyShareCompletionGrid({
    pieceCount,
    elapsedSeconds,
    moveCount,
    usedHint,
    undoCount,
  });

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await onShare();
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } finally {
      setSharing(false);
    }
  }, [onShare, sharing]);

  return (
    <div className={styles.card}>
      <div className={styles.streakRow}>
        <Flame size={28} className={styles.flame} aria-hidden />
        <div className={styles.streakInfo}>
          <span className={styles.streakNum}>{dailyStreak}</span>
          <span className={styles.streakLabel}>day streak</span>
        </div>
        {freezeCount > 0 && (
          <span className={styles.freezeBadge} title="Streak Freeze available">
            🧊×{freezeCount}
          </span>
        )}
      </div>

      <div className={styles.meta}>
        <span className={styles.puzzleNum}>Phuzzle #{dailyNumber}</span>
        <span className={styles.date}>{getTodayDateString()}</span>
      </div>

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

      <pre className={styles.emojiGrid} aria-label="Solve summary">
        {completionGrid}
      </pre>

      <button
        type="button"
        className={styles.shareBtn}
        onClick={() => void handleShare()}
        disabled={sharing}
        aria-label={
          shared
            ? "Daily result shared"
            : sharing
              ? "Sharing daily result"
              : "Share daily result"
        }
      >
        {shared ? (
          <>
            <Check size={16} aria-hidden /> Shared
          </>
        ) : sharing ? (
          "Sharing..."
        ) : (
          <>
            <Share2 size={16} aria-hidden />{" "}
            {canNativeShare ? "Share Daily Result" : "Copy Daily Result"}
          </>
        )}
      </button>

      <div className={styles.countdown}>
        <Timer size={13} aria-hidden />
        <span className={styles.countdownLabel}>Next puzzle in</span>
        <span className={styles.countdownTime}>{countdown}</span>
      </div>
    </div>
  );
}
