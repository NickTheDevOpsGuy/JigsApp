import React from "react";
import { createPortal } from "react-dom";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import { PieceTray } from "@/components/PieceTray/PieceTray";
import type { Piece, PuzzleState } from "@/puzzle/core/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Minimap,
  PlayScreenCoopView,
  PlayScreenModals,
  PlayScreenOverlays,
  PlayScreenTopBar,
  CompletionOverlayGate,
  PauseOverlay,
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
    /** Solid “solved” frame + no conic ring; false during last-snap delay before win modal. */
    boardFrameCompletePhase: boolean;
    /** Inline “Solved in …” on the board — false during replay and after closing replay (X). */
    showInlineBoardCompleteChrome: boolean;
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
      onPointerLeave: React.PointerEventHandler<HTMLCanvasElement>;
    };
    isPaused: boolean;
    onResume: () => void;
    postCompletionCta: { label: string; onNext: () => void } | null;
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
    onTrayPieceHover?: (pieceId: string | null) => void;
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
  const isMobile = useMediaQuery("(max-width: 600px)");
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onImmersiveReveal();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Show menu and controls"
            title="Show menu and controls"
          />
        )}

        <PlayScreenModals {...modalsProps} replayBarOpen={hideTopBarControls} />

        <FeedbackChoiceModal {...feedbackProps} />

        {completionProps && <CompletionOverlayGate {...completionProps} />}

        {replayPortalProps &&
          createPortal(<ReplaySolveModal {...replayPortalProps} />, document.body)}

        {/* GameplayShell: single layout anchor. TopHUD, PuzzleBoard, TrayHandle, PieceTray share same left edge and width. */}
        <div
          className={styles.boardLayoutShell}
          data-layout="gameplay-shell"
          data-replay-active={replayPortalProps ? "true" : undefined}
          style={
            board.boardSize.w > 0
              ? ({
                  "--play-board-live-width": `${Math.round(board.boardSize.w)}px`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <PlayScreenTopBar {...topBarProps} hideMenuAndButtons={hideTopBarControls} />

          <div className={styles.playBody} data-layout="play-body">
            <div
              className={styles.main}
              data-layout="puzzle-board"
              ref={board.mainRef as React.RefObject<HTMLDivElement>}
            >
              <div className={styles.boardWrapper}>
                <div
                  className={styles.boardProgressFrame}
                  data-complete={board.boardFrameCompletePhase ? "true" : undefined}
                  style={
                    board.state?.totalCount && !board.boardFrameCompletePhase
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
                    {board.showInlineBoardCompleteChrome && (
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
                        {board.postCompletionCta && (
                          <div className={styles.boardCompleteNextCta}>
                            <button
                              type="button"
                              className={styles.boardCompleteNextCtaBtn}
                              onClick={board.postCompletionCta.onNext}
                            >
                              {board.postCompletionCta.label}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {board.isLoading && (
                      <div className={styles.loadingOverlay} aria-label="Loading puzzle">
                        <div className={styles.spinner} />
                        <span>Loading puzzle…</span>
                      </div>
                    )}
                    {!board.state?.isComplete && (
                      <SnapComboMeter combo={board.snapCombo} />
                    )}
                    <canvas
                      key={board.puzzleKey ?? undefined}
                      className={styles.canvas}
                      ref={board.canvasRef as React.RefObject<HTMLCanvasElement>}
                      role="img"
                      aria-label="Puzzle board. Drag pieces toward the highlighted target; release when Fits here appears."
                      style={replayPortalProps ? { pointerEvents: "none" } : undefined}
                      onPointerDown={board.handlers.onPointerDown}
                      onPointerMove={board.handlers.onPointerMove}
                      onPointerUp={board.handlers.onPointerUp}
                      onPointerCancel={board.handlers.onPointerCancel}
                      onLostPointerCapture={board.handlers.onLostPointerCapture}
                      onContextMenu={board.handlers.onContextMenu}
                      onPointerLeave={board.handlers.onPointerLeave}
                      onWheel={(e) =>
                        board.viewport.handleWheel(e, board.boardRef.current)
                      }
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
            {/* Tray is always mounted when not in replay so it acts as a size-preserving
                spacer — the board must not resize when the puzzle completes and tray content
                is hidden. visibility:hidden keeps the element in layout flow but invisible.
                We check replayPortalProps (not tray.show) so it stays mounted on complete. */}
            {!replayPortalProps && (
              <div
                className={`${styles.trayArea} ${isMobile ? styles.trayAreaSheet : ""} ${tray.immersiveMode && !tray.showImmersiveUi ? styles.immersiveHidden : ""}`}
                data-layout="tray-dock"
                onPointerLeave={tray.onPointerLeave}
                style={
                  board.boardFrameCompletePhase
                    ? { visibility: "hidden", pointerEvents: "none" }
                    : undefined
                }
              >
                <div data-layout="piece-tray" style={{ width: "100%", minWidth: 0 }}>
                  <PieceTray
                    key={tray.puzzleKey ?? undefined}
                    ref={tray.trayRef as React.RefObject<HTMLDivElement>}
                    pieces={tray.trayPieces}
                    image={overlaysProps.previewImage}
                    grid={tray.trayGrid}
                    onPieceClick={tray.onTrayPieceClick}
                    onTrayPieceHover={tray.onTrayPieceHover}
                    highlightedPieceIds={tray.highlightedPieceIds}
                    className={`${styles.trayInDock} ${tray.isLargeTray ? styles.trayWrapLarge : ""}`.trim()}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <PlayScreenOverlays {...overlaysProps} />
      </div>
    </PlayScreenCoopView>
  );
}
