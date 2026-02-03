import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { TutorialOverlay } from "@/components/HowToPlay";
import { HelpCircle, Image, Calendar, BarChart3 } from "lucide-react";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import {
  startDailyPuzzle,
  isTodayDailyCompleted,
  getTodayDailyPuzzle,
} from "@/daily/dailyPuzzle";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";

export function MenuScreen() {
  const nav = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const todayCompleted = isTodayDailyCompleted();
  const dailyConfig = getTodayDailyPuzzle();
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
            {hasDaily && !todayCompleted && (
              <span className={styles.actionHint}>
                {dailyConfig.puzzle.name} · {dailyConfig.grid.rows}×
                {dailyConfig.grid.cols}
              </span>
            )}
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
        </div>
      </div>

      <TutorialOverlay isOpen={showHelp} onComplete={() => setShowHelp(false)} />
    </div>
  );
}
