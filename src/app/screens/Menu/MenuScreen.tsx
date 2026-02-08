import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { WhatsNewModal } from "@/components/WhatsNew";
import { HelpCircle, Image, Calendar, BarChart3, Sparkles, Camera } from "lucide-react";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import { isTodayDailyCompleted } from "@/daily/dailyPuzzle";
import { shouldShowChangelog } from "@/data/changelog";

export function MenuScreen() {
  const nav = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);

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
          <ThemeToggle variant="default" />
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
            onClick={() => setShowHelp(true)}
            className={styles.actionCard}
          >
            <HelpCircle size={20} />
            <span className={styles.actionLabel}>How to Play</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => nav("/stats")}
            className={`${styles.actionCard} ${styles.actionCardFullWidth}`}
          >
            <BarChart3 size={20} />
            <span className={styles.actionLabel}>Stats</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShowWhatsNew(true)}
            className={styles.whatsNewCard}
          >
            <Sparkles size={20} />
            <span className={styles.actionLabel}>What&apos;s New</span>
          </Button>
        </div>
      </div>

      <TutorialOverlay isOpen={showHelp} onComplete={() => setShowHelp(false)} />
      <WhatsNewModal isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      <DailyDifficultyModal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
      />
    </div>
  );
}
