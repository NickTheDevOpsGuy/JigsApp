/**
 * Play screen top bar: HeaderMenu, CoopStatusIndicator, PlayHUD, TopBarButtons.
 */
import React from "react";
import type { HeaderMenuProps } from "./headerMenuConfig";
import { CoopStatusIndicator } from "./CoopStatusIndicator";
import { PlayHUD } from "./PlayHUD";
import { TopBarButtons } from "./TopBarButtons";
import { HeaderMenu } from "./HeaderMenu";
import type { RealtimeStatus } from "../hooks/usePuzzleSession";
import type { TimeMode } from "../timeMode";
import styles from "../PlayScreen.module.css";

export type PlayScreenTopBarProps = {
  headerMenuProps: HeaderMenuProps;
  sessionId: string | null;
  realtimeStatus: RealtimeStatus;
  connectedCount: number;
  showHud: boolean;
  hudProps: {
    elapsedSeconds: number;
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
}: PlayScreenTopBarProps) {
  return (
    <div
      className={`${styles.topBarWrap} ${immersiveMode && !showImmersiveUi ? styles.immersiveTopHidden : ""}`}
      onPointerLeave={onPointerLeave}
    >
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <HeaderMenu {...headerMenuProps} />
        </div>
        <div className={styles.topBarCenter}>
          {sessionId && (
            <CoopStatusIndicator
              status={realtimeStatus}
              connectedCount={connectedCount}
            />
          )}
          {showHud && (
            <div className={styles.topBarHud} aria-live="polite">
              <PlayHUD {...hudProps} />
            </div>
          )}
        </div>
        <TopBarButtons {...topBarButtonsProps} />
      </div>
    </div>
  );
}
