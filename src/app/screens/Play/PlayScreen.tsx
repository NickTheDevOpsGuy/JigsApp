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

function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

type ViewState = {
  scale: number; // 1 = normal
  panX: number; // CSS px
  panY: number; // CSS px
};

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

  // View transform (zoom/pan)
  const [view, setView] = useState<ViewState>({ scale: 1, panX: 0, panY: 0 });
  const viewRef = useRef<ViewState>({ scale: 1, panX: 0, panY: 0 });
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Shift-to-pan state (Space is pause)
  const shiftHeldRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );

  // Track completion time for animation
  const completedAtRef = useRef<number | null>(null);

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

  // Modal state for new game confirmation
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  // Currently selected piece for keyboard controls
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const selectedPieceIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedPieceIdRef.current = selectedPieceId;
  }, [selectedPieceId]);

  // Selection for keyboard controls (separate ref used by HUD)
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

  // Track Shift held for panning
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Shift") shiftHeldRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftHeldRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
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
          if (manager && state && !isPaused) {
            const unplacedPieces = state.pieces.filter((p) => !p.isPlaced && !p.inTray);
            let pieceToRotate = unplacedPieces.find((p) => p.id === selectedPieceId);

            if (!pieceToRotate && unplacedPieces.length > 0) {
              pieceToRotate = unplacedPieces[0];
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
          if (state && !isPaused) {
            const unplacedPieces = state.pieces.filter((p) => !p.isPlaced && !p.inTray);
            if (unplacedPieces.length === 0) break;

            const currentIndex = unplacedPieces.findIndex(
              (p) => p.id === selectedPieceId,
            );
            let newIndex: number;

            if (action === "nextPiece") {
              newIndex =
                currentIndex < 0 ? 0 : (currentIndex + 1) % unplacedPieces.length;
            } else {
              newIndex =
                currentIndex < 0
                  ? unplacedPieces.length - 1
                  : (currentIndex - 1 + unplacedPieces.length) % unplacedPieces.length;
            }

            setSelectedPieceId(unplacedPieces[newIndex].id);
          }
          break;
        }
        case "moveUp":
        case "moveDown":
        case "moveLeft":
        case "moveRight": {
          if (manager && state && !isPaused && selectedPieceId) {
            const piece = state.pieces.find((p) => p.id === selectedPieceId);
            if (piece && !piece.isPlaced && !piece.inTray) {
              const moveAmount = 20; // pixels per keypress
              let dx = 0,
                dy = 0;

              if (action === "moveUp") dy = -moveAmount;
              else if (action === "moveDown") dy = moveAmount;
              else if (action === "moveLeft") dx = -moveAmount;
              else if (action === "moveRight") dx = moveAmount;

              // Keyboard nudges should be in world space (not affected by view)
              manager.nudgeGroup(selectedPieceId, dx, dy);
              setState(manager.getState());
            }
          }
          break;
        }
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

    if (hasSavedGame && savedState) {
      next.restoreFromSaved(savedState.pieces);
    }

    setManager(next);
    const st = next.getState();
    setState(st);

    const selectable = st.pieces.filter((p) => !p.inTray && !p.isPlaced);
    selectedIdRef.current = selectable.length ? selectable[0].id : null;
    bump();

    // Reset view on new manager init
    setView({ scale: 1, panX: 0, panY: 0 });
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

  // Helpers: convert between screen (CSS) coords and world coords
  const screenToWorld = useCallback((cssX: number, cssY: number) => {
    const { scale, panX, panY } = viewRef.current;
    return {
      x: (cssX - panX) / scale,
      y: (cssY - panY) / scale,
    };
  }, []);

  // Helper: feed PuzzleManager pointer APIs “virtual client coords” that stay correct under zoom/pan
  const toVirtualClient = useCallback(
    (clientX: number, clientY: number, boardRect: DOMRect) => {
      const { scale, panX, panY } = viewRef.current;
      const vx = (clientX - boardRect.left - panX) / scale + boardRect.left;
      const vy = (clientY - boardRect.top - panY) / scale + boardRect.top;
      return { vx, vy };
    },
    [],
  );

  // Mouse wheel: pan (normal) / zoom (ctrlKey pinch)
  useEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return;

    const onWheel = (e: WheelEvent) => {
      if (isTypingTarget(e.target)) return;

      const rect = board.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;

      const cur = viewRef.current;

      // ctrlKey is how trackpad pinch usually appears as “wheel zoom”
      if (e.ctrlKey) {
        e.preventDefault();

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const nextScale = clamp(cur.scale * zoomFactor, 0.5, 3);

        // zoom toward cursor
        const world = screenToWorld(cssX, cssY);
        const nextPanX = cssX - world.x * nextScale;
        const nextPanY = cssY - world.y * nextScale;

        setView({ scale: nextScale, panX: nextPanX, panY: nextPanY });
        return;
      }

      // Otherwise pan with wheel/trackpad scroll
      e.preventDefault();
      setView((v) => ({
        ...v,
        panX: v.panX - e.deltaX,
        panY: v.panY - e.deltaY,
      }));
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [screenToWorld]);

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

      // Draw in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Force a solid white background in SCREEN space every frame
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cssW, cssH);

      // Apply view transform (pan/zoom) after painting background
      const { scale, panX, panY } = viewRef.current;
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);

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
          selectedPieceId: selectedIdRef.current,
          justSnappedPieces: new Set<string>(),
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

      // Shift + drag = pan mode (do not pick pieces)
      if (shiftHeldRef.current && e.button === 0) {
        e.preventDefault();
        isPanningRef.current = true;
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: viewRef.current.panX,
          panY: viewRef.current.panY,
        };
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        return;
      }

      // Hit testing in WORLD coords
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;
      const world = screenToWorld(cssX, cssY);

      const st = manager.getState();
      const boardPieces = st.pieces.filter((p) => !p.inTray);

      const pieceId = pickPieceId(ctx, boardPieces, world.x, world.y);
      if (!pieceId) return;

      // Always select what we clicked
      selectedIdRef.current = pieceId;
      bump();

      // Middle click (button 1) = send to tray
      if (e.button === 1) {
        e.preventDefault();
        manager.movePieceToTray(pieceId);
        setState(manager.getState());
        return;
      }

      // Touch or left click = start drag
      const isTouch = e.pointerType === "touch";
      const isLeftClick = e.button === 0;

      if (isTouch || isLeftClick) {
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (!piece) return;

        e.preventDefault();

        // Feed PuzzleManager “virtual client coords” so it stays correct under view transforms
        const { vx, vy } = toVirtualClient(e.clientX, e.clientY, boardRect);

        const pieceRect = new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        );

        manager.pointerDown(pieceId, vx, vy, pieceRect);
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
    [manager, screenToWorld, toVirtualClient],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current) return;

      // If panning, update view and bail
      if (isPanningRef.current && panStartRef.current) {
        e.preventDefault();
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setView({
          scale: viewRef.current.scale,
          panX: panStartRef.current.panX + dx,
          panY: panStartRef.current.panY + dy,
        });
        return;
      }

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
      const { vx, vy } = toVirtualClient(e.clientX, e.clientY, boardRect);

      manager.pointerMove(vx, vy, boardRect);
    },
    [manager, toVirtualClient],
  );

  // Track for tap-to-rotate (mobile)
  const lastTapRef = useRef<{ pieceId: string | null; time: number }>({
    pieceId: null,
    time: 0,
  });

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      const canvas = canvasRef.current;

      // End panning if we were panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        return;
      }

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

      // Check for double-tap rotate (mobile)
      const isTouch = e.pointerType === "touch";
      const boardRect = boardRef.current?.getBoundingClientRect();
      const ctx = canvas.getContext("2d");

      if (isTouch && boardRect && ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const st = manager.getState();
        const cssX = e.clientX - boardRect.left;
        const cssY = e.clientY - boardRect.top;
        const world = screenToWorld(cssX, cssY);

        const pieceId = pickPieceId(
          ctx,
          st.pieces.filter((p) => !p.inTray),
          world.x,
          world.y,
        );

        const now = performance.now();
        if (pieceId) {
          const last = lastTapRef.current;
          if (last.pieceId === pieceId && now - last.time < 300) {
            const piece = st.pieces.find((p) => p.id === pieceId);
            if (piece && !piece.isPlaced) {
              manager.rotatePiece(pieceId);
              soundManager.play("rotate");
            }
          }
          lastTapRef.current = { pieceId, time: now };
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
    [manager, screenToWorld],
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

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {showTutorial && <TutorialOverlay onComplete={dismissTutorial} />}
    </div>
  );
}

export default PlayScreen;
