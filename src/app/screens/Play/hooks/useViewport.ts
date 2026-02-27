/**
 * useViewport – zoom/pan state for the puzzle board.
 * screenToBoard converts client coords to board space; handleWheel, zoomIn/Out, reset.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

const isPanningRef = { current: false };
const isPinchingRef = { current: false };

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;
const ZOOM_SENSITIVITY = 0.001;
const ZOOM_STEP = 0.2;
const ZOOM_ANIM_MS = 200;
const VIEWPORT_STORAGE_PREFIX = "phuzzle:viewport:";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadViewport(puzzleKey: string | null): ViewportState | null {
  if (!puzzleKey || typeof window === "undefined") return null;
  try {
    const raw = safeLocalStorage.getItem(`${VIEWPORT_STORAGE_PREFIX}${puzzleKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { scale?: number; panX?: number; panY?: number };
    const scale = typeof parsed?.scale === "number" ? parsed.scale : 1;
    const panX = typeof parsed?.panX === "number" ? parsed.panX : 0;
    const panY = typeof parsed?.panY === "number" ? parsed.panY : 0;
    if (scale >= MIN_SCALE && scale <= MAX_SCALE) {
      return { scale, panX, panY };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveViewport(puzzleKey: string | null, v: ViewportState): void {
  if (!puzzleKey || typeof window === "undefined") return;
  safeLocalStorage.setItem(
    `${VIEWPORT_STORAGE_PREFIX}${puzzleKey}`,
    JSON.stringify({ scale: v.scale, panX: v.panX, panY: v.panY }),
  );
}

export type ViewportState = {
  scale: number;
  panX: number;
  panY: number;
};

export function useViewport(puzzleKey: string | null = null) {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    const loaded = loadViewport(puzzleKey);
    return loaded ?? { scale: 1, panX: 0, panY: 0 };
  });

  const prevPuzzleKeyRef = useRef<string | null>(puzzleKey);
  useEffect(() => {
    if (puzzleKey !== prevPuzzleKeyRef.current) {
      prevPuzzleKeyRef.current = puzzleKey;
      const loaded = loadViewport(puzzleKey);
      setViewport(loaded ?? { scale: 1, panX: 0, panY: 0 });
    }
  }, [puzzleKey]);

  useEffect(() => {
    if (!puzzleKey) return;
    saveViewport(puzzleKey, viewport);
  }, [puzzleKey, viewport.scale, viewport.panX, viewport.panY]);

  const screenToBoard = useCallback(
    (clientX: number, clientY: number, boardRect: DOMRect): { x: number; y: number } => {
      const cssX = clientX - boardRect.left;
      const cssY = clientY - boardRect.top;
      return {
        x: (cssX - viewport.panX) / viewport.scale,
        y: (cssY - viewport.panY) / viewport.scale,
      };
    },
    [viewport.panX, viewport.panY, viewport.scale],
  );

  const boardToScreen = useCallback(
    (boardX: number, boardY: number, boardRect: DOMRect): { x: number; y: number } => {
      return {
        x: boardRect.left + viewport.panX + boardX * viewport.scale,
        y: boardRect.top + viewport.panY + boardY * viewport.scale,
      };
    },
    [viewport.panX, viewport.panY, viewport.scale],
  );

  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const panStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const pinchStartRef = useRef<{
    centerX: number;
    centerY: number;
    distance: number;
    scale: number;
    panX: number;
    panY: number;
  } | null>(null);
  const pinchPrevCenterRef = useRef<{ x: number; y: number } | null>(null);

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    const v = viewportRef.current;
    panStartRef.current = {
      clientX,
      clientY,
      panX: v.panX,
      panY: v.panY,
    };
  }, []);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    const start = panStartRef.current;
    if (!start || !isPanningRef.current) return;
    setViewport((prev) => ({
      ...prev,
      panX: start.panX + (clientX - start.clientX),
      panY: start.panY + (clientY - start.clientY),
    }));
  }, []);

  const startPinch = useCallback(
    (
      p1: { clientX: number; clientY: number },
      p2: { clientX: number; clientY: number },
    ) => {
      isPinchingRef.current = true;
      const v = viewportRef.current;
      const centerX = (p1.clientX + p2.clientX) / 2;
      const centerY = (p1.clientY + p2.clientY) / 2;
      const distance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
      pinchStartRef.current = {
        centerX,
        centerY,
        distance,
        scale: v.scale,
        panX: v.panX,
        panY: v.panY,
      };
      pinchPrevCenterRef.current = { x: centerX, y: centerY };
    },
    [],
  );

  const handlePinchMove = useCallback(
    (
      p1: { clientX: number; clientY: number },
      p2: { clientX: number; clientY: number },
      boardRect: DOMRect,
    ) => {
      const start = pinchStartRef.current;
      const prevCenter = pinchPrevCenterRef.current;
      if (!start || !isPinchingRef.current) return;
      const centerX = (p1.clientX + p2.clientX) / 2;
      const centerY = (p1.clientY + p2.clientY) / 2;
      const distance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
      if (distance < 1) return;
      const scaleFactor = distance / start.distance;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, start.scale * scaleFactor),
      );
      const v = viewportRef.current;
      const cssX = centerX - boardRect.left;
      const cssY = centerY - boardRect.top;
      const zoomScaleFactor = newScale / v.scale;
      const centerDeltaX = prevCenter ? centerX - prevCenter.x : 0;
      const centerDeltaY = prevCenter ? centerY - prevCenter.y : 0;
      const newPanX = cssX - (cssX - v.panX) * zoomScaleFactor + centerDeltaX;
      const newPanY = cssY - (cssY - v.panY) * zoomScaleFactor + centerDeltaY;
      pinchPrevCenterRef.current = { x: centerX, y: centerY };
      setViewport({ scale: newScale, panX: newPanX, panY: newPanY });
    },
    [],
  );

  const endPinch = useCallback(() => {
    isPinchingRef.current = false;
    pinchStartRef.current = null;
  }, []);

  const isPinching = useCallback(() => isPinchingRef.current, []);

  const endPan = useCallback(() => {
    isPanningRef.current = false;
    panStartRef.current = null;
  }, []);

  const isPanning = useCallback(() => isPanningRef.current, []);

  const isZoomedOrPanned = useCallback(() => {
    const v = viewportRef.current;
    return v.scale !== 1 || v.panX !== 0 || v.panY !== 0;
  }, []);

  const reset = useCallback(() => {
    setViewport({ scale: 1, panX: 0, panY: 0 });
  }, []);

  const animateTo = useCallback((target: ViewportState, durationMs?: number) => {
    if (prefersReducedMotion()) {
      setViewport(target);
      return;
    }
    const start = viewportRef.current;
    const startTime = performance.now();
    const duration = durationMs ?? ZOOM_ANIM_MS;
    let rafId: number;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setViewport({
        scale: start.scale + (target.scale - start.scale) * eased,
        panX: start.panX + (target.panX - start.panX) * eased,
        panY: start.panY + (target.panY - start.panY) * eased,
      });
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  /** Zoom out on completion: 600ms ease-out to show full puzzle. */
  const zoomOutOnComplete = useCallback(() => {
    if (prefersReducedMotion()) return;
    const v = viewportRef.current;
    const targetScale = Math.max(MIN_SCALE, Math.min(0.7, v.scale * 0.85));
    const factor = targetScale / v.scale;
    animateTo(
      {
        scale: targetScale,
        panX: v.panX * factor,
        panY: v.panY * factor,
      },
      600,
    );
  }, [animateTo]);

  const zoomIn = useCallback(() => {
    const prev = viewportRef.current;
    const newScale = Math.min(MAX_SCALE, prev.scale + ZOOM_STEP);
    const factor = newScale / prev.scale;
    const target = {
      scale: newScale,
      panX: prev.panX * factor,
      panY: prev.panY * factor,
    };
    if (prefersReducedMotion()) {
      setViewport(target);
    } else {
      animateTo(target);
    }
  }, [animateTo]);

  const zoomOut = useCallback(() => {
    const prev = viewportRef.current;
    const newScale = Math.max(MIN_SCALE, prev.scale - ZOOM_STEP);
    const factor = newScale / prev.scale;
    const target = {
      scale: newScale,
      panX: prev.panX * factor,
      panY: prev.panY * factor,
    };
    if (prefersReducedMotion()) {
      setViewport(target);
    } else {
      animateTo(target);
    }
  }, [animateTo]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>, boardEl: HTMLDivElement | null) => {
      if (!boardEl) return;
      const boardRect = boardEl.getBoundingClientRect();
      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, viewport.scale + viewport.scale * delta),
      );

      // Zoom toward cursor: adjust pan so point under cursor stays fixed
      const scaleFactor = newScale / viewport.scale;
      const newPanX = cssX - (cssX - viewport.panX) * scaleFactor;
      const newPanY = cssY - (cssY - viewport.panY) * scaleFactor;

      setViewport({ scale: newScale, panX: newPanX, panY: newPanY });
      e.preventDefault();
    },
    [viewport],
  );

  return {
    viewport,
    setViewport,
    screenToBoard,
    boardToScreen,
    reset,
    zoomIn,
    zoomOut,
    zoomOutOnComplete,
    handleWheel,
    startPan,
    handlePanMove,
    endPan,
    isPanning,
    isZoomedOrPanned,
    startPinch,
    handlePinchMove,
    endPinch,
    isPinching,
  };
}
