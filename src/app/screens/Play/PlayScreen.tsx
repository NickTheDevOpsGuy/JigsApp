import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import { PieceTray } from "@/components/PieceTray/PieceTray";
import { ConfirmModal } from "@/components/Modal/Modal";
import { TutorialOverlay, useShouldShowTutorial } from "@/components/HowToPlay";
import {
  savePuzzleState,
  loadPuzzleState,
  clearPuzzleState,
} from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { useKeyboardShortcuts, ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";

import { clamp, formatTime, isTypingTarget } from "./playUtils";
import { useShareResults } from "./hooks/useShareResults";
import { usePointerHandlers } from "./hooks/usePointerHandlers";
import { useHaptics } from "./hooks/useHaptics";
import { useCoarsePointer } from "./hooks/useCoarsePointer";
import {
  PlayHUD,
  CompletionOverlay,
  PauseOverlay,
  TopBarButtons,
  HeaderMenu,
} from "./components";

const STORAGE_KEY = "phuzzle:imageDataUrl";
const GRID_KEY = "phuzzle:gridSize";
const PIECE_LOCKING_KEY = "phuzzle:pieceLocking";
const GHOST_HINT_KEY = "phuzzle:ghostHint";

// Debug mode from environment variable
const SHOW_DEBUG = import.meta.env.VITE_SHOW_DEBUG === "true";

function parseGrid(stored: string | null): { rows: number; cols: number } {
  if (!stored) return { rows: 4, cols: 4 }; // default
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
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const popMapRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);

  // Detect touch/coarse pointer devices
  const isCoarsePointer = useCoarsePointer();

  // Tutorial for first-time users
  const [showTutorial, dismissTutorial] = useShouldShowTutorial();

  const [debug, setDebug] = useState<DebugFlags>({
    showGrid: false,
    showBounds: false,
    showIds: false,
  });

  // Preview image visibility
  const [showPreview, setShowPreview] = useState(false);

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  // Haptics toggle
  const [hapticsEnabled, setHapticsEnabled] = useState(soundManager.isHapticsEnabled());

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);

  // Shortcuts help modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Piece locking: when enabled, snapped pieces become locked (cannot be moved)
  const [pieceLockingEnabled, setPieceLockingEnabled] = useState(() => {
    try {
      return localStorage.getItem(PIECE_LOCKING_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Ghost hint: show semi-transparent preview of where pieces belong
  const [showGhostHint, setShowGhostHint] = useState(() => {
    try {
      return localStorage.getItem(GHOST_HINT_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Modal state for new game confirmation
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  // Currently selected piece for keyboard controls
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const selectedPieceIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedPieceIdRef.current = selectedPieceId;
  }, [selectedPieceId]);

  // Track completion time for animation
  const completedAtRef = useRef<number | null>(null);

  // Selection for keyboard controls
  const selectedIdRef = useRef<string | null>(null);
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

  // Track for tap-to-rotate (did we actually drag or just tap?)
  const didDragRef = useRef(false);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      pageRef.current?.requestFullscreen?.().catch((err) => {
        console.warn("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Grid from localStorage
  const grid = useMemo(() => parseGrid(localStorage.getItem(GRID_KEY)), []);

  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track board size in CSS pixels
  const boardSizeRef = useRef({ w: 900, h: 520 });

  // Helper: compute a tile size that makes the assembled puzzle fill the board nicely
  function computeTileSize(boardW: number, boardH: number) {
    // make the assembled puzzle about ~65% of board's smaller dimension
    const targetFill = 0.65;

    const tileFromW = (boardW * targetFill) / grid.cols;
    const tileFromH = (boardH * targetFill) / grid.rows;

    // Use the limiting axis so it fits both dimensions
    const tile = Math.floor(Math.min(tileFromW, tileFromH));

    // Clamp so it doesn't get ridiculous on tiny/huge screens
    return clamp(tile, 56, 160);
  }

  // Timer effect - stops when complete or paused
  useEffect(() => {
    if (state?.isComplete) return; // Don't run timer if complete
    if (isPaused) return; // Don't run timer if paused

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.isComplete, isPaused]);

  // Keyboard shortcuts handler
  const handleShortcut = useCallback(
    (action: ShortcutAction) => {
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
        case "toggleGhostHint":
          setShowGhostHint((g) => !g);
          break;
        case "fullscreen":
          toggleFullscreen();
          break;
        case "newGame":
          setShowNewGameModal(true);
          break;
        case "toggleSound": {
          const newSoundEnabled = !soundManager.isEnabled();
          soundManager.setEnabled(newSoundEnabled);
          setSoundEnabled(newSoundEnabled);
          break;
        }
        case "toggleHaptics": {
          const newHapticsEnabled = !soundManager.isHapticsEnabled();
          soundManager.setHapticsEnabled(newHapticsEnabled);
          setHapticsEnabled(newHapticsEnabled);
          if (newHapticsEnabled && navigator.vibrate) {
            navigator.vibrate(25);
          }
          break;
        }
        case "rotateCW":
        case "rotateCCW":
          // Rotate the selected piece (or first movable if none selected)
          if (manager && state && !isPaused) {
            const movablePieces = state.pieces.filter(
              (p) => !p.isPlaced && !p.inTray && !p.locked,
            );
            let pieceToRotate = movablePieces.find((p) => p.id === selectedPieceId);

            // If selected piece is placed/locked or not found, use first movable
            if (!pieceToRotate && movablePieces.length > 0) {
              pieceToRotate = movablePieces[0];
              setSelectedPieceId(pieceToRotate.id);
            }

            if (pieceToRotate) {
              manager.rotatePiece(pieceToRotate.id);
              soundManager.play("rotate");
              setState(manager.getState());
            }
          }
          break;
        case "nextPiece":
        case "prevPiece": {
          // Tab through movable pieces (not placed, not in tray, not locked)
          if (state && !isPaused) {
            const movablePieces = state.pieces.filter(
              (p) => !p.isPlaced && !p.inTray && !p.locked,
            );
            if (movablePieces.length === 0) break;

            const currentIndex = movablePieces.findIndex((p) => p.id === selectedPieceId);
            let newIndex: number;

            if (action === "nextPiece") {
              newIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % movablePieces.length;
            } else {
              newIndex =
                currentIndex < 0
                  ? movablePieces.length - 1
                  : (currentIndex - 1 + movablePieces.length) % movablePieces.length;
            }

            setSelectedPieceId(movablePieces[newIndex].id);
          }
          break;
        }
        case "moveUp":
        case "moveDown":
        case "moveLeft":
        case "moveRight": {
          // Move selected piece with arrow keys
          if (manager && state && !isPaused && selectedPieceId) {
            const piece = state.pieces.find((p) => p.id === selectedPieceId);
            if (piece && !piece.isPlaced && !piece.inTray && !piece.locked) {
              const moveAmount = 20; // pixels per keypress
              let dx = 0,
                dy = 0;

              if (action === "moveUp") dy = -moveAmount;
              else if (action === "moveDown") dy = moveAmount;
              else if (action === "moveLeft") dx = -moveAmount;
              else if (action === "moveRight") dx = moveAmount;

              manager.nudgeGroup(selectedPieceId, dx, dy);
              manager.snapGroupNow(selectedPieceId, true); // skipPush - nudgeGroup already pushed
              setState(manager.getState());
            }
          }
          break;
        }
        case "undo":
          if (manager && manager.canUndo() && !isPaused && !state?.isComplete) {
            manager.undo();
            setState(manager.getState());
          }
          break;
        case "showHelp":
          setShowShortcuts((s) => !s);
          break;
      }
    },
    [
      state,
      isPaused,
      showShortcuts,
      showNewGameModal,
      manager,
      toggleFullscreen,
      selectedPieceId,
    ],
  );

  useKeyboardShortcuts({
    enabled: !showTutorial,
    onAction: handleShortcut,
  });

  // Initial setup: create manager once we know board size
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const boardW = Math.max(320, Math.floor(rect.width));
    const boardH = Math.max(240, Math.floor(rect.height));
    boardSizeRef.current = { w: boardW, h: boardH };

    const pieceSize = computeTileSize(boardW, boardH);
    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";

    // Check for saved game state
    const savedState = loadPuzzleState();
    const hasSavedGame =
      savedState &&
      savedState.imageUrl === imageUrl &&
      savedState.grid.rows === grid.rows &&
      savedState.grid.cols === grid.cols;

    // Restore elapsed time if we have a saved game
    if (hasSavedGame && savedState) {
      setElapsedSeconds(savedState.elapsedSeconds);
    } else {
      setElapsedSeconds(0);
    }

    const next = new PuzzleManager(
      {
        imageUrl,
        boardWidth: boardW,
        boardHeight: boardH,
        grid,
        pieceWidth: pieceSize,
        pieceHeight: pieceSize,
      },
      {
        onPiecePlaced: (p) => {
          popMapRef.current.set(p.id, performance.now());
          soundManager.play("place");
        },
        onPieceSnapped: () => {
          soundManager.play("snap");
        },
        onPuzzleComplete: () => {
          clearPuzzleState();
          soundManager.play("complete");

          import("canvas-confetti").then((confetti) => {
            confetti.default({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
            });
          });
        },
      },
    );

    // Restore piece positions if we have a saved game
    if (hasSavedGame && savedState) {
      next.restoreFromSaved(savedState.pieces);
    }

    next.setPieceLockingEnabled(pieceLockingEnabled);
    setManager(next);
    const st = next.getState();
    setState(st);

    // Set an initial selection if possible (prefer movable pieces)
    const selectable = st.pieces.filter((p) => !p.inTray && !p.isPlaced && !p.locked);
    selectedIdRef.current = selectable.length ? selectable[0].id : null;
    bump();
  }, [grid]);

  // Sync piece locking to manager when it changes (manager may be recreated with grid)
  useEffect(() => {
    manager?.setPieceLockingEnabled(pieceLockingEnabled);
  }, [manager, pieceLockingEnabled]);

  // Persist piece locking preference
  useEffect(() => {
    try {
      localStorage.setItem(PIECE_LOCKING_KEY, pieceLockingEnabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, [pieceLockingEnabled]);

  // Persist ghost hint preference
  useEffect(() => {
    try {
      localStorage.setItem(GHOST_HINT_KEY, showGhostHint ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showGhostHint]);

  // Auto-save puzzle state when pieces change (debounced)
  useEffect(() => {
    if (!state || state.isComplete) return;

    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";
    if (!imageUrl) return;

    const timeoutId = setTimeout(() => {
      savePuzzleState(imageUrl, state.grid, state.pieces, elapsedSeconds);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state, elapsedSeconds]);

  // Resize observer: keep canvas + manager board size synced
  useEffect(() => {
    const el = boardRef.current;
    if (!el || !manager) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const boardW = Math.max(320, Math.floor(rect.width));
      const boardH = Math.max(240, Math.floor(rect.height));
      boardSizeRef.current = { w: boardW, h: boardH };

      manager.setBoardSize(boardW, boardH);
      setState(manager.getState());
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [manager]);

  // Keyboard controls
  const getSelectable = useCallback(() => {
    if (!manager) return [];
    const st = manager.getState();
    return st.pieces.filter((p) => !p.inTray && !p.isPlaced);
  }, [manager]);

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
      const next = pieces[(idx + dir + pieces.length) % pieces.length];
      selectedIdRef.current = next.id;
      bump();
    },
    [getSelectable, manager],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!manager || !state) return;
      if (isTypingTarget(e.target)) return;

      // If a modal is open, let it handle keys
      // (basic guard: if we show the new game modal it will capture focus anyway)
      const isComplete = state.isComplete;

      // Universal keys
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (!isComplete) setIsPaused((p) => !p);
        return;
      }

      if (e.key === "Escape") {
        if (showPreview) setShowPreview(false);
        if (isPaused) setIsPaused(false);
        return;
      }

      // Stop here if puzzle is complete or paused
      if (isComplete) return;
      if (isPaused) return;

      // Tab cycle selection
      if (e.key === "Tab") {
        e.preventDefault();
        selectCycle(e.shiftKey ? -1 : 1);
        return;
      }

      // Global toggles
      if (e.key.toLowerCase() === "p") {
        setShowPreview((p) => !p);
        return;
      }
      if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
        return;
      }

      const id = selectedIdRef.current;
      if (!id) return;

      const step = e.altKey || e.ctrlKey ? 25 : e.shiftKey ? 10 : 1;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        manager.nudgeGroup(id, -step, 0);
        manager.snapGroupNow(id, true); // skipPush - nudgeGroup already pushed
        setState(manager.getState());
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        manager.nudgeGroup(id, step, 0);
        manager.snapGroupNow(id, true);
        setState(manager.getState());
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        manager.nudgeGroup(id, 0, -step);
        manager.snapGroupNow(id, true);
        setState(manager.getState());
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        manager.nudgeGroup(id, 0, step);
        manager.snapGroupNow(id, true);
        setState(manager.getState());
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        manager.snapGroupNow(id); // push - Enter alone is a distinct action
        setState(manager.getState());
        return;
      }

      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        manager.rotateGroup(id);
        soundManager.play("rotate");
        setState(manager.getState());
        return;
      }

      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        manager.sendToTray(id);
        setState(manager.getState());
        // pick next selection after tray
        selectCycle(1);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [manager, state, isPaused, showPreview, selectCycle, toggleFullscreen]);

  // Animation loop: draw canvas
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

      const rect = boardEl.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      // Size backing store
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Draw everything in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const st = manager.getState();

      const firstPiece = st.pieces[0];
      if (!firstPiece) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const assembledW = st.grid.cols * firstPiece.tileW;
      const assembledH = st.grid.rows * firstPiece.tileH;

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
          showGhostHint,
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
  }, [manager, debug]);

  // Load image from localStorage
  useEffect(() => {
    const dataUrl = localStorage.getItem(STORAGE_KEY);
    if (!dataUrl) {
      console.warn("No image in localStorage");
      return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      imgRef.current = img;
    };
  }, []);

  // ========== POINTER EVENT HANDLERS ==========

  const haptics = useHaptics();

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

  // Handle clicking a piece in the tray to bring it back to board
  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      manager.movePieceFromTray(pieceId);
      setState(manager.getState());
      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
    },
    [manager],
  );

  // Handle starting a new game (clears saved state and navigates to setup)
  const handleNewGame = useCallback(() => {
    clearPuzzleState();
    navigate("/new");
  }, [navigate]);

  const share = useShareResults({ elapsedSeconds, state });

  // Download completion image
  const handleDownloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Create a new canvas for the share image
    const shareCanvas = document.createElement("canvas");
    const padding = 40;
    const textHeight = 80;
    shareCanvas.width = canvas.width + padding * 2;
    shareCanvas.height = canvas.height + padding * 2 + textHeight;

    const ctx = shareCanvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);

    // Draw the puzzle
    ctx.drawImage(canvas, padding, padding);

    // Add text at bottom
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

    // Download
    const link = document.createElement("a");
    link.download = `phuzzle-${timeStr.replace(":", "m")}s.png`;
    link.href = shareCanvas.toDataURL("image/png");
    link.click();
  }, [elapsedSeconds, state?.totalCount]);

  // Check if native share is available
  const canNativeShare = share.canNativeShare;

  // Tray pieces (PieceTray handles sorting and sectioning)
  const trayPieces = useMemo(() => {
    if (!state) return [];
    return state.pieces.filter((p) => p.inTray);
  }, [state]);

  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <HeaderMenu
            title="Phuzzle"
            canUndo={!!(manager?.canUndo() && !isPaused && !state?.isComplete)}
            onUndo={() => {
              if (manager?.canUndo()) {
                manager.undo();
                setState(manager.getState());
              }
            }}
            showPreview={showPreview}
            soundEnabled={soundEnabled}
            hapticsEnabled={hapticsEnabled}
            pieceLockingEnabled={pieceLockingEnabled}
            showGhostHint={showGhostHint}
            isFullscreen={isFullscreen}
            canShowHaptics={
              isCoarsePointer &&
              typeof navigator !== "undefined" &&
              typeof navigator.vibrate === "function"
            }
            canShowFullscreen={!!document.fullscreenEnabled}
            canShowShortcuts={!isCoarsePointer}
            canShowDebug={SHOW_DEBUG}
            debug={debug}
            onNewPuzzle={() => setShowNewGameModal(true)}
            onTogglePreview={() => setShowPreview((p) => !p)}
            onToggleSound={() => {
              const newEnabled = !soundManager.isEnabled();
              soundManager.setEnabled(newEnabled);
              setSoundEnabled(newEnabled);
            }}
            onToggleHaptics={() => {
              const newEnabled = !soundManager.isHapticsEnabled();
              soundManager.setHapticsEnabled(newEnabled);
              setHapticsEnabled(newEnabled);
              if (newEnabled && navigator.vibrate) {
                navigator.vibrate(25);
              }
            }}
            onTogglePieceLocking={() => setPieceLockingEnabled((p) => !p)}
            onToggleGhostHint={() => setShowGhostHint((g) => !g)}
            onToggleFullscreen={toggleFullscreen}
            onShowShortcuts={() => setShowShortcuts(true)}
            onToggleDebug={() =>
              setDebug((d) => ({
                ...d,
                showGrid: !d.showGrid,
                showBounds: !d.showBounds,
                showIds: !d.showIds,
              }))
            }
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
          onToggleSound={() => {
            const newEnabled = !soundManager.isEnabled();
            soundManager.setEnabled(newEnabled);
            setSoundEnabled(newEnabled);
          }}
          onToggleFullscreen={toggleFullscreen}
          onShowShortcuts={() => setShowShortcuts(true)}
          onToggleDebug={() =>
            setDebug((d) => ({
              ...d,
              showGrid: !d.showGrid,
              showBounds: !d.showBounds,
              showIds: !d.showIds,
            }))
          }
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
              <img
                src={imgRef.current.src}
                alt="Puzzle preview"
                className={styles.previewImage}
              />
            </div>
          )}

          {/* Pause overlay */}
          {isPaused && <PauseOverlay onResume={() => setIsPaused(false)} />}

          {/* Completion overlay */}
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

      <TutorialOverlay isOpen={showTutorial} onComplete={dismissTutorial} showSkipLink />

      {/* Keyboard shortcuts modal */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

export default PlayScreen;
