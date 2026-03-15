import React from "react";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import { PlayScreenLayout } from "@/screens/Play/components";

interface PlayScreenLayoutArgs {
  isHost: boolean;
  sessionIdFromUrl: string | null;
  sessionLoading: boolean;
  session: unknown;
  joinError: string | null;
  retryJoin: () => void;
  navigate: (to: string, opts?: unknown) => void;
  pageClassName: string;
  pageStyle?: React.CSSProperties;
  pageRef: React.RefObject<HTMLDivElement>;
  immersiveMode: boolean;
  handleImmersiveReveal: () => void;
  topBarProps: Record<string, unknown>;
  replayBarOpen: boolean;
  showImmersiveUi: boolean;
  awaitingResumeChoice: boolean;
  resumeChoice: unknown;
  setResumeChoice: (choice: unknown) => void;
  showHelpChoice: boolean;
  setShowHelpChoice: (show: boolean) => void;
  setShowHowToPlay: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  showShortcuts: boolean;
  showThemeModal: boolean;
  setShowThemeModal: (show: boolean) => void;
  setShowFeedbackChoice: (show: boolean) => void;
  hapticsEnabled: boolean;
  showNewGameModal: boolean;
  setShowNewGameModal: (show: boolean) => void;
  handleNewGame: () => void;
  showResetStatsConfirm: boolean;
  setShowResetStatsConfirm: (show: boolean) => void;
  showClearCacheConfirm: boolean;
  setShowClearCacheConfirm: (show: boolean) => void;
  showFeedbackChoice: boolean;
  state: import("@/puzzle/core/types").PuzzleState | null;
  completionProps: unknown;
  postCompletionCta: { label: string; onNext: () => void } | null;
  replayPortalProps: unknown;
  mainRef: React.RefObject<HTMLDivElement>;
  boardRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  puzzleKey: number | null;
  isComplete: boolean;
  isLoading: boolean;
  elapsedSeconds: number;
  moveCount: number;
  snapCombo: number;
  minimapVisible: boolean;
  minimapSuppressed?: boolean;
  minimapPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  boardSize: { w: number; h: number };
  cycleMinimapPosition: () => void;
  viewport: {
    viewport: import("@/screens/Play/hooks/viewport/useViewport").ViewportState;
  };
  handlePointerDown: React.PointerEventHandler<HTMLCanvasElement>;
  handlePointerMove: React.PointerEventHandler<HTMLCanvasElement>;
  handlePointerUp: React.PointerEventHandler<HTMLCanvasElement>;
  handlePointerCancel: React.PointerEventHandler<HTMLCanvasElement>;
  handleLostPointerCapture: React.PointerEventHandler<HTMLCanvasElement>;
  handleContextMenu: React.MouseEventHandler<HTMLCanvasElement>;
  isPaused: boolean;
  setIsPaused: (next: boolean) => void;
  scheduleImmersiveHide: () => void;
  manager: import("@/puzzle/manager/PuzzleManager").PuzzleManager | null;
  trayRef: React.RefObject<HTMLDivElement>;
  trayPieces: import("@/puzzle/core/types").Piece[];
  grid: { rows: number; cols: number } | null;
  handleTrayPieceClick: (pieceId: string) => void;
  highlightedPieceIds: Set<string>;
  handleUndo: () => void;
  handleRedo: () => void;
  showPreview: boolean;
  mysteryModeEnabled: boolean;
  progressiveRevealMode: boolean;
  imgRef: React.RefObject<HTMLImageElement>;
  onPreviewTap: () => void;
  showTutorial: boolean;
  showHowToPlay: boolean;
  dismissTutorial: () => void;
  dragPreviewPiece: import("@/puzzle/core/types").Piece | null;
  dragPreview: { clientX: number; clientY: number; pieceId: string } | null;
  onboarding: Record<string, unknown>;
  showStreakToast: boolean;
  milestoneMessage: string | null;
  announcerLine: string;
  shareToast: string | null;
  searchParams: URLSearchParams;
  SHOW_DEBUG: boolean;
  debug: Record<string, unknown>;
  sessionId: string | null;
  sessionResultConnectedCount: number;
  lastEventTimestamp: number | null;
  lastDbWriteMs: number | null;
  channelName: string | null;
  perfStatsRef: React.MutableRefObject<
    import("@/screens/Play/components/overlay/ProfilerOverlay").PerfStats | null
  >;
}

