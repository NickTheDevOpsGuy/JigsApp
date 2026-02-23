/**
 * DailyCountdown – countdown to next daily puzzle unlock (UTC midnight).
 * Server-synced, prominent on leaderboard. Celebration at unlock.
 */
import React, { useEffect, useState, useCallback } from "react";
import { Clock } from "lucide-react";
import {
  syncServerTime,
  getSyncedNow,
  getSecondsUntilNextUtcMidnight,
} from "@/services/serverTimeService";
import { isSupabaseConfigured } from "@/supabase/client";
import styles from "./DailyCountdown.module.css";

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface DailyCountdownProps {
  /** When true, use larger/prominent styling */
  prominent?: boolean;
  /** Callback when countdown hits 0 */
  onUnlock?: () => void;
}

export function DailyCountdown({ prominent, onUnlock }: DailyCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [synced, setSynced] = useState(false);

  const tick = useCallback(() => {
    const now = getSyncedNow();
    const secs = getSecondsUntilNextUtcMidnight(now);
    setSecondsLeft(secs);
    if (secs <= 0 && onUnlock && !celebrating) {
      setCelebrating(true);
      onUnlock();
    }
  }, [onUnlock, celebrating]);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncServerTime().then(() => {
        setSynced(true);
        tick();
      });
    } else {
      setSynced(true);
      tick();
    }
  }, []);

  useEffect(() => {
    if (!synced) return;
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [synced, tick]);

  if (secondsLeft == null) return null;

  const justUnlocked = secondsLeft <= 0;
  const display = justUnlocked ? "00:00:00" : formatCountdown(secondsLeft);

  return (
    <div
      className={`${styles.countdown} ${prominent ? styles.prominent : ""} ${
        celebrating ? styles.celebrating : ""
      }`}
      role="timer"
      aria-live="polite"
      aria-label={
        justUnlocked ? "New daily puzzle is ready" : `Next daily puzzle in ${display}`
      }
    >
      <Clock size={prominent ? 20 : 16} className={styles.icon} />
      <span className={styles.label}>
        {justUnlocked ? "New daily ready!" : "Next daily in"}
      </span>
      <span className={styles.time}>{display}</span>
      {celebrating && (
        <div className={styles.confetti} aria-hidden>
          {[...Array(12)].map((_, i) => (
            <span key={i} className={styles.confettiPiece} />
          ))}
        </div>
      )}
    </div>
  );
}
