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
    highlightedPieceIds?: Set<string>;
    isLargeTray: boolean;
  };
  overlaysProps: React.ComponentProps<typeof PlayScreenOverlays>;
};

type MobileTraySheetState = "collapsed" | "half" | "full";

const MOBILE_TRAY_HEIGHTS: Record<MobileTraySheetState, number> = {
  collapsed: 72,
  half: 224,
  full: 360,
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
  const [mobileTrayState, setMobileTrayState] =
    React.useState<MobileTraySheetState>("half");
  const [trayDragOffset, setTrayDragOffset] = React.useState(0);
  const trayDragRef = React.useRef<{
    pointerId: number;
    startY: number;
    startedAt: number;
    stateAtStart: MobileTraySheetState;
    moved: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (!isMobile) {
      setMobileTrayState("half");
      setTrayDragOffset(0);
    }
  }, [isMobile]);

  const trayOrder = React.useMemo<MobileTraySheetState[]>(
    () => ["collapsed", "half", "full"],
    [],
  );
  const currentTrayHeight = isMobile ? MOBILE_TRAY_HEIGHTS[mobileTrayState] : 0;
  const trayReservedHeight = isMobile ? currentTrayHeight + 12 : 0;

  const settleTray = React.useCallback(
    (direction: -1 | 0 | 1) => {
      setMobileTrayState((prev) => {
        const index = trayOrder.indexOf(prev);
        const nextIndex = Math.max(0, Math.min(trayOrder.length - 1, index + direction));
        return trayOrder[nextIndex];
      });
      setTrayDragOffset(0);
    },
    [trayOrder],
  );

  const handleTrayHandlePointerDown = React.useCallback<
    React.PointerEventHandler<HTMLButtonElement>
  >(
    (e) => {
      if (!isMobile) return;
      trayDragRef.current = {
        pointerId: e.pointerId,
        startY: e.clientY,
        startedAt: performance.now(),
        stateAtStart: mobileTrayState,
        moved: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [isMobile, mobileTrayState],
  );

  const handleTrayHandlePointerMove = React.useCallback<
    React.PointerEventHandler<HTMLButtonElement>
  >(
    (e) => {
      if (
        !isMobile ||
        !trayDragRef.current ||
        trayDragRef.current.pointerId !== e.pointerId
      ) {
        return;
      }
      const drag = trayDragRef.current;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dy) > 4) drag.moved = true;
      const baseHeight = MOBILE_TRAY_HEIGHTS[drag.stateAtStart];
      const maxRaise = MOBILE_TRAY_HEIGHTS.full - baseHeight;
      const maxLower = baseHeight - MOBILE_TRAY_HEIGHTS.collapsed;
      let nextOffset = dy;
      if (dy < -maxRaise) {
        nextOffset = -maxRaise - Math.sqrt(Math.abs(dy + maxRaise)) * 0.35;
      } else if (dy > maxLower) {
        nextOffset = maxLower + Math.sqrt(Math.abs(dy - maxLower)) * 0.35;
      }
      setTrayDragOffset(nextOffset);
    },
    [isMobile],
  );

  const handleTrayHandlePointerUp = React.useCallback<
    React.PointerEventHandler<HTMLButtonElement>
  >(
    (e) => {
      if (
        !isMobile ||
        !trayDragRef.current ||
        trayDragRef.current.pointerId !== e.pointerId
      ) {
        return;
      }
      const drag = trayDragRef.current;
      const dy = e.clientY - drag.startY;
      const dt = Math.max(1, performance.now() - drag.startedAt);
      const velocity = dy / dt;

      if (!drag.moved && Math.abs(dy) < 8) {
        settleTray(
          mobileTrayState === "collapsed" ? 1 : mobileTrayState === "full" ? -1 : 1,
        );
      } else if (dy < -54 || velocity < -0.45) {
        settleTray(1);
      } else if (dy > 54 || velocity > 0.45) {
        settleTray(-1);
      } else {
        setTrayDragOffset(0);
      }

      trayDragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [isMobile, mobileTrayState, settleTray],
  );

  const pageStyleWithTray = React.useMemo<React.CSSProperties>(
    () => ({
      ...pageStyle,
      ["--mobile-tray-height" as string]: `${trayReservedHeight}px`,
      ["--mobile-tray-drag-offset" as string]: `${trayDragOffset}px`,
    }),
    [pageStyle, trayReservedHeight, trayDragOffset],
  );

  return (
    <PlayScreenCoopView {...coopViewProps}>
      <div
        className={pageClassName}
        style={pageStyleWithTray}
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
              {isMobile && tray.showUndoRedo && (
                <div className={styles.boardUndoRedo}>
                  <UndoRedoButtons
                    canUndo={tray.canUndo}
                    onUndo={tray.onUndo}
                    canRedo={tray.canRedo}
                    onRedo={tray.onRedo}
                  />
                </div>
              )}
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
                  {board.isComplete && !replayPortalProps && (
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
              className={`${styles.trayArea} ${isMobile ? styles.trayAreaSheet : ""} ${tray.immersiveMode && !tray.showImmersiveUi ? styles.immersiveHidden : ""}`}
              onPointerLeave={tray.onPointerLeave}
              data-tray-state={isMobile ? mobileTrayState : undefined}
              style={
                isMobile
                  ? ({
                      ["--tray-sheet-height" as string]: `${currentTrayHeight}px`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {tray.showUndoRedo && !isMobile && (
                <div className={styles.undoRedoPillsWrap}>
                  <UndoRedoButtons
                    canUndo={tray.canUndo}
                    onUndo={tray.onUndo}
                    canRedo={tray.canRedo}
                    onRedo={tray.onRedo}
                  />
                </div>
              )}
              {isMobile && (
                <button
                  type="button"
                  className={styles.traySheetHandle}
                  onPointerDown={handleTrayHandlePointerDown}
                  onPointerMove={handleTrayHandlePointerMove}
                  onPointerUp={handleTrayHandlePointerUp}
                  onPointerCancel={handleTrayHandlePointerUp}
                  aria-label={`Pieces drawer, ${mobileTrayState}`}
                  title="Open or close piece drawer"
                >
                  <span className={styles.traySheetHandleBar} />
                  <span className={styles.traySheetHandleText}>
                    {mobileTrayState === "collapsed"
                      ? "▲"
                      : mobileTrayState === "full"
                        ? "▼"
                        : "◆"}{" "}
                    Pieces ({tray.trayPieces.length})
                  </span>
                </button>
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
