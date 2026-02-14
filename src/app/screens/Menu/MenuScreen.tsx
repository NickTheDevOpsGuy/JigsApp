import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { ThemeModal } from "@/components/ThemeModal";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { AboutModal } from "@/components/AboutModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { WhatsNewModal } from "@/components/WhatsNew";
import { HelpCircle, Image, Calendar, Camera, Package } from "lucide-react";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import { isTodayDailyCompleted } from "@/daily/dailyPuzzle";
import { shouldShowChangelog } from "@/data/changelog";
import { getMenuTagline } from "@/data/menuTips";

export function MenuScreen() {
  const nav = useNavigate();
  const [tagline] = useState(() => getMenuTagline());
  const [showHelpChoice, setShowHelpChoice] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const todayCompleted = isTodayDailyCompleted();
  const hasDaily = SAMPLE_PUZZLES.length > 0;

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />
        </div>

        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={() => setShowDailyModal(true)}
            disabled={!hasDaily}
            className={styles.actionCard}
          >
            <Calendar size={24} />
            <span className={styles.actionLabel}>
              {todayCompleted ? "Today's Puzzle ✓" : "Today's Puzzle"}
            </span>
          </Button>

          <Button
            variant="primary"
            onClick={() => nav("/packs")}
            className={styles.actionCard}
          >
            <Package size={24} />
            <span className={styles.actionLabel}>Puzzle Packs</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => nav("/new")}
            className={styles.actionCard}
          >
            <Image size={24} />
            <span className={styles.actionLabel}>Choose Photo</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => nav("/new?source=camera")}
            className={styles.actionCard}
          >
            <Camera size={24} />
            <span className={styles.actionLabel}>Snap a Picture</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShowHelpChoice(true)}
            className={`${styles.actionCard} ${styles.actionCardFullWidth}`}
          >
            <HelpCircle size={20} />
            <span className={styles.actionLabel}>Help</span>
          </Button>
        </div>

        <p className={styles.menuTip}>{tagline}</p>
      </div>

      <HelpChoiceModal
        isOpen={showHelpChoice}
        onClose={() => setShowHelpChoice(false)}
        onHowToPlay={() => setShowHowToPlay(true)}
        onKeyboardShortcuts={() => setShowShortcuts(true)}
        onShowAbout={() => setShowAbout(true)}
        onOpenSettings={() => nav("/stats")}
        onOpenTheme={() => setShowThemeModal(true)}
      />
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        onShowWhatsNew={() => {
          setShowAbout(false);
          setShowWhatsNew(true);
        }}
      />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <TutorialOverlay
        isOpen={showHowToPlay}
        onComplete={() => setShowHowToPlay(false)}
      />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
      <WhatsNewModal isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      <DailyDifficultyModal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
      />
    </div>
  );
}
