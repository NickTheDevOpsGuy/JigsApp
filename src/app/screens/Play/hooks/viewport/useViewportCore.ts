import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadViewport,
  saveViewport,
  MIN_SCALE,
  MAX_SCALE as _MAX_SCALE,
  type ViewportState,
} from "@/screens/Play/hooks/viewport/viewportStorage";
import {
  buildSteppedZoomTarget,
  buildWheelZoomTarget,
  clampPan,
  prefersReducedMotion,
  type ViewportBounds,
  ZOOM_ANIM_MS,
} from "@/screens/Play/hooks/viewport/viewportMath";
import { computePinchTarget } from "@/screens/Play/hooks/viewport/viewportPinch";

export type { ViewportState } from "@/screens/Play/hooks/viewport/viewportStorage";
const isPanningRef = { current: false };
const isPinchingRef = { current: false };

export function useViewport(
  puzzleKey: string | null = null,
  getBoundsRef?: RefObject<(() => ViewportBounds | null) | null>,
) {
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
    const bounds = getBoundsRef?.current?.();
    if (!bounds) return;
    const { scale, panX, panY } = viewport;
    const { panX: cx, panY: cy } = clampPan(scale, panX, panY, bounds);
    if (cx !== panX || cy !== panY) {
      setViewport((prev) => ({ ...prev, panX: cx, panY: cy }));
    }
  }, [viewport.scale, viewport.panX, viewport.panY, getBoundsRef]);

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

  const handlePanMove = useCallback(
    (clientX: number, clientY: number) => {
      const start = panStartRef.current;
      if (!start || !isPanningRef.current) return;
      const nextPanX = start.panX + (clientX - start.clientX);
      const nextPanY = start.panY + (clientY - start.clientY);
      setViewport((prev) => {
        const next = { ...prev, panX: nextPanX, panY: nextPanY };
        const bounds = getBoundsRef?.current?.() ?? null;
        if (bounds) {
          const clamped = clampPan(prev.scale, next.panX, next.panY, bounds);
          next.panX = clamped.panX;
          next.panY = clamped.panY;
        }
        return next;
      });
    },
    [getBoundsRef],
  );

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
      const target = computePinchTarget(
        start,
        prevCenter,
        p1,
        p2,
        boardRect,
        viewportRef.current,
        getBoundsRef?.current?.() ?? null,
      );
      if (!target) return;
      pinchPrevCenterRef.current = target.center;
      setViewport(target.viewport);
    },
    [getBoundsRef],
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
    const target = buildSteppedZoomTarget(prev, "in");
    if (prefersReducedMotion()) {
      setViewport(target);
    } else {
      animateTo(target);
    }
  }, [animateTo]);

  const zoomOut = useCallback(() => {
    const prev = viewportRef.current;
    const target = buildSteppedZoomTarget(prev, "out");
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

      const target = buildWheelZoomTarget(
        viewport,
        cssX,
        cssY,
        e.deltaY,
        getBoundsRef?.current?.() ?? null,
      );
      setViewport(target);
      e.preventDefault();
    },
    [viewport, getBoundsRef],
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
