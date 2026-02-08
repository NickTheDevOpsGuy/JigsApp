import { useCallback, useRef, useState } from "react";

const isPanningRef = { current: false };

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

  const endPan = useCallback(() => {
    isPanningRef.current = false;
    panStartRef.current = null;
  }, []);

  const isPanning = useCallback(() => isPanningRef.current, []);

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
  };
}
