/**
 * MenuScreen – home: Daily Phuzzle, Packs, Custom, Stats, Help, About.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { DailyCountdown } from "@/components/DailyCountdown/DailyCountdown";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { AboutModal } from "@/components/AboutModal";
import { WhatsNewModal } from "@/components/WhatsNew";
import { Image, Camera, Package, Trophy } from "lucide-react";
import {
  isTodayDailyCompleted,
  getCurrentStreak,
  getTodayDateString,
} from "@/daily/dailyPuzzleCore";
import { getTodayCompletionCount } from "@/services/leaderboardService";
import { shouldShowChangelog } from "@/data/changelog";

/** Star icon for Start Today's Puzzle. Use public/assets/star.png or fallback to character. */
const STAR_ICON = "/assets/star.png";

function getMenuDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function MenuScreen() {
  const nav = useNavigate();
  const [menuDate] = useState(() => getMenuDate());
  const [streak] = useState(() => getCurrentStreak());
  const [starImgFailed, setStarImgFailed] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showHelpChoice, setShowHelpChoice] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [todayPlayersSolved, setTodayPlayersSolved] = useState<number | null>(null);
  const todayCompleted = isTodayDailyCompleted();
  const hasDaily = true;

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);

  useEffect(() => {
    getTodayCompletionCount(getTodayDateString()).then((count: number) => {
      setTodayPlayersSolved(count);
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.menuDate} aria-live="polite">
          {menuDate}
        </p>
        <div className={styles.homeBar}>
          <button
            type="button"
            className={styles.cornerBtn}
            onClick={() => nav("/stats")}
            aria-label="Leaderboard"
            data-testid="menu-stats"
          >
            <Trophy size={24} />
          </button>
          <h1 className={styles.dailyTitleInBar}>Daily Phuzzle</h1>
          <button
            type="button"
            className={styles.cornerBtn}
            onClick={() => setShowHelpChoice(true)}
            aria-label="Help"
            data-testid="menu-help"
          >
            ?
          </button>
        </div>
        <div className={styles.header}>
          <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />
          <p className={styles.brandName}>phuzzle</p>
          {streak > 0 && (
            <p className={styles.streakLine}>Welcome back. Day {streak} streak 🔥</p>
          )}
        </div>

        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={() => setShowDailyModal(true)}
            disabled={!hasDaily}
            className={`${styles.actionCard} ${styles.actionCardFeatured}`}
            aria-label={
              todayCompleted ? "Start Today's Puzzle (completed)" : "Start Today's Puzzle"
            }
          >
            {starImgFailed ? (
              <span className={styles.starFallback} aria-hidden>
                ★
              </span>
            ) : (
              <img
                src={STAR_ICON}
                alt=""
                className={styles.starIcon}
                onError={() => setStarImgFailed(true)}
              />
            )}
            <span className={styles.actionLabel}>
              {todayCompleted ? "Start Today's Puzzle ✓" : "Start Today's Puzzle"}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => nav("/packs")}
            className={styles.actionCard}
            aria-label="Puzzle Packs"
          >
            <Package size={22} />
            <span className={styles.actionLabel}>Puzzle Packs</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => nav("/new")}
            className={styles.actionCard}
            aria-label="Choose Photo"
          >
            <Image size={22} />
            <span className={styles.actionLabel}>Choose Photo</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => nav("/new?source=camera")}
            className={styles.actionCard}
            aria-label="Snap a Picture"
          >
            <Camera size={22} />
            <span className={styles.actionLabel}>Snap a Picture</span>
          </Button>
        </div>

        {todayPlayersSolved != null && todayPlayersSolved > 0 && (
          <p className={styles.playersSolved} aria-live="polite">
            {todayPlayersSolved.toLocaleString()} players solved today&apos;s puzzle
          </p>
        )}
        <div className={styles.homeCountdownWrap}>
          <DailyCountdown variant="home" />
        </div>
      </div>

      <HelpChoiceModal
        isOpen={showHelpChoice}
        onClose={() => setShowHelpChoice(false)}
        onHowToPlay={() => {
          setShowHelpChoice(false);
          setShowHowToPlay(true);
        }}
        onKeyboardShortcuts={() => {
          setShowHelpChoice(false);
          setShowShortcuts(true);
        }}
        onShowAbout={() => {
          setShowHelpChoice(false);
          setShowAbout(true);
        }}
      />
      <TutorialOverlay
        isOpen={showHowToPlay}
        onComplete={() => setShowHowToPlay(false)}
      />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        onShowWhatsNew={() => {
          setShowAbout(false);
          setShowWhatsNew(true);
        }}
      />
      <WhatsNewModal isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      <DailyDifficultyModal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
      />
    </div>
  );
}
