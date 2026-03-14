/**
 * Play screen top bar: Left = Settings, Timer, Moves; Right = 0/16, Undo/Redo, New Puzzle.
 */
import React from "react";
import type { HeaderMenuProps } from "@/screens/Play/components/headerMenu/headerMenuConfig";
import { CoopStatusIndicator } from "@/screens/Play/components/coop/CoopStatusIndicator";
import { PlayHUD } from "./PlayHUD";
import { TopBarButtons } from "./TopBarButtons";
import { UndoRedoButtons } from "./UndoRedoButtons";
import { HeaderMenu } from "@/screens/Play/components/headerMenu/HeaderMenu";
import type { RealtimeStatus } from "@/screens/Play/hooks/gameplay/usePuzzleSession";
import type { TimeMode } from "@/screens/Play/core/time/timeMode";
import styles from "@/screens/Play/styles/PlayScreen.module.css";

export type PlayScreenTopBarProps = {
  headerMenuProps: HeaderMenuProps;
  sessionId: string | null;
  realtimeStatus: RealtimeStatus;
  connectedCount: number;
  showHud: boolean;
  hudProps: {
    elapsedSeconds: number;
    moveCount: number;
    piecesLeft: number;
    totalPieces: number;
    isPaused: boolean;
    isComplete: boolean;
    timeMode: TimeMode;
    countdownMinutes?: number;
    bestTimeSeconds?: number | null;
    quadrantTimes?: Record<0 | 1 | 2 | 3, number | null>;
    quadrantPbs?: Record<0 | 1 | 2 | 3, number | null>;
    lives?: number;
    onTogglePause: () => void;
    zenModeEnabled?: boolean;
    uiTone?: "competitive" | "calm";
  };
  topBarButtonsProps: {
    showPreview: boolean;
    soundEnabled: boolean;
    isFullscreen: boolean;
    showDebug: boolean;
    isCoarsePointer: boolean;
    onTogglePreview: () => void;
    onToggleSound: () => void;
    onToggleFullscreen: () => void;
    onShowShortcuts: () => void;
    onToggleDebug: () => void;
    onNewPuzzle: () => void;
  };
  immersiveMode: boolean;
  showImmersiveUi: boolean;
  onPointerLeave?: () => void;
  /** When true (e.g. replay mode), hide menu and right-side buttons so they can't be opened. */
  hideMenuAndButtons?: boolean;
  showUndoRedo?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
};

export function PlayScreenTopBar({
  headerMenuProps,
  sessionId,
  realtimeStatus,
  connectedCount,
  showHud,
  hudProps,
  topBarButtonsProps,
  immersiveMode,
  showImmersiveUi,
  onPointerLeave,
  hideMenuAndButtons = false,
  showUndoRedo = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: PlayScreenTopBarProps) {
  return (
    <div
      className={`${styles.topBarWrap} ${immersiveMode && !showImmersiveUi ? styles.immersiveTopHidden : ""}`}
      onPointerLeave={onPointerLeave}
    >
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          {!hideMenuAndButtons && <HeaderMenu {...headerMenuProps} />}
          {sessionId && (
            <CoopStatusIndicator
              status={realtimeStatus}
              connectedCount={connectedCount}
            />
          )}
          {showHud && (
            <div className={styles.topBarHudLeft} aria-live="polite">
              <PlayHUD {...hudProps} layout="left" />
            </div>
          )}
        </div>
        <div className={styles.topBarRight}>
          {showHud && (
            <div className={styles.topBarHudRight} aria-live="polite">
              <PlayHUD {...hudProps} layout="right" />
            </div>
          )}
          {showUndoRedo && onUndo && onRedo && (
            <div className={styles.topBarUndoRedo}>
              <UndoRedoButtons
                canUndo={canUndo}
                onUndo={onUndo}
                canRedo={canRedo}
                onRedo={onRedo}
              />
            </div>
          )}
          {!hideMenuAndButtons && <TopBarButtons {...topBarButtonsProps} />}
        </div>
      </div>
    </div>
  );
}
