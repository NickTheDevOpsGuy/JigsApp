import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { PieceTray } from "@/components/PieceTray/PieceTray";
import { Button } from "@/components/Button/Button";
import { ConfirmModal } from "@/components/Modal/Modal";
import { TutorialOverlay, useShouldShowTutorial } from "@/components/HowToPlay";
import { getAverageColor } from "@/puzzle/colorUtils";
import {
  savePuzzleState,
  loadPuzzleState,
  clearPuzzleState,
} from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import {
  Menu,
  Eye,
  EyeOff,
  Plus,
  Clock,
  Puzzle,
  Bug,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Smartphone,
  VolumeOff,
  Pause,
  Play,
} from "lucide-react";

const STORAGE_KEY = "phuzzle:imageDataUrl";
const GRID_KEY = "phuzzle:gridSize";

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

export function PlayScreen() {
  const navigate = useNavigate();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const popMapRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);

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

  // Track completion time for animation
  const completedAtRef = useRef<number | null>(null);

  // Selection for keyboard controls
  const selectedIdRef = useRef<string | null>(null);
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

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

    setManager(next);
    const st = next.getState();
    setState(st);

    // Set an initial selection if possible
    const selectable = st.pieces.filter((p) => !p.inTray && !p.isPlaced);
    selectedIdRef.current = selectable.length ? selectable[0].id : null;
    bump();
  }, [grid]);

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
        setState(manager.getState());
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        manager.nudgeGroup(id, step, 0);
        setState(manager.getState());
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        manager.nudgeGroup(id, 0, -step);
        setState(manager.getState());
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        manager.nudgeGroup(id, 0, step);
        setState(manager.getState());
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        manager.snapGroupNow(id);
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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Reset transform to identity for hit testing in CSS pixel space
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);

      const pieceId = pickPieceId(ctx, boardPieces, cssX, cssY);
      if (!pieceId) return;

      // Always select what we clicked
      selectedIdRef.current = pieceId;
      bump();

      // Middle click (button 1) = send to tray
      if (e.button === 1) {
        e.preventDefault();
        manager.movePieceToTray(pieceId);
        setState(manager.getState());
        // Advance selection
        selectCycle(1);
        return;
      }

      // Touch or left click = start drag
      const isTouch = e.pointerType === "touch";
      const isLeftClick = e.button === 0;

      if (isTouch || isLeftClick) {
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (!piece) return;

        e.preventDefault();

        const pieceRect = new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        );

        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        setState(manager.getState());

        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        // Long-press timer for mobile (send to tray)
        if (isTouch) {
          const longPressTimer = setTimeout(() => {
            manager.pointerUp();
            manager.movePieceToTray(pieceId);
            setState(manager.getState());
            try {
              canvas.releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }, 500);

          (
            canvas as HTMLCanvasElement & {
              longPressTimer?: ReturnType<typeof setTimeout>;
            }
          ).longPressTimer = longPressTimer;
        }
      }

      // Right click = rotate (desktop)
      if (e.button === 2) {
        e.preventDefault();
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (piece?.isPlaced) return;
        manager.rotatePiece(pieceId);
        soundManager.play("rotate");
        setState(manager.getState());
      }
    },
    [manager, selectCycle],
  );

  // Track for double-tap to rotate
  const lastTapRef = useRef<{ time: number; pieceId: string | null }>({
    time: 0,
    pieceId: null,
  });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current) return;

      // Cancel long-press on move
      const canvas = e.currentTarget;
      const timer = (
        canvas as HTMLCanvasElement & { longPressTimer?: ReturnType<typeof setTimeout> }
      ).longPressTimer;
      if (timer) {
        clearTimeout(timer);
        (
          canvas as HTMLCanvasElement & { longPressTimer?: ReturnType<typeof setTimeout> }
        ).longPressTimer = undefined;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
    },
    [manager],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      const canvas = canvasRef.current;

      // Cancel long-press timer
      const timer = (
        canvas as HTMLCanvasElement & { longPressTimer?: ReturnType<typeof setTimeout> }
      ).longPressTimer;
      if (timer) {
        clearTimeout(timer);
        (
          canvas as HTMLCanvasElement & { longPressTimer?: ReturnType<typeof setTimeout> }
        ).longPressTimer = undefined;
      }

      // Check for double-tap to rotate (mobile)
      const isTouch = e.pointerType === "touch";
      const now = Date.now();
      const boardRect = boardRef.current?.getBoundingClientRect();
      const ctx = canvas.getContext("2d");

      if (isTouch && boardRect && ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const st = manager.getState();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        const pieceId = pickPieceId(ctx, st.pieces, x, y);

        if (
          pieceId &&
          lastTapRef.current.pieceId === pieceId &&
          now - lastTapRef.current.time < 300
        ) {
          const piece = st.pieces.find((p) => p.id === pieceId);
          if (!piece?.isPlaced) {
            manager.rotatePiece(pieceId);
            soundManager.play("rotate");
          }
          lastTapRef.current = { time: 0, pieceId: null };
        } else {
          lastTapRef.current = { time: now, pieceId };
        }
      }

      manager.pointerUp();
      setState(manager.getState());

      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [manager],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle clicking a piece in the tray to bring it back to board
  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      manager.movePieceFromTray(pieceId);
      setState(manager.getState());
      selectedIdRef.current = pieceId;
      bump();
    },
    [manager],
  );

  // Modal state for new game confirmation
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  // Handle starting a new game (clears saved state and navigates to setup)
  const handleNewGame = useCallback(() => {
    clearPuzzleState();
    navigate("/new");
  }, [navigate]);

  // Get tray pieces sorted by color
  const trayPieces = useMemo(() => {
    if (!state || !imgRef.current) return [];

    const inTray = state.pieces.filter((p) => p.inTray);
    if (inTray.length === 0) return [];

    const img = imgRef.current;

    return [...inTray].sort((a, b) => {
      const colorA = getAverageColor(img, a, state.grid);
      const colorB = getAverageColor(img, b, state.grid);
      return colorA.hue - colorB.hue;
    });
  }, [state]);

  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Button size="sm" onClick={() => navigate("/")}>
            <Menu size={16} />
            <span className={styles.btnText}>Menu</span>
          </Button>
          <div className={styles.title}>Phuzzle</div>
        </div>

        <div className={styles.topBarCenter}>
          <div className={styles.hud}>
            <div className={styles.hudPillTimer}>
              <Clock size={14} />
              <span className={styles.timerText}>{formatTime(elapsedSeconds)}</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsPaused((p) => !p)}
              disabled={isComplete}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </Button>
            <div className={styles.hudPill}>
              <Puzzle size={14} />
              <span>{left} left</span>
            </div>
          </div>
        </div>

        <div className={styles.topBarRight}>
          <Button size="sm" onClick={() => setShowPreview((p) => !p)}>
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className={styles.btnText}>{showPreview ? "Hide" : "Preview"}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const newEnabled = !soundManager.isEnabled();
              soundManager.setEnabled(newEnabled);
              setSoundEnabled(newEnabled);
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const newEnabled = !soundManager.isHapticsEnabled();
              soundManager.setHapticsEnabled(newEnabled);
              setHapticsEnabled(newEnabled);
              if (newEnabled && navigator.vibrate) {
                navigator.vibrate(25);
              }
            }}
          >
            {hapticsEnabled ? <Smartphone size={16} /> : <VolumeOff size={16} />}
          </Button>
          <Button size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
          {SHOW_DEBUG && (
            <Button
              size="sm"
              onClick={() =>
                setDebug((d) => ({
                  ...d,
                  showGrid: !d.showGrid,
                  showBounds: !d.showBounds,
                  showIds: !d.showIds,
                }))
              }
            >
              <Bug size={16} />
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={() => setShowNewGameModal(true)}>
            <Plus size={16} />
            <span className={styles.btnText}>New Puzzle</span>
          </Button>
        </div>
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
          {isPaused && (
            <div className={styles.pauseOverlay} onClick={() => setIsPaused(false)}>
              <div className={styles.pauseContent}>
                <Pause size={64} />
                <h2>Paused</h2>
                <p>Click anywhere or press the Resume button to continue</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <PieceTray
        pieces={trayPieces}
        image={imgRef.current}
        grid={state?.grid ?? grid}
        onPieceClick={handleTrayPieceClick}
      />

      {showTutorial && <TutorialOverlay onComplete={dismissTutorial} />}
    </div>
  );
}

export default PlayScreen;
