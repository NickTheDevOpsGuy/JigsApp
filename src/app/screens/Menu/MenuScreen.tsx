import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { ThemeModal } from "@/components/ThemeModal";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { WhatsNewModal } from "@/components/WhatsNew";
import {
  HelpCircle,
  Image,
  Calendar,
  BarChart3,
  Sparkles,
  Camera,
  Palette,
  Share2,
} from "lucide-react";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import { isTodayDailyCompleted } from "@/daily/dailyPuzzle";
import { shouldShowChangelog } from "@/data/changelog";
import { getMenuTip } from "@/data/menuTips";

const APP_URL = typeof window !== "undefined" ? window.location.origin : "";

export function MenuScreen() {
  const nav = useNavigate();
  const [showHelpChoice, setShowHelpChoice] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

  const handleInviteTesters = useCallback(async () => {
    const title = "Phuzzle";
    const text = "Try Phuzzle – a cozy jigsaw puzzle game. I'd love your feedback!";
    const url = APP_URL || "https://phuzzle.vercel.app";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setShareFeedback("Thanks for sharing!");
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setShareFeedback("Share cancelled");
      }
      setTimeout(() => setShareFeedback(""), 3000);
    } else {
      try {
        await navigator.clipboard?.writeText(url);
        setShareFeedback("Link copied! Share it to invite testers.");
      } catch {
        setShareFeedback("Copy failed – share " + url);
      }
      setTimeout(() => setShareFeedback(""), 3000);
    }
  }, []);

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
            className={styles.actionCard}
          >
            <HelpCircle size={20} />
            <span className={styles.actionLabel}>Help</span>
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
            onClick={() => setShowThemeModal(true)}
            className={`${styles.actionCard} ${styles.actionCardFullWidth}`}
          >
            <Palette size={20} />
            <span className={styles.actionLabel}>Theme</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShowWhatsNew(true)}
            className={styles.whatsNewCard}
          >
            <Sparkles size={20} />
            <span className={styles.actionLabel}>What&apos;s New</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleInviteTesters}
            className={`${styles.actionCard} ${styles.actionCardFullWidth}`}
          >
            <Share2 size={20} />
            <span className={styles.actionLabel}>Share app / Invite testers</span>
          </Button>
        </div>

        {shareFeedback ? (
          <p className={styles.shareFeedback} role="status">
            {shareFeedback}
          </p>
        ) : null}
        <p className={styles.menuTip}>{getMenuTip()}</p>
      </div>

      <HelpChoiceModal
        isOpen={showHelpChoice}
        onClose={() => setShowHelpChoice(false)}
        onHowToPlay={() => setShowHowToPlay(true)}
        onKeyboardShortcuts={() => setShowShortcuts(true)}
      />
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
