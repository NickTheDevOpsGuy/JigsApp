/**
 * MenuScreen – home: New Puzzle, Daily, Packs, Stats, Help, About.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { AboutModal } from "@/components/AboutModal";
import { WhatsNewModal } from "@/components/WhatsNew";
import { Image, Camera, Package, HelpCircle, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { isTodayDailyCompleted } from "@/daily/dailyPuzzleCore";
import { shouldShowChangelog } from "@/data/changelog";
import { getActiveEvent } from "@/data/puzzleEvents";
import { getMenuTagline } from "@/data/menuTips";

export function MenuScreen() {
  const nav = useNavigate();
  const [tagline] = useState(() => getMenuTagline());
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showHelpChoice, setShowHelpChoice] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const todayCompleted = isTodayDailyCompleted();
  const hasDaily = true;
  const activeEvent = getActiveEvent();

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerIconLeft}>
              <ThemeToggle variant="default" />
            </div>
            <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />
            <button
              type="button"
              className={styles.helpIconBtn}
              onClick={() => setShowHelpChoice(true)}
              aria-label="Help"
            >
              <HelpCircle size={20} />
            </button>
          </div>
          <p className={styles.menuTip}>{tagline}</p>
        </div>

        {activeEvent && (
          <div className={styles.eventBanner} role="status">
            🎉 {activeEvent.name} — {activeEvent.startDate} to {activeEvent.endDate}
          </div>
        )}
        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={() => setShowDailyModal(true)}
            disabled={!hasDaily}
            className={`${styles.actionCard} ${styles.actionCardFeatured}`}
          >
            <span className={styles.dailyEmoji}>🧩</span>
            <span className={styles.actionLabel}>
              {todayCompleted ? "Today's Puzzle ✓" : "Today's Puzzle"}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => nav("/new")}
            className={styles.actionCard}
          >
            <Image size={22} />
            <span className={styles.actionLabel}>Choose Photo</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => nav("/packs")}
            className={styles.actionCard}
          >
            <Package size={22} />
            <span className={styles.actionLabel}>Puzzle Packs</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => nav("/stats")}
            className={styles.actionCard}
          >
            <Trophy size={22} />
            <span className={styles.actionLabel}>Leaderboard</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => nav("/new?source=camera")}
            className={`${styles.actionCard} ${styles.actionCardFullWidth}`}
          >
            <Camera size={22} />
            <span className={styles.actionLabel}>Snap a Picture</span>
          </Button>
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
