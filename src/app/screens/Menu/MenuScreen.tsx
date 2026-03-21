/**
 * MenuScreen – mobile-first home with one clear play CTA and lightweight daily momentum.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Trophy } from "lucide-react";

import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { AdvancedModal } from "@/components/AdvancedModal";
import { AboutModal } from "@/components/AboutModal";
import { ChoosePuzzleModal } from "@/components/ChoosePuzzleModal";
import { DailyCountdown } from "@/components/DailyCountdown/DailyCountdown";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal";
import { FeedbackChoiceModal } from "@/components/FeedbackChoiceModal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ConfirmModal } from "@/components/Modal/Modal";
import { PackChoiceModal } from "@/components/PackChoiceModal";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { WhatsNewModal } from "@/components/WhatsNew";
import { shouldShowChangelog } from "@/data/content/changelog";
import { preloadPacksData, preloadPuzzleCatalog } from "@/data/packs/loadPacksData";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import { BEST_TIME_PREFIX } from "@/screens/Play/core/time/timeMode";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { HomeTopBar } from "@/screens/Menu/components/HomeTopBar";
import { MomentumStrip } from "@/screens/Menu/components/MomentumStrip";
import { PrimaryDailyAction } from "@/screens/Menu/components/PrimaryDailyAction";
import { ResumePuzzleCard } from "@/screens/Menu/components/ResumePuzzleCard";
import { SecondaryActions } from "@/screens/Menu/components/SecondaryActions";
import { useMenuHomeData } from "@/screens/Menu/hooks/useMenuHomeData";
import { isDailyPuzzleSession } from "@/daily/dailyPuzzle";

const STAR_ICON = "/assets/star.png";

function getMenuDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const MENU_TAGLINES = [
  "Open the app. Start the daily. Keep the streak moving.",
  "Your daily puzzle is ready when you are.",
  "One puzzle, one clean win.",
  "Fast start. Sharp finish.",
  "Today’s puzzle is waiting for you.",
  "A quick play session beats scrolling.",
  "Small challenge. Solid payoff.",
];

function getMenuTagline(): string {
  const day = new Date().getDay();
  return MENU_TAGLINES[day] ?? MENU_TAGLINES[0];
}

function formatSavedAt(savedAt: number): string {
  return new Date(savedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MenuScreen() {
  const nav = useNavigate();
  const { menuSnapshot, todayPlayersSolved, refreshSnapshot } = useMenuHomeData();
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

  const {
    streak,
    savedPuzzle,
    todayCompleted,
    todayTime,
    streakFreezeCount,
    dailyPuzzleNumber,
    recentDailyStatuses,
  } = menuSnapshot;

  const hasDaily = true;
  const savedPuzzleProgress = savedPuzzle
    ? Math.round(
        (savedPuzzle.pieces.filter((piece) => piece.isPlaced).length /
          Math.max(1, savedPuzzle.pieces.length)) *
          100,
      )
    : null;
  const hasInProgressDaily =
    Boolean(savedPuzzle) && isDailyPuzzleSession() && !todayCompleted;

  const primaryStatus = hasInProgressDaily
    ? savedPuzzleProgress != null
      ? `${savedPuzzleProgress}% solved so far`
      : `Daily #${dailyPuzzleNumber} is waiting`
    : todayCompleted
      ? todayTime != null
        ? `Completed in ${formatTime(todayTime)}`
        : "Completed today"
      : `Daily #${dailyPuzzleNumber} is live`;

  const momentumHint = todayCompleted
    ? "Fresh puzzle lands tomorrow"
    : streak > 0 && streak < 5
      ? `Push your streak to ${streak + 1}`
      : streakFreezeCount > 0
        ? `${streakFreezeCount} freeze${streakFreezeCount === 1 ? "" : "s"} banked`
        : "Daily waiting";

  useEffect(() => {
    if (shouldShowChangelog()) setShowWhatsNew(true);
  }, []);

  useEffect(() => {
    preloadPacksData();
    preloadPuzzleCatalog();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <HomeTopBar
          logoSrc={logoImg}
          menuDate={getMenuDate()}
          onOpenStats={() => nav("/stats")}
          onOpenHelp={() => setShowHelpChoice(true)}
          statsIcon={<Trophy size={22} />}
        />

        <div className={styles.header}>
          <div className={styles.headerBlurb}>
            <p className={styles.teaserLine}>
              {todayPlayersSolved != null && todayPlayersSolved >= 10
                ? `${todayPlayersSolved.toLocaleString()} players solved today.`
                : getMenuTagline()}
            </p>
          </div>
        </div>

        <div className={styles.actionsGrid}>
          <PrimaryDailyAction
            hasDaily={hasDaily}
            todayCompleted={todayCompleted}
            hasInProgressDaily={hasInProgressDaily}
            primaryStatus={primaryStatus}
            starIconSrc={STAR_ICON}
            starImgFailed={starImgFailed}
            onStarError={() => setStarImgFailed(true)}
            onClick={() => {
              if (hasInProgressDaily) {
                nav("/play");
                return;
              }
              setShowDailyModal(true);
            }}
          />

          <MomentumStrip
            streak={streak}
            streakFreezeCount={streakFreezeCount}
            momentumHint={momentumHint}
            recentDailyStatuses={recentDailyStatuses}
          />

          {savedPuzzle && savedPuzzleProgress != null && (
            <ResumePuzzleCard
              title={hasInProgressDaily ? "Resume today’s daily" : "Resume saved puzzle"}
              contextLabel={
                hasInProgressDaily ? `Daily #${dailyPuzzleNumber}` : "Quick Play"
              }
              progress={savedPuzzleProgress}
              rows={savedPuzzle.grid.rows}
              cols={savedPuzzle.grid.cols}
              elapsedLabel={formatTime(savedPuzzle.elapsedSeconds)}
              savedAtLabel={formatSavedAt(savedPuzzle.savedAt)}
              onClick={() => nav("/play")}
            />
          )}

          <SecondaryActions
            onOpenPacks={() => setShowPackModal(true)}
            onOpenQuickPlay={() => setShowChoosePhotoModal(true)}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFeedbackChoice(true)}
          className={styles.feedbackLink}
          aria-label="Feedback"
          data-testid="menu-feedback-action"
        >
          <Megaphone size={16} />
          <span>Feedback</span>
        </button>

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
            ) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => safeLocalStorage.removeItem(k));
          setShowClearCacheConfirm(false);
          refreshSnapshot();
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
