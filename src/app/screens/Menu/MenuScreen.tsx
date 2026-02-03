import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { TutorialOverlay } from "@/components/HowToPlay";
import { HelpCircle, Image, Calendar } from "lucide-react";
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

        <Button variant="secondary" onClick={() => setShowHelp(true)} fullWidth>
          <HelpCircle size={18} />
          How to Play
        </Button>

        <Button
          variant="primary"
          onClick={handleDailyPuzzle}
          fullWidth
          disabled={!hasDaily}
        >
          <Calendar size={18} />
          {todayCompleted ? "Today's Puzzle (completed ✓)" : "Today's Puzzle"}
        </Button>
        {hasDaily && !todayCompleted && (
          <p className={styles.dailyHint}>
            {dailyConfig.puzzle.name} · {dailyConfig.grid.rows}×{dailyConfig.grid.cols}
          </p>
        )}

        <Button variant="primary" onClick={() => nav("/new")} fullWidth>
          <Image size={18} />
          Choose Puzzle Photo
        </Button>
      </div>

      <TutorialOverlay isOpen={showHelp} onComplete={() => setShowHelp(false)} />
    </div>
  );
}
