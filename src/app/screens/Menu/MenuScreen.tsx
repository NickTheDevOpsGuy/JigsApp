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
import { Image, Camera, Package, Trophy } from "lucide-react";
import { isTodayDailyCompleted } from "@/daily/dailyPuzzleCore";
import { shouldShowChangelog } from "@/data/changelog";
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

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.homeBar}>
          <button
            type="button"
            className={styles.cornerBtn}
            onClick={() => nav("/stats")}
            aria-label="Stats and leaderboard"
          >
            <Trophy size={24} />
          </button>
          <button
            type="button"
            className={styles.cornerBtn}
            onClick={() => setShowHelpChoice(true)}
            aria-label="Help"
          >
            ?
          </button>
        </div>

        <div className={styles.header}>
          <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />
          <p className={styles.menuTip}>{tagline}</p>
        </div>

        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={() => setShowDailyModal(true)}
            disabled={!hasDaily}
            className={`${styles.actionCard} ${styles.actionCardFeatured}`}
            aria-label={todayCompleted ? "Today's Puzzle (completed)" : "Today's Puzzle"}
          >
            <span className={styles.dailyEmoji}>🧩</span>
            <span className={styles.actionLabel}>
              {todayCompleted ? "Today's Puzzle ✓" : "Today's Puzzle"}
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
