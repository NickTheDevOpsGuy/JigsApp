import { MAX_SCALE, MIN_SCALE, type ViewportState } from "./viewportStorage";
import { clampPan, type ViewportBounds } from "./viewportMath";

type PointerPoint = { clientX: number; clientY: number };

export type PinchStartState = {
  centerX: number;
  centerY: number;
  distance: number;
  scale: number;
  panX: number;
  panY: number;
};

export function computePinchTarget(
  start: PinchStartState,
  prevCenter: { x: number; y: number } | null,
  p1: PointerPoint,
  p2: PointerPoint,
  boardRect: DOMRect,
  viewport: ViewportState,
  bounds: ViewportBounds | null,
) {
  const centerX = (p1.clientX + p2.clientX) / 2;
  const centerY = (p1.clientY + p2.clientY) / 2;
  const distance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
  if (distance < 1) return null;

  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, start.scale * (distance / start.distance)));
  const cssX = centerX - boardRect.left;
  const cssY = centerY - boardRect.top;
  const zoomScaleFactor = scale / viewport.scale;
  const centerDeltaX = prevCenter ? centerX - prevCenter.x : 0;
  const centerDeltaY = prevCenter ? centerY - prevCenter.y : 0;
  let panX = cssX - (cssX - viewport.panX) * zoomScaleFactor + centerDeltaX;
  let panY = cssY - (cssY - viewport.panY) * zoomScaleFactor + centerDeltaY;
  if (bounds) {
    const clamped = clampPan(scale, panX, panY, bounds);
    panX = clamped.panX;
    panY = clamped.panY;
  }

  return { viewport: { scale, panX, panY }, center: { x: centerX, y: centerY } };
}

