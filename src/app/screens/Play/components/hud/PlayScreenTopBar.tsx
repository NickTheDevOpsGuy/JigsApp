/**
 * Play screen top bar (HUD): [Settings] [Timer] [Moves] [Pieces 0/16].
 * Minimal only; max control height 44px. Undo/Redo live in Settings → Moves only.
 */
import React from "react";
import type { HeaderMenuProps } from "@/screens/Play/components/headerMenu/headerMenuConfig";
import { CoopStatusIndicator } from "@/screens/Play/components/coop/CoopStatusIndicator";
import { PlayHUD } from "./PlayHUD";
import { TopBarButtons } from "./TopBarButtons";
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
  hideMenuAndButtons?: boolean;
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
}: PlayScreenTopBarProps) {
  return (
    <div
      className={`${styles.topBarWrap} ${immersiveMode && !showImmersiveUi ? styles.immersiveTopHidden : ""}`}
      onPointerLeave={onPointerLeave}
    >
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          {!hideMenuAndButtons && <HeaderMenu {...headerMenuProps} />}
          {sessionId && (
            <CoopStatusIndicator
              status={realtimeStatus}
              connectedCount={connectedCount}
            />
          )}
          {showHud && (
            <div className={styles.topBarLeft} aria-live="polite">
              <PlayHUD {...hudProps} slot="left" />
            </div>
          )}
          <div className={styles.topBarRight}>
            {!hideMenuAndButtons && <TopBarButtons {...topBarButtonsProps} />}
          </div>
        </div>
      </div>
    </div>
  );
}
