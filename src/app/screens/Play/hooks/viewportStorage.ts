/**
 * viewportStorage – load/save viewport (scale, pan) per puzzle key.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export type ViewportState = {
  scale: number;
  panX: number;
  panY: number;
};

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 2.5;
const VIEWPORT_STORAGE_PREFIX = "phuzzle:viewport:";

export function loadViewport(puzzleKey: string | null): ViewportState | null {
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

export function saveViewport(puzzleKey: string | null, v: ViewportState): void {
  if (!puzzleKey || typeof window === "undefined") return;
  safeLocalStorage.setItem(
    `${VIEWPORT_STORAGE_PREFIX}${puzzleKey}`,
    JSON.stringify({ scale: v.scale, panX: v.panX, panY: v.panY }),
  );
}
