import { useState, useCallback, useRef, useEffect } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

export function useBoardZoom(
  containerRef: React.RefObject<HTMLDivElement | null>,
  _boardRef: React.RefObject<HTMLDivElement | null>,
) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );
  const isPanningRef = useRef(false);
  const panRef = useRef(pan);
  panRef.current = pan;

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }, []);

  const zoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
    },
    [containerRef],
  );

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const isMiddle = e.button === 1;
    const isShiftLeft = e.button === 0 && e.shiftKey;
    if (!isMiddle && !isShiftLeft) return;
    e.preventDefault();
    e.stopPropagation();
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };
    isPanningRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isPanningRef.current || !panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    panStartRef.current = null;
    isPanningRef.current = false;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [containerRef, handleWheel]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("pointerdown", handlePointerDown, true);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointercancel", handlePointerUp);
    return () => {
      el.removeEventListener("pointerdown", handlePointerDown, true);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [containerRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  const transform = `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`;

  return { zoom, pan, zoomIn, zoomOut, zoomReset, transform };
}