export function createPlayScreenLayoutProps(
  args: PlayScreenLayoutArgs,
): React.ComponentProps<typeof PlayScreenLayout> {
  return {
    coopViewProps: {
      isHost: args.isHost,
      sessionIdFromUrl: args.sessionIdFromUrl,
      sessionLoading: args.sessionLoading,
      session: args.session,
      joinError: args.joinError,
      retryJoin: args.retryJoin,
      navigate: args.navigate,
    },
    pageClassName: args.pageClassName,
    pageStyle: args.pageStyle,
    pageRef: args.pageRef,
    immersiveMode: args.immersiveMode,
    onImmersiveReveal: args.handleImmersiveReveal,
    topBarProps: {
      headerMenuProps: args.topBarProps.headerMenuProps,
      sessionId: args.topBarProps.sessionId,
      realtimeStatus: args.topBarProps.realtimeStatus,
      connectedCount: args.topBarProps.connectedCount,
      showHud: args.topBarProps.showHud,
      hudProps: args.topBarProps.hudProps,
      topBarButtonsProps: args.topBarProps.topBarButtonsProps,
      immersiveMode: args.topBarProps.immersiveMode,
      showImmersiveUi: args.topBarProps.showImmersiveUi,
      onPointerLeave: args.topBarProps.onPointerLeave,
    },
    hideTopBarControls: args.replayBarOpen,
    modalsProps: {
      awaitingResumeChoice: args.awaitingResumeChoice,
      resumeChoice: args.resumeChoice,
      setResumeChoice: args.setResumeChoice,
      showHelpChoice: args.showHelpChoice,
      setShowHelpChoice: args.setShowHelpChoice,
      setShowHowToPlay: args.setShowHowToPlay,
      setShowShortcuts: args.setShowShortcuts,
      showThemeModal: args.showThemeModal,
      setShowThemeModal: args.setShowThemeModal,
      onOpenFeedback: () => {
        args.setShowHelpChoice(false);
        args.setShowFeedbackChoice(true);
      },
      hapticsEnabled: args.hapticsEnabled,
      showNewGameModal: args.showNewGameModal,
      setShowNewGameModal: args.setShowNewGameModal,
      onConfirmNewGame: args.handleNewGame,
      showResetStatsConfirm: args.showResetStatsConfirm,
      setShowResetStatsConfirm: args.setShowResetStatsConfirm,
      showClearCacheConfirm: args.showClearCacheConfirm,
      setShowClearCacheConfirm: args.setShowClearCacheConfirm,
    },
    feedbackProps: {
      isOpen: args.showFeedbackChoice,
      onClose: () => args.setShowFeedbackChoice(false),
      environmentSnippet: args.state?.grid
        ? `Grid: ${args.state.grid.rows}x${args.state.grid.cols}\nSession: ${args.sessionIdFromUrl ?? "—"}`
        : undefined,
    },
    completionProps: args.completionProps,
    replayPortalProps: args.replayPortalProps,
    board: {
      mainRef: args.mainRef,
      boardRef: args.boardRef,
      canvasRef: args.canvasRef,
      puzzleKey: args.puzzleKey,
      state: args.state,
      isComplete: args.isComplete,
      postCompletionCta: args.postCompletionCta,
      isLoading: args.isLoading,
      elapsedLabel: `Solved in ${formatTime(args.elapsedSeconds)}!`,
      movesLabel: args.moveCount === 1 ? "1 move" : `${args.moveCount} moves`,
      snapCombo: args.snapCombo,
      minimapVisible: args.minimapVisible,
      minimapSuppressed: args.minimapSuppressed ?? false,
      minimapPosition: args.minimapPosition,
      boardSize: args.boardSize,
      onCycleMinimapPosition: args.cycleMinimapPosition,
      viewport: args.viewport,
      handlers: {
        onPointerDown: args.handlePointerDown,
        onPointerMove: args.handlePointerMove,
        onPointerUp: args.handlePointerUp,
        onPointerCancel: args.handlePointerCancel,
        onLostPointerCapture: args.handleLostPointerCapture,
        onContextMenu: args.handleContextMenu,
      },
      isPaused: args.isPaused,
      onResume: () => args.setIsPaused(false),
    },
    tray: {
      show: !args.isComplete && !args.replayBarOpen,
      immersiveMode: args.immersiveMode,
      showImmersiveUi: args.showImmersiveUi,
      onPointerLeave: args.immersiveMode ? args.scheduleImmersiveHide : undefined,
      showUndoRedo: false,
      canUndo: Boolean(
        args.manager?.canUndo() && !args.isPaused && !args.state?.isComplete,
      ),
      canRedo: Boolean(
        args.manager?.canRedo() && !args.isPaused && !args.state?.isComplete,
      ),
      onUndo: args.handleUndo,
      onRedo: args.handleRedo,
      puzzleKey: args.puzzleKey,
      trayRef: args.trayRef,
      trayPieces: args.trayPieces,
      trayGrid: args.state?.grid ?? args.grid ?? { rows: 3, cols: 3 },
      onTrayPieceClick: args.handleTrayPieceClick,
      highlightedPieceIds:
        args.highlightedPieceIds.size > 0 ? args.highlightedPieceIds : undefined,
      isLargeTray: (args.state?.grid?.rows ?? 0) * (args.state?.grid?.cols ?? 0) >= 49,
    },
    overlaysProps: {
      showPreview: args.showPreview && !args.mysteryModeEnabled,
      progressiveRevealMode: args.progressiveRevealMode || args.mysteryModeEnabled,
      previewImage: args.imgRef.current,
      state: args.state,
      isComplete: args.isComplete,
      onPreviewTap: args.onPreviewTap,
      immersiveMode: args.immersiveMode,
      onImmersiveReveal: args.handleImmersiveReveal,
      showTutorial: args.showTutorial,
      showHowToPlay: args.showHowToPlay,
      dismissTutorial: args.dismissTutorial,
      setShowHowToPlay: args.setShowHowToPlay,
      showShortcuts: args.showShortcuts,
      setShowShortcuts: args.setShowShortcuts,
      manager: args.manager,
      isPaused: args.isPaused,
      dragPreviewPiece: args.dragPreviewPiece ?? null,
      dragPreview: args.dragPreview,
      onboarding: args.onboarding,
      showStreakToast: args.showStreakToast,
      milestoneMessage: args.milestoneMessage,
      announcerLine: args.announcerLine,
      shareToast: args.shareToast,
      showProfiler:
        import.meta.env.DEV ||
        args.SHOW_DEBUG ||
        args.searchParams.has("debug") ||
        args.searchParams.has("perf"),
      perfStatsRef: args.perfStatsRef,
      profilerVisible:
        args.debug.showPerfOverlay ||
        args.searchParams.has("debug") ||
        args.searchParams.has("perf"),
      sessionId: args.sessionId,
      connectedCount: args.sessionResultConnectedCount,
      lastEventTimestamp: args.lastEventTimestamp,
      lastDbWriteMs: args.lastDbWriteMs,
      channelName: args.channelName,
    },
  } as unknown as React.ComponentProps<typeof PlayScreenLayout>;
}
