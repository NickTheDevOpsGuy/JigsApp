/**
 * PlayScreenOverlays – preview panel, immersive peek, tutorial, shortcuts modal,
 * drag preview, toasts, profiler, coop debug. Keeps PlayScreen.tsx smaller.
 */
import React from "react";
import type { Piece, PuzzleState } from "@/puzzle/types";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ProgressivePreviewOverlay } from "./ProgressivePreviewOverlay";
import { DragPreview } from "./DragPreview";
import { PlayToasts } from "./PlayToasts";
import { ProfilerOverlay } from "./ProfilerOverlay";
import { CoopDebugPanel } from "./CoopDebugPanel";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { OnboardingState } from "./PlayToasts.types";
import styles from "../PlayScreen.module.css";

export type PlayScreenOverlaysProps = {
  showPreview: boolean;
  progressiveRevealMode: boolean;
  previewImage: HTMLImageElement | null;
  state: PuzzleState | null;
  onPreviewTap: (e: React.MouseEvent<HTMLDivElement>) => void;
  immersiveMode: boolean;
  onImmersiveReveal: () => void;
  showTutorial: boolean;
  showHowToPlay: boolean;
  dismissTutorial: () => void;
  setShowHowToPlay: (show: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  manager: PuzzleManager | null;
  isPaused: boolean;
  dragPreviewPiece: Piece | null;
  dragPreview: { clientX: number; clientY: number; pieceId: string } | null;
  onboarding: OnboardingState;
  showStreakToast: boolean;
  milestoneMessage: string | null;
  announcerLine: string | null;
  shareToast: string | null;
  showProfiler: boolean;
  perfStatsRef: React.MutableRefObject<{
    fps: number;
    drawsPerSec: number;
    activeGroups: number;
    snapCheckCount: number;
    snapChecksPerSec: number;
  }>;
  profilerVisible: boolean;
  sessionId: string | null;
  connectedCount: number;
  lastEventTimestamp: number | null;
  lastDbWriteMs: number | null;
  channelName: string | null;
};

export function PlayScreenOverlays({
  showPreview,
  progressiveRevealMode,
  previewImage,
  state,
  onPreviewTap,
  immersiveMode,
  onImmersiveReveal,
  showTutorial,
  showHowToPlay,
  dismissTutorial,
  setShowHowToPlay,
  showShortcuts,
  setShowShortcuts,
  manager,
  isPaused,
  dragPreviewPiece,
  dragPreview,
  onboarding,
  showStreakToast,
  milestoneMessage,
  announcerLine,
  shareToast,
  showProfiler,
  perfStatsRef,
  profilerVisible,
  sessionId,
  connectedCount,
  lastEventTimestamp,
  lastDbWriteMs,
  channelName,
}: PlayScreenOverlaysProps) {
  return (
    <>
      {(showPreview || progressiveRevealMode) && previewImage && state && (
        <div
          className={styles.previewPanel}
          role="button"
          tabIndex={0}
          aria-label="Reference image, tap to reveal region"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.preventDefault();
          }}
          onClick={onPreviewTap}
          title="Tap to highlight matching pieces in drawer"
        >
          {progressiveRevealMode && state?.pieces ? (
            <ProgressivePreviewOverlay
              image={previewImage}
              pieces={state.pieces}
              grid={state.grid}
              width={140}
              height={140}
            />
          ) : (
            <img
              src={previewImage.src}
              alt="Puzzle preview"
              className={styles.previewImage}
            />
          )}
        </div>
      )}

      {immersiveMode && (
        <div
          className={styles.immersivePeekBottom}
          onPointerEnter={onImmersiveReveal}
          onPointerDown={onImmersiveReveal}
          role="button"
          tabIndex={-1}
          aria-label="Show piece drawer"
          title="Show piece drawer"
        />
      )}

      <TutorialOverlay
        isOpen={showTutorial || showHowToPlay}
        onComplete={() => {
          if (showTutorial) dismissTutorial();
          setShowHowToPlay(false);
        }}
        showSkipLink={showTutorial}
      />

      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        disabledIds={
          state && manager
            ? [
                ...(!manager.canUndo() || isPaused || state.isComplete
                  ? (["undo"] as const)
                  : []),
                ...(!manager.canRedo() || isPaused || state.isComplete
                  ? (["redo"] as const)
                  : []),
              ]
            : undefined
        }
      />

      {dragPreviewPiece && dragPreview && previewImage && state && (
        <DragPreview
          clientX={dragPreview.clientX}
          clientY={dragPreview.clientY}
          piece={dragPreviewPiece}
          image={previewImage}
          grid={state.grid}
        />
      )}

      <PlayToasts
        onboarding={onboarding}
        showFirstSnapToast={onboarding.showFirstSnapToast}
        showStreakToast={showStreakToast}
        milestoneMessage={milestoneMessage}
        announcerLine={announcerLine}
        shareToast={shareToast}
        classNames={{
          engagementToast: styles.engagementToast,
          announcerToast: styles.announcerToast,
          toastDismiss: styles.toastDismiss,
          onboardingOverlay: styles.onboardingOverlay,
          onboardingOverlayTray: styles.onboardingOverlayTray,
        }}
      />

      {showProfiler && (
        <ProfilerOverlay statsRef={perfStatsRef} visible={profilerVisible} />
      )}

      {sessionId && (
        <CoopDebugPanel
          sessionId={sessionId}
          connectedCount={connectedCount}
          lastEventTimestamp={lastEventTimestamp}
          lastDbWriteMs={lastDbWriteMs}
          channelName={channelName}
        />
      )}
    </>
  );
}
