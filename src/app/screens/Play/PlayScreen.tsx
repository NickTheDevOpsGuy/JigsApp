// src/app/screens/Play/PlayScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import { PieceTray } from "@/components/PieceTray/PieceTray";
import { ConfirmModal } from "@/components/Modal/Modal";
import { HowToPlayModal, useShouldShowTutorial } from "@/components/HowToPlay";
import { savePuzzleState, loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { useKeyboardShortcuts, ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";

import { clamp, formatTime } from "./playUtils";
import {
  useCoarsePointer,
  useFullscreen,
  useSoundSettings,
  useShareResults,
  usePointerHandlers,
  useHaptics,
} from "./hooks";
import {
  PlayHUD,
  CompletionOverlay,
  PauseOverlay,
  TopBarButtons,
  HeaderMenu,
} from "./components";

const STORAGE_KEY = "phuzzle:imageDataUrl";
const GRID_KEY = "phuzzle:gridSize";
const SHOW_DEBUG = import.meta.env.VITE_SHOW_DEBUG === "true";

function parseGrid(stored: string | null): { rows: number; cols: number } {
  if (!stored) return { rows: 4, cols: 4 };
  const [r, c] = stored.split("x").map(Number);
  if (r && c) return { rows: r, cols: c };
  return { rows: 4, cols: 4 };
}

type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

export function PlayScreen() {
  const navigate = useNavigate();

  // Refs
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const popMapRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);
  const boardSizeRef = useRef({ w: 900, h: 520 });
  const completedAtRef = useRef<number | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const selectedPieceIdRef = useRef<string | null>(null);
  const didDragRef = useRef(false);

  // Custom hooks
  const isCoarsePointer = useCoarsePointer();
  const [showTutorial, dismissTutorial] = useShouldShowTutorial();
  const { isFullscreen, toggleFullscreen } = useFullscreen(pageRef);
  const { soundEnabled, hapticsEnabled, toggleSound, toggleHaptics } = useSoundSettings();
  const haptics = useHaptics();

  // UI state
  const [debug, setDebug] = useState<DebugFlags>({ showGrid: false, showBounds: false, showIds: false });
  const [showPreview, setShowPreview] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

  // Game state
  const grid = useMemo(() => parseGrid(localStorage.getItem(GRID_KEY)), []);
  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Keep refs in sync
  useEffect(() => {
    selectedIdRef.current = selectedPieceId;
    selectedPieceIdRef.current = selectedPieceId;
  }, [selectedPieceId]);

  // Get selectable pieces (not in tray, not placed)
  const getSelectable = useCallback(() => {
    if (!manager) return [];
    const st = manager.getState();
    return st.pieces.filter((p) => !p.inTray && !p.isPlaced);
  }, [manager]);

  // Cycle through selectable pieces
  const selectCycle = useCallback(
    (dir: 1 | -1) => {
      if (!manager) return;
      const pieces = getSelectable().sort((a, b) => b.z - a.z);
      if (!pieces.length) {
        selectedIdRef.current = null;
        bump();
        return;
      }
      const cur = selectedIdRef.current;
      const idx = cur ? pieces.findIndex((p) => p.id === cur) : -1;
      let next: number;
      if (idx < 0) {
        next = 0;
      } else {
        next = (idx + dir + pieces.length) % pieces.length;
      }
      selectedIdRef.current = pieces[next].id;
      setSelectedPieceId(pieces[next].id);
      bump();
    },
    [manager, getSelectable],
  );

  // Compute tile size helper
  const computeTileSize = useCallback((boardW: number, boardH: number) => {
    const targetFill = 0.65;
    const tileFromW = (boardW * targetFill) / grid.cols;
    const tileFromH = (boardH * targetFill) / grid.rows;
    const tile = Math.floor(Math.min(tileFromW, tileFromH));
    return clamp(tile, 56, 160);
  }, [grid]);

  // Timer effect
  useEffect(() => {
    if (state?.isComplete || isPaused) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [state?.isComplete, isPaused]);

  // Keyboard shortcut handler
  const handleShortcut = useCallback((action: ShortcutAction) => {
    switch (action) {
      case "pause":
        if (!state?.isComplete) setIsPaused((p) => !p);
        break;
      case "escape":
        if (showShortcuts) setShowShortcuts(false);
        else if (showNewGameModal) setShowNewGameModal(false);
        else if (isPaused) setIsPaused(false);
        break;
      case "preview":
        setShowPreview((p) => !p);
        break;
      case "fullscreen":
        toggleFullscreen();
        break;
      case "newGame":
        setShowNewGameModal(true);
        break;
      case "toggleSound":
        toggleSound();
        break;
      case "toggleHaptics":
        toggleHaptics();
        break;
      case "rotateCW":
      case "rotateCCW":
        if (manager && state && !isPaused) {
          const unplaced = state.pieces.filter((p) => !p.isPlaced && !p.inTray);
          let piece = unplaced.find((p) => p.id === selectedPieceId);
          if (!piece && unplaced.length > 0) {
            piece = unplaced[0];
            setSelectedPieceId(piece.id);
          }
          if (piece) {
            manager.rotatePiece(piece.id);
            soundManager.play("rotate");
            setState(manager.getState());
          }
        }
        break;
      case "nextPiece":
        selectCycle(1);
        break;
      case "prevPiece":
        selectCycle(-1);
        break;
      case "moveUp":
      case "moveDown":
      case "moveLeft":
      case "moveRight": {
        if (manager && state && !isPaused && selectedPieceId) {
          const piece = state.pieces.find((p) => p.id === selectedPieceId);
          if (piece && !piece.isPlaced && !piece.inTray) {
            const amt = 20;
            const dx = action === "moveLeft" ? -amt : action === "moveRight" ? amt : 0;
            const dy = action === "moveUp" ? -amt : action === "moveDown" ? amt : 0;
            manager.nudgeGroup(selectedPieceId, dx, dy);
            manager.snapGroupNow(selectedPieceId);
            setState(manager.getState());
          }
        }
        break;
      }
      case "showHelp":
        setShowShortcuts((s) => !s);
        break;
    }
  }, [state, isPaused, showShortcuts, showNewGameModal, manager, toggleFullscreen, selectedPieceId, toggleSound, toggleHaptics, selectCycle]);

  useKeyboardShortcuts({ enabled: !showTutorial, onAction: handleShortcut });

  // Initialize puzzle manager
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const boardW = Math.max(320, Math.floor(rect.width));
    const boardH = Math.max(240, Math.floor(rect.height));
    boardSizeRef.current = { w: boardW, h: boardH };

    const pieceSize = computeTileSize(boardW, boardH);
    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";

    const savedState = loadPuzzleState();
    const hasSaved = savedState?.imageUrl === imageUrl &&
                     savedState?.grid.rows === grid.rows &&
                     savedState?.grid.cols === grid.cols;

    if (hasSaved && savedState) {
      setElapsedSeconds(savedState.elapsedSeconds);
    } else {
      setElapsedSeconds(0);
    }

    const mgr = new PuzzleManager(
      { imageUrl, boardWidth: boardW, boardHeight: boardH, grid, pieceWidth: pieceSize, pieceHeight: pieceSize },
      {
        onPiecePlaced: (p) => {
          popMapRef.current.set(p.id, performance.now());
          soundManager.play("place");
        },
        onPieceSnapped: () => soundManager.play("snap"),
        onPuzzleComplete: () => {
          clearPuzzleState();
          soundManager.play("complete");
          import("canvas-confetti").then((c) => c.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } }));
        },
      },
    );

    if (hasSaved && savedState) {
      mgr.restoreFromSaved(savedState.pieces);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setManager(mgr);
      setState(mgr.getState());
    };
    img.onerror = () => console.error("Failed to load puzzle image");
    img.src = imageUrl;
  }, [grid, computeTileSize]);

  // Auto-save
  useEffect(() => {
    if (!state || state.isComplete) return;
    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";
    savePuzzleState(imageUrl, state.grid, state.pieces, elapsedSeconds);
  }, [state, elapsedSeconds]);

  // Animation/render loop
  useEffect(() => {
    if (!manager) return;

    const tick = () => {
      const canvas = canvasRef.current;
      const boardEl = boardRef.current;
      const img = imgRef.current;
      if (!canvas || !boardEl || !img) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const { w, h } = boardSizeRef.current;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const st = manager.getState();
      const assembledW = grid.cols * (st.pieces[0]?.tileW ?? 80);
      const assembledH = grid.rows * (st.pieces[0]?.tileH ?? 80);

      if (st.isComplete && !completedAtRef.current) {
        completedAtRef.current = performance.now();
      } else if (!st.isComplete) {
        completedAtRef.current = null;
      }

      const dragState = manager.getDragState();
      const draggedGroupId = dragState.activeId
        ? (st.pieces.find((p) => p.id === dragState.activeId)?.groupId ?? null)
        : null;

      renderBoard(
        ctx,
        st,
        img,
        assembledW,
        assembledH,
        popMapRef.current,
        performance.now(),
        debug,
        dragState,
        {
          draggedGroupId,
          hoveredPieceId: selectedIdRef.current,
          selectedPieceId: selectedPieceIdRef.current,
          isComplete: st.isComplete,
          completedAtMs: completedAtRef.current,
        },
      );

      setState(st);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [manager, debug, grid]);

  // Load image from localStorage
  useEffect(() => {
    const dataUrl = localStorage.getItem(STORAGE_KEY);
    if (!dataUrl) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      imgRef.current = img;
    };
  }, []);

  // Pointer handlers
  const { handlePointerDown, handlePointerMove, handlePointerUp, handleContextMenu } =
    usePointerHandlers({
      manager,
      canvasRef,
      boardRef,
      setState,
      selectCycle,
      setSelectedPieceId,
      selectedIdRef,
      bump,
      didDragRef,
      haptic: haptics.vibrate,
    });

  // Tray piece click
  const handleTrayPieceClick = useCallback((pieceId: string) => {
    if (!manager) return;
    manager.movePieceFromTray(pieceId);
    setState(manager.getState());
    selectedIdRef.current = pieceId;
    setSelectedPieceId(pieceId);
    bump();
  }, [manager]);

  // New game handler
  const handleNewGame = useCallback(() => {
    clearPuzzleState();
    navigate("/new");
  }, [navigate]);

  // Share results
  const share = useShareResults({ elapsedSeconds, state });

  // Download completion image
  const handleDownloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const shareCanvas = document.createElement("canvas");
    const padding = 40;
    const textHeight = 80;
    shareCanvas.width = canvas.width + padding * 2;
    shareCanvas.height = canvas.height + padding * 2 + textHeight;

    const ctx = shareCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";

    const timeStr = formatTime(elapsedSeconds);
    const pieceCount = state?.totalCount ?? 0;
    ctx.fillText(
      `🧩 Phuzzle - ${pieceCount} pieces in ${timeStr}`,
      shareCanvas.width / 2,
      shareCanvas.height - textHeight / 2 + 10,
    );

    const link = document.createElement("a");
    link.download = `phuzzle-${timeStr.replace(":", "m")}s.png`;
    link.href = shareCanvas.toDataURL("image/png");
    link.click();
  }, [elapsedSeconds, state?.totalCount]);

  // Derived values
  const trayPieces = useMemo(() => state?.pieces.filter((p) => p.inTray) ?? [], [state]);
  const left = Math.max(0, (state?.totalCount ?? 0) - (state?.placedCount ?? 0));
  const isComplete = state?.isComplete ?? false;
  const canNativeShare = share.canNativeShare;

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <HeaderMenu
            title="Phuzzle"
            showPreview={showPreview}
            soundEnabled={soundEnabled}
            hapticsEnabled={hapticsEnabled}
            isFullscreen={isFullscreen}
            canShowHaptics={isCoarsePointer && typeof navigator?.vibrate === "function"}
            canShowFullscreen={!!document.fullscreenEnabled}
            canShowShortcuts={!isCoarsePointer}
            canShowDebug={SHOW_DEBUG}
            debug={debug}
            onNewPuzzle={() => setShowNewGameModal(true)}
            onTogglePreview={() => setShowPreview((p) => !p)}
            onToggleSound={toggleSound}
            onToggleHaptics={toggleHaptics}
            onToggleFullscreen={toggleFullscreen}
            onShowShortcuts={() => setShowShortcuts(true)}
            onToggleDebug={() => setDebug((d) => ({ ...d, showGrid: !d.showGrid, showBounds: !d.showBounds, showIds: !d.showIds }))}
          />
          <div className={styles.title}>Phuzzle</div>
        </div>

        <div className={styles.topBarCenter}>
          <PlayHUD
            elapsedSeconds={elapsedSeconds}
            piecesLeft={left}
            isPaused={isPaused}
            isComplete={isComplete}
            onTogglePause={() => setIsPaused((p) => !p)}
          />
        </div>

        <TopBarButtons
          showPreview={showPreview}
          soundEnabled={soundEnabled}
          isFullscreen={isFullscreen}
          showDebug={SHOW_DEBUG}
          isCoarsePointer={isCoarsePointer}
          onTogglePreview={() => setShowPreview((p) => !p)}
          onToggleSound={toggleSound}
          onToggleFullscreen={toggleFullscreen}
          onShowShortcuts={() => setShowShortcuts(true)}
          onToggleDebug={() => setDebug((d) => ({ ...d, showGrid: !d.showGrid, showBounds: !d.showBounds, showIds: !d.showIds }))}
          onNewPuzzle={() => setShowNewGameModal(true)}
        />
      </div>

      <ConfirmModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onConfirm={handleNewGame}
        title="Start New Puzzle?"
        message="Your current progress will be lost. Are you sure you want to start a new puzzle?"
        confirmText="New Puzzle"
        cancelText="Keep Playing"
        variant="danger"
      />

      <div className={styles.main}>
        <div className={styles.board} ref={boardRef}>
          <canvas
            className={styles.canvas}
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={handleContextMenu}
          />

          {showPreview && imgRef.current && (
            <div className={styles.previewOverlay}>
              <img src={imgRef.current.src} alt="Puzzle preview" className={styles.previewImage} />
            </div>
          )}

          {isPaused && <PauseOverlay onResume={() => setIsPaused(false)} />}

          {isComplete && (
            <CompletionOverlay
              elapsedSeconds={elapsedSeconds}
              shareUrls={share.shareUrls}
              copied={share.copied}
              canNativeShare={canNativeShare}
              onOpenShareWindow={share.openShareWindow}
              onCopyResults={share.handleCopyResults}
              onNativeShare={share.handleNativeShare}
              onDownloadImage={handleDownloadImage}
              onNewPuzzle={handleNewGame}
              onMenu={() => navigate("/")}
            />
          )}
        </div>
      </div>

      <PieceTray
        pieces={trayPieces}
        image={imgRef.current}
        grid={state?.grid ?? grid}
        onPieceClick={handleTrayPieceClick}
        isCoarsePointer={isCoarsePointer}
      />

      {showTutorial && <HowToPlayModal isOpen={showTutorial} onClose={dismissTutorial} />}

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

export default PlayScreen;
