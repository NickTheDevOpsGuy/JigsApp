/**
 * PlayScreenOverlays – preview panel, immersive peek, tutorial, shortcuts modal,
 * drag preview, toasts, profiler, coop debug. Keeps PlayScreen.tsx smaller.
 */
import React, { useCallback, useRef, useState } from "react";
import type { Piece, PuzzleState } from "@/puzzle/core/types";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { TutorialOverlay } from "@/components/HowToPlay";
import { ProgressivePreviewOverlay } from "./ProgressivePreviewOverlay";
import { DragPreview } from "./DragPreview";
import { PlayToasts } from "./PlayToasts";
import { ProfilerOverlay } from "./ProfilerOverlay";
import { CoopDebugPanel } from "@/screens/Play/components/coop/CoopDebugPanel";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { OnboardingState } from "./PlayToasts.types";
import styles from "@/screens/Play/styles/PlayScreen.module.css";

export type PlayScreenOverlaysProps = {
  showPreview: boolean;
  progressiveRevealMode: boolean;
  previewImage: HTMLImageElement | null;
  state: PuzzleState | null;
  isComplete?: boolean;
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
  isComplete = false,
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
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const didDragRef = useRef(false);

  const onPreviewPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    setPreviewPosition((prev) => prev ?? { x: rect.left, y: rect.top });
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      originX: rect.left,
      originY: rect.top,
    };
    didDragRef.current = false;
    el.setPointerCapture?.(e.pointerId);
  }, []);

  const onPreviewPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const { clientX, clientY, originX, originY } = dragStartRef.current;
    didDragRef.current = true;
    setPreviewPosition({
      x: originX + (e.clientX - clientX),
      y: originY + (e.clientY - clientY),
    });
  }, []);

  const onPreviewPointerUp = useCallback((e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    try {
      el.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    dragStartRef.current = null;
  }, []);

  const onPreviewClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!didDragRef.current) onPreviewTap(e);
      didDragRef.current = false;
    },
    [onPreviewTap],
  );

  return (
    <>
      {(showPreview || progressiveRevealMode) && previewImage && state && (
        <div
          className={styles.previewPanel}
          role="button"
          tabIndex={0}
          aria-label="Reference image, tap to reveal region. Drag to move."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.preventDefault();
          }}
          onClick={onPreviewClick}
          onPointerDown={onPreviewPointerDown}
          onPointerMove={onPreviewPointerMove}
          onPointerUp={onPreviewPointerUp}
          onPointerCancel={onPreviewPointerUp}
          style={
            previewPosition
              ? {
                  left: previewPosition.x,
                  top: previewPosition.y,
                  right: "auto",
                }
              : undefined
          }
          title="Tap to highlight matching pieces. Drag to move."
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
              draggable={false}
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
        disabledActions={
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
        isComplete={isComplete}
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
          streakToast: styles.streakToast,
          streakFlame: styles.streakFlame,
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
