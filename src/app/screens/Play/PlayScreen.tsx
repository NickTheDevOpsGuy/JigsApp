// src/app/screens/Play/PlayScreen.tsx
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
  Keyboard,
} from "lucide-react";
import { useKeyboardShortcuts, ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";

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

  // Shortcuts help modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Track completion time for animation
  const completedAtRef = useRef<number | null>(null);

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
        case "fullscreen":
          toggleFullscreen();
          break;
        case "newGame":
          setShowNewGameModal(true);
          break;
        case "toggleSound":
          const newSoundEnabled = !soundManager.isEnabled();
          soundManager.setEnabled(newSoundEnabled);
          setSoundEnabled(newSoundEnabled);
          break;
        case "toggleHaptics":
          const newHapticsEnabled = !soundManager.isHapticsEnabled();
          soundManager.setHapticsEnabled(newHapticsEnabled);
          setHapticsEnabled(newHapticsEnabled);
          if (newHapticsEnabled && navigator.vibrate) {
            navigator.vibrate(25);
          }
          break;
        case "rotateCW":
        case "rotateCCW":
          // Rotate the last active piece or first unplaced piece
          if (manager && state && !isPaused) {
            const unplacedPiece = state.pieces.find((p) => !p.isPlaced);
            if (unplacedPiece) {
              manager.rotatePiece(unplacedPiece.id);
              soundManager.play("rotate");
              setState(manager.getState());
            }
          }
          break;
        case "showHelp":
          setShowShortcuts((s) => !s);
          break;
      }
    },
    [state, isPaused, showShortcuts, showNewGameModal, manager, toggleFullscreen],
  );

  useKeyboardShortcuts({
    enabled: !showTutorial,
    onAction: handleShortcut,
  });

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
          // Clear saved state on completion
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
    setState(next.getState());
  }, [grid]);

  // Auto-save puzzle state when pieces change (debounced)
  useEffect(() => {
    if (!state || state.isComplete) return;

    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";
    if (!imageUrl) return;

    // Debounce saves to avoid excessive writes
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

      // Keep manager board size in CSS pixels
      manager.setBoardSize(boardW, boardH);
      setState(manager.getState());
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [manager]);

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

      // assembled dims are puzzle-space, based on tile sizes
      const firstPiece = st.pieces[0];
      if (!firstPiece) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const assembledW = st.grid.cols * firstPiece.tileW;
      const assembledH = st.grid.rows * firstPiece.tileH;

      // Track completion time for glow animation
      if (st.isComplete && !completedAtRef.current) {
        completedAtRef.current = performance.now();
      } else if (!st.isComplete) {
        completedAtRef.current = null;
      }

      renderBoard(
        ctx,
        st,
        img,
        assembledW,
        assembledH,
        popMapRef.current,
        performance.now(),
        debug,
        manager.getDragState(),
        {
          draggedGroupId: null,
          hoveredPieceId: null,
          isComplete: st.isComplete,
          completedAtMs: completedAtRef.current,
        },
      );

      // keep react state reasonably fresh
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

      // Get CSS-space coordinates
      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = manager.getState();
      // Only pick from pieces NOT in tray
      const boardPieces = st.pieces.filter((p) => !p.inTray);

      const pieceId = pickPieceId(ctx, boardPieces, cssX, cssY);

      if (!pieceId) return;

      // Middle click (button 1) = send to tray
      if (e.button === 1) {
        e.preventDefault();
        manager.movePieceToTray(pieceId);
        setState(manager.getState());
        return;
      }

      // Touch or left click = start drag
      // On touch devices, e.button is 0 but we should also check pointerType
      const isTouch = e.pointerType === "touch";
      const isLeftClick = e.button === 0;

      if (isTouch || isLeftClick) {
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (!piece) return;

        // Reset drag tracking
        didDragRef.current = false;

        // Prevent default to stop iOS from scrolling/zooming
        e.preventDefault();

        // Create a fake rect for the piece (manager expects this)
        const pieceRect = new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        );

        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        setState(manager.getState());

        // Capture pointer for smooth dragging
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // Some browsers don't support pointer capture
        }

        // Start long-press timer for mobile (send to tray)
        if (isTouch) {
          const longPressTimer = setTimeout(() => {
            // Only trigger if we haven't moved much (still on same piece)
            manager.pointerUp(); // Cancel drag
            manager.movePieceToTray(pieceId);
            setState(manager.getState());
            try {
              canvas.releasePointerCapture(e.pointerId);
            } catch {
              // Ignore
            }
          }, 500);

          // Store timer to cancel on move/up
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
        // Don't rotate if already placed
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (piece?.isPlaced) return;
        manager.rotatePiece(pieceId);
        soundManager.play("rotate");
        setState(manager.getState());
      }
    },
    [manager],
  );

  // Track for tap-to-rotate (did we actually drag or just tap?)
  const didDragRef = useRef(false);

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

      // Mark that we dragged (moved more than a few pixels)
      didDragRef.current = true;

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

      // Check for single-tap to rotate (mobile) - tap without dragging
      const isTouch = e.pointerType === "touch";
      const boardRect = boardRef.current?.getBoundingClientRect();
      const ctx = canvas.getContext("2d");

      if (isTouch && boardRect && ctx && !didDragRef.current) {
        // Reset transform to identity for hit testing in CSS pixel space
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const st = manager.getState();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        const pieceId = pickPieceId(ctx, st.pieces, x, y);

        // Single tap on a piece = rotate it
        if (pieceId) {
          const piece = st.pieces.find((p) => p.id === pieceId);
          if (piece && !piece.isPlaced) {
            manager.rotatePiece(pieceId);
            soundManager.play("rotate");
          }
        }
      }

      manager.pointerUp();
      setState(manager.getState());

      // Release pointer capture
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore - may not have capture
      }
    },
    [manager],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent right-click menu
  }, []);

  // Handle clicking a piece in the tray to bring it back to board
  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      manager.movePieceFromTray(pieceId);
      setState(manager.getState());
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

    // Sort by average color (hue)
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
          <Button size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard size={16} />
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

      {/* New Game Confirmation Modal */}
      <ConfirmModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onConfirm={handleNewGame}
        title="Start New Game?"
        message="Your current progress will be lost. Are you sure you want to start a new game?"
        confirmText="New Game"
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

          {/* Reference preview image */}
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

      {/* Keyboard shortcuts modal */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* First-time tutorial overlay */}
      {showTutorial && <TutorialOverlay onComplete={dismissTutorial} />}
    </div>
  );
}

export default PlayScreen;
