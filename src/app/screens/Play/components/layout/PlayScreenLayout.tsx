import React from "react";
import { createPortal } from "react-dom";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import { PieceTray } from "@/components/PieceTray/PieceTray";
import type { Piece, PuzzleState } from "@/puzzle/core/types";
import {
  Minimap,
  PlayScreenCoopView,
  PlayScreenModals,
  PlayScreenOverlays,
  PlayScreenTopBar,
  CompletionOverlayGate,
  PauseOverlay,
  UndoRedoButtons,
  ReplaySolveModal,
} from "@/screens/Play/components";
import { FeedbackChoiceModal } from "@/components/FeedbackChoiceModal";
import { SnapComboMeter } from "@/screens/Play/components/hud/SnapComboMeter";

type PlayScreenLayoutProps = {
  coopViewProps: Omit<React.ComponentProps<typeof PlayScreenCoopView>, "children">;
  pageClassName: string;
  pageStyle?: React.CSSProperties;
  pageRef: React.RefObject<HTMLDivElement>;
  immersiveMode: boolean;
  onImmersiveReveal: () => void;
  topBarProps: React.ComponentProps<typeof PlayScreenTopBar>;
  hideTopBarControls: boolean;
  modalsProps: React.ComponentProps<typeof PlayScreenModals>;
  feedbackProps: React.ComponentProps<typeof FeedbackChoiceModal>;
  completionProps: React.ComponentProps<typeof CompletionOverlayGate> | null;
  replayPortalProps: React.ComponentProps<typeof ReplaySolveModal> | null;
  board: {
    mainRef: React.RefObject<HTMLDivElement>;
    boardRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    puzzleKey: number | null;
    state: PuzzleState | null;
    isComplete: boolean;
    isLoading: boolean;
    elapsedLabel: string;
    movesLabel: string;
    snapCombo: number;
    minimapVisible: boolean;
    minimapSuppressed?: boolean;
    minimapPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    boardSize: { w: number; h: number };
    onCycleMinimapPosition: () => void;
    viewport: {
      viewport: { scale: number; panX: number; panY: number };
      setViewport: React.Dispatch<
        React.SetStateAction<{ scale: number; panX: number; panY: number }>
      >;
      handleWheel: (
        e: React.WheelEvent<HTMLCanvasElement>,
        boardEl: HTMLDivElement | null,
      ) => void;
    };
    handlers: {
      onPointerDown: React.PointerEventHandler<HTMLCanvasElement>;
      onPointerMove: React.PointerEventHandler<HTMLCanvasElement>;
      onPointerUp: React.PointerEventHandler<HTMLCanvasElement>;
      onPointerCancel: React.PointerEventHandler<HTMLCanvasElement>;
      onLostPointerCapture: React.PointerEventHandler<HTMLCanvasElement>;
      onContextMenu: React.MouseEventHandler<HTMLCanvasElement>;
    };
    isPaused: boolean;
    onResume: () => void;
  };
  tray: {
    show: boolean;
    immersiveMode: boolean;
    showImmersiveUi: boolean;
    onPointerLeave?: React.PointerEventHandler<HTMLDivElement>;
    showUndoRedo: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    puzzleKey: number | null;
    trayRef: React.RefObject<HTMLDivElement>;
    trayPieces: Piece[];
    trayGrid: { rows: number; cols: number };
    onTrayPieceClick: (pieceId: string) => void;
    highlightedPieceIds?: Set<string>;
    isLargeTray: boolean;
  };
  overlaysProps: React.ComponentProps<typeof PlayScreenOverlays>;
};

