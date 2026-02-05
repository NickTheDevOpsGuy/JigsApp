import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { TutorialOverlay } from "@/components/HowToPlay";
import { WhatsNewModal } from "@/components/WhatsNew";
import { HelpCircle, Image, Calendar, BarChart3, Sparkles } from "lucide-react";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import { startDailyPuzzle, isTodayDailyCompleted } from "@/daily/dailyPuzzle";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import { shouldShowChangelog } from "@/data/changelog";

export function MenuScreen() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showHelp, setShowHelp] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const todayCompleted = isTodayDailyCompleted();

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);
  const hasDaily = SAMPLE_PUZZLES.length > 0;

  const handleDailyPuzzle = () => {
    clearPuzzleState();
    startDailyPuzzle();
    nav("/play");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />

        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={handleDailyPuzzle}
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
            className={styles.actionCard}
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
    </div>
  );
}
