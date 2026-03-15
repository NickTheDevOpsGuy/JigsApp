/**
 * MenuScreen – home: date above card, Phuzzle in bar, Packs, Custom, Stats, Help, About.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { PackChoiceModal } from "@/components/PackChoiceModal";
import { ChoosePuzzleModal } from "@/components/ChoosePuzzleModal";
import { DailyCountdown } from "@/components/DailyCountdown/DailyCountdown";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { FeedbackChoiceModal } from "@/components/FeedbackChoiceModal";
import { AdvancedModal } from "@/components/AdvancedModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { AboutModal } from "@/components/AboutModal";
import { WhatsNewModal } from "@/components/WhatsNew";
import { ConfirmModal } from "@/components/Modal/Modal";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { BEST_TIME_PREFIX } from "@/screens/Play/core/time/timeMode";
import { Image, Package, Trophy, Megaphone } from "lucide-react";
import {
  isTodayDailyCompleted,
  getCurrentStreak,
  getTodayDateString,
} from "@/daily/dailyPuzzleCore";
import { getTodayCompletionCount } from "@/services/leaderboard/leaderboardService";
import { shouldShowChangelog } from "@/data/content/changelog";
import { preloadPacksData, preloadPuzzleCatalog } from "@/data/packs/loadPacksData";

/** Star icon for Start Today's Puzzle. Use public/assets/star.png or fallback to character. */
const STAR_ICON = "/assets/star.png";

function getMenuDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Rotating taglines for delight — one per day of week so it's consistent. */
const MENU_TAGLINES = [
  "Be one of the first to solve today's puzzle.",
  "One puzzle a day. You've got this. ✨",
  "Today's puzzle is waiting for you. 🧩",
  "Ready when you are.",
  "One puzzle. One win. 🌟",
  "Your daily dose of satisfaction.",
  "Time to piece it together. 💪",
];

function getMenuTagline(): string {
  const day = new Date().getDay();
  return MENU_TAGLINES[day] ?? MENU_TAGLINES[0];
}

export function MenuScreen() {
  const nav = useNavigate();
  const [menuDate] = useState(() => getMenuDate());
  const [streak] = useState(() => getCurrentStreak());
  const [starImgFailed, setStarImgFailed] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [showChoosePhotoModal, setShowChoosePhotoModal] = useState(false);
  const [showHelpChoice, setShowHelpChoice] = useState(false);
  const [showFeedbackChoice, setShowFeedbackChoice] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = useState(false);
  const [todayPlayersSolved, setTodayPlayersSolved] = useState<number | null>(null);
  const todayCompleted = isTodayDailyCompleted();
  const hasDaily = true;

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);

  useEffect(() => {
    preloadPacksData();
    preloadPuzzleCatalog();
  }, []);

  useEffect(() => {
    getTodayCompletionCount(getTodayDateString()).then((count: number) => {
      setTodayPlayersSolved(count);
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
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
          <p className={styles.dailyTitleInBar} aria-live="polite">
            {menuDate}
          </p>
          <div className={styles.cornerBtns}>
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
        </div>
        <div className={styles.header}>
          <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />
          <div className={styles.headerBlurb}>
            {streak > 0 && (
              <p className={styles.streakLine}>Welcome back. Day {streak} streak 🔥</p>
            )}
            {todayPlayersSolved != null && todayPlayersSolved >= 10 ? (
              <p className={styles.playersSolved} aria-live="polite">
                {todayPlayersSolved.toLocaleString()} players solved today&apos;s puzzle.
                Can you?
              </p>
            ) : (
              <p className={styles.teaserLine}>{getMenuTagline()}</p>
            )}
          </div>
        </div>

        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={() => setShowDailyModal(true)}
            disabled={!hasDaily}
            className={styles.actionCard}
            aria-label={todayCompleted ? "Today's Puzzle (completed)" : "Today's Puzzle"}
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
              {todayCompleted ? "Today's Puzzle ✓" : "Today's Puzzle"}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowPackModal(true)}
            className={styles.actionCard}
            aria-label="Puzzle Packs"
          >
            <Package size={22} />
            <span className={styles.actionLabel}>Puzzle Packs</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowChoosePhotoModal(true)}
            className={styles.actionCard}
            aria-label="Choose Photo"
          >
            <Image size={22} />
            <span className={styles.actionLabel}>Choose Photo</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFeedbackChoice(true)}
            className={styles.actionCard}
            aria-label="Feedback"
            data-testid="menu-feedback-action"
          >
            <Megaphone size={22} />
            <span className={styles.actionLabel}>Feedback</span>
          </Button>
        </div>

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
        onOpenFeedback={() => {
          setShowHelpChoice(false);
          setShowFeedbackChoice(true);
        }}
        onOpenAdvanced={() => {
          setShowHelpChoice(false);
          setShowAdvanced(true);
        }}
      />
      <FeedbackChoiceModal
        isOpen={showFeedbackChoice}
        onClose={() => setShowFeedbackChoice(false)}
      />
      <AdvancedModal
        isOpen={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        onClearCache={() => setShowClearCacheConfirm(true)}
        onResetStats={() => setShowResetStatsConfirm(true)}
      />
      <ConfirmModal
        isOpen={showResetStatsConfirm}
        onClose={() => setShowResetStatsConfirm(false)}
        onConfirm={() => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < safeLocalStorage.length; i++) {
            const k = safeLocalStorage.key(i);
            if (k?.startsWith(BEST_TIME_PREFIX)) keysToRemove.push(k);
          }
          keysToRemove.forEach((k) => safeLocalStorage.removeItem(k));
          setShowResetStatsConfirm(false);
        }}
        title="Reset Local Stats?"
        message="This will clear all local best times. This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="danger"
      />
      <ConfirmModal
        isOpen={showClearCacheConfirm}
        onClose={() => setShowClearCacheConfirm(false)}
        onConfirm={() => {
          clearPuzzleState();
          const keysToRemove: string[] = [];
          for (let i = 0; i < safeLocalStorage.length; i++) {
            const k = safeLocalStorage.key(i);
            if (
              k?.startsWith("phuzzle:viewport:") ||
              k === "phuzzle:puzzleState" ||
              k === "phuzzle:puzzleStateBackup"
            )
              keysToRemove.push(k);
          }
          keysToRemove.forEach((k) => safeLocalStorage.removeItem(k));
          setShowClearCacheConfirm(false);
        }}
        title="Clear Cache?"
        message="This will clear saved puzzle state and viewport settings."
        confirmText="Clear"
        cancelText="Cancel"
        variant="danger"
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
      <PackChoiceModal isOpen={showPackModal} onClose={() => setShowPackModal(false)} />
      <ChoosePuzzleModal
        isOpen={showChoosePhotoModal}
        onClose={() => setShowChoosePhotoModal(false)}
      />
      <DailyDifficultyModal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
      />
    </div>
  );
}