export function PlayScreenLayout({
  coopViewProps,
  pageClassName,
  pageStyle,
  pageRef,
  immersiveMode,
  onImmersiveReveal,
  topBarProps,
  hideTopBarControls,
  modalsProps,
  feedbackProps,
  completionProps,
  replayPortalProps,
  board,
  tray,
  overlaysProps,
}: PlayScreenLayoutProps) {
  return (
    <PlayScreenCoopView {...coopViewProps}>
      <div
        className={pageClassName}
        style={pageStyle}
        ref={pageRef as React.RefObject<HTMLDivElement>}
      >
        {immersiveMode && (
          <div
            className={styles.immersivePeekTop}
            onPointerEnter={onImmersiveReveal}
            onPointerDown={onImmersiveReveal}
            role="button"
            tabIndex={-1}
            aria-label="Show menu and controls"
            title="Show menu and controls"
          />
        )}

        <PlayScreenTopBar {...topBarProps} hideMenuAndButtons={hideTopBarControls} />

        <PlayScreenModals {...modalsProps} replayBarOpen={hideTopBarControls} />

        <FeedbackChoiceModal {...feedbackProps} />

        {completionProps && <CompletionOverlayGate {...completionProps} />}

        {replayPortalProps &&
          createPortal(<ReplaySolveModal {...replayPortalProps} />, document.body)}

        <div className={styles.playBody}>
          <div
            className={styles.main}
            ref={board.mainRef as React.RefObject<HTMLDivElement>}
          >
            <div className={styles.boardWrapper}>
              <div
                className={styles.boardProgressFrame}
                data-complete={board.isComplete ? "true" : undefined}
                style={
                  board.state?.totalCount && !board.isComplete
                    ? {
                        ["--progress" as string]:
                          board.state.placedCount / board.state.totalCount,
                        ["--progress-color" as string]:
                          "var(--color-progress-75, #22c55e)",
                      }
                    : undefined
                }
              >
                <div
                  className={styles.board}
                  ref={board.boardRef as React.RefObject<HTMLDivElement>}
                  data-testid="play-board"
                >
                  {board.isComplete && (
                    <div
                      className={styles.boardCompleteMessage}
                      role="status"
                      aria-live="polite"
                    >
                      <div className={styles.boardCompleteBanner}>
                        <span className={styles.boardCompleteBannerLine}>
                          {board.elapsedLabel}
                        </span>
                        <span className={styles.boardCompleteBannerSub}>
                          {board.movesLabel}
                        </span>
                      </div>
                    </div>
                  )}
                  {board.isLoading && (
                    <div className={styles.loadingOverlay} aria-label="Loading puzzle">
                      <div className={styles.spinner} />
                      <span>Loading puzzle…</span>
                    </div>
                  )}
                  {!board.state?.isComplete && <SnapComboMeter combo={board.snapCombo} />}
                  <canvas
                    key={board.puzzleKey ?? undefined}
                    className={styles.canvas}
                    ref={board.canvasRef as React.RefObject<HTMLCanvasElement>}
                    style={replayPortalProps ? { pointerEvents: "none" } : undefined}
                    onPointerDown={board.handlers.onPointerDown}
                    onPointerMove={board.handlers.onPointerMove}
                    onPointerUp={board.handlers.onPointerUp}
                    onPointerCancel={board.handlers.onPointerCancel}
                    onLostPointerCapture={board.handlers.onLostPointerCapture}
                    onContextMenu={board.handlers.onContextMenu}
                    onWheel={(e) => board.viewport.handleWheel(e, board.boardRef.current)}
                  />
                  {board.state?.pieces?.[0] &&
                    board.state.grid &&
                    board.minimapVisible &&
                    !board.minimapSuppressed &&
                    board.state.grid.rows * board.state.grid.cols >= 25 && (
                      <Minimap
                        pieces={board.state.pieces}
                        grid={board.state.grid}
                        assembledW={board.state.grid.cols * board.state.pieces[0].tileW}
                        assembledH={board.state.grid.rows * board.state.pieces[0].tileH}
                        viewport={board.viewport.viewport}
                        containerW={board.boardSize.w}
                        containerH={board.boardSize.h}
                        setViewport={board.viewport.setViewport}
                        visible={!board.isPaused && !board.isComplete}
                        position={board.minimapPosition}
                        onCyclePosition={board.onCycleMinimapPosition}
                      />
                    )}
                  {board.isPaused && !replayPortalProps && !board.isComplete && (
                    <PauseOverlay onResume={board.onResume} />
                  )}
                </div>
              </div>
            </div>
          </div>
          {tray.show && (
            <div
              className={`${styles.trayArea} ${tray.immersiveMode && !tray.showImmersiveUi ? styles.immersiveHidden : ""}`}
              onPointerLeave={tray.onPointerLeave}
            >
              {tray.showUndoRedo && (
                <div className={styles.undoRedoPillsWrap}>
                  <UndoRedoButtons
                    canUndo={tray.canUndo}
                    onUndo={tray.onUndo}
                    canRedo={tray.canRedo}
                    onRedo={tray.onRedo}
                  />
                </div>
              )}
              <div
                className={`${styles.trayWrap} ${tray.isLargeTray ? styles.trayWrapLarge : ""}`}
              >
                <PieceTray
                  key={tray.puzzleKey ?? undefined}
                  ref={tray.trayRef as React.RefObject<HTMLDivElement>}
                  pieces={tray.trayPieces}
                  image={overlaysProps.previewImage}
                  grid={tray.trayGrid}
                  onPieceClick={tray.onTrayPieceClick}
                  highlightedPieceIds={tray.highlightedPieceIds}
                />
              </div>
            </div>
          )}
        </div>

        <PlayScreenOverlays {...overlaysProps} />
      </div>
    </PlayScreenCoopView>
  );
}
