// src/app/screens/Menu/MenuScreen.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { HelpModal, type HelpTab } from "@/components/HowToPlay";
import { WhatsNewModal } from "@/components/WhatsNew";
import { HelpMenu } from "@/components/HelpMenu/HelpMenu";
import { DailyPuzzleModal } from "@/components/DailyPuzzleModal/DailyPuzzleModal";
import { Image, Calendar, BarChart3, Sparkles, Camera, HelpCircle } from "lucide-react";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import { isTodayDailyCompleted, getCurrentStreak } from "@/daily/dailyPuzzle";
import { shouldShowChangelog } from "@/data/changelog";

export function MenuScreen() {
  const nav = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>("tutorial");
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);

  const todayCompleted = isTodayDailyCompleted();
  const streak = getCurrentStreak();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("daily") === "1" && SAMPLE_PUZZLES.length > 0) {
      setShowDailyModal(true);
    }
  }, [searchParams]);

  const hasDaily = SAMPLE_PUZZLES.length > 0;

  const handleDailyPuzzle = () => setShowDailyModal(true);

  const handleDailyStart = () => nav("/play");

  const handleDailyClose = (started?: boolean) => {
    setShowDailyModal(false);
    if (!started && searchParams.get("daily") === "1") nav("/", { replace: true });
  };

  const openHelp = (tab: HelpTab) => () => {
    setHelpTab(tab);
    setShowHelp(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />
        </div>

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
              {streak > 0 && (
                <span className={styles.streakBadge}> · {streak} day streak</span>
              )}
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
            className={styles.takePhotoCard}
          >
            <Camera size={24} />
            <span className={styles.actionLabel}>Take Photo</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => nav("/stats")}
            className={styles.statsCard}
          >
            <BarChart3 size={20} />
            <span className={styles.actionLabel}>Stats</span>
          </Button>

          <Button
            variant="secondary"
            onClick={openHelp("tutorial")}
            className={styles.tutorialCard}
          >
            <HelpCircle size={28} />
            <span className={styles.actionLabel}>How to Play</span>
          </Button>
          <ThemeToggle variant="card" />
          <Button
            variant="secondary"
            onClick={() => setShowWhatsNew(true)}
            className={styles.sideBySideCard}
          >
            <Sparkles size={20} />
            <span className={styles.actionLabel}>What&apos;s New</span>
          </Button>
          <div className={styles.sideBySideCard}>
            <HelpMenu
              variant="card"
              onShowHowToPlay={openHelp("tutorial")}
              onShowShortcuts={openHelp("shortcuts")}
            />
          </div>
        </div>
      </div>

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        initialTab={helpTab}
      />
      <WhatsNewModal isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      <DailyPuzzleModal
        isOpen={showDailyModal}
        onClose={(started) => handleDailyClose(started)}
        onStart={handleDailyStart}
      />
    </div>
  );
}

export default MenuScreen;
