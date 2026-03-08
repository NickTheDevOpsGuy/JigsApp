import {
  MAX_SCALE,
  MIN_SCALE,
  type ViewportState,
} from "@/screens/Play/hooks/viewport/viewportStorage";

export type ViewportBounds = {
  contentW: number;
  contentH: number;
  containerW: number;
  containerH: number;
};

export const ZOOM_SENSITIVITY = 0.001;
export const ZOOM_STEP = 0.2;
export const ZOOM_ANIM_MS = 200;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function clampPan(
  scale: number,
  panX: number,
  panY: number,
  bounds: ViewportBounds,
): { panX: number; panY: number } {
  const minPanX = bounds.containerW - bounds.contentW * scale;
  const minPanY = bounds.containerH - bounds.contentH * scale;
  return {
    panX: Math.max(minPanX, Math.min(0, panX)),
    panY: Math.max(minPanY, Math.min(0, panY)),
  };
}

export function buildSteppedZoomTarget(
  prev: ViewportState,
  direction: "in" | "out",
): ViewportState {
  const newScale =
    direction === "in"
      ? Math.min(MAX_SCALE, prev.scale + ZOOM_STEP)
      : Math.max(MIN_SCALE, prev.scale - ZOOM_STEP);
  const factor = newScale / prev.scale;
  return {
    scale: newScale,
    panX: prev.panX * factor,
    panY: prev.panY * factor,
  };
}

export function buildWheelZoomTarget(
  viewport: ViewportState,
  cssX: number,
  cssY: number,
  deltaY: number,
  bounds: ViewportBounds | null,
): ViewportState {
  const delta = -deltaY * ZOOM_SENSITIVITY;
  const scale = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, viewport.scale + viewport.scale * delta),
  );
  const scaleFactor = scale / viewport.scale;
  let panX = cssX - (cssX - viewport.panX) * scaleFactor;
  let panY = cssY - (cssY - viewport.panY) * scaleFactor;
  if (bounds) {
    const clamped = clampPan(scale, panX, panY, bounds);
    panX = clamped.panX;
    panY = clamped.panY;
  }
  return { scale, panX, panY };
}
