import { useCallback, useRef, useState } from "react";

const isPanningRef = { current: false };
const isPinchingRef = { current: false };

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const ZOOM_SENSITIVITY = 0.001;

export type ViewportState = {
  scale: number;
  panX: number;
  panY: number;
};

export function useViewport() {
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    panX: 0,
    panY: 0,
  });

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
