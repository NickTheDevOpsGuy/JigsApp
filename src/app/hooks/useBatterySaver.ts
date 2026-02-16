/**
 * useBatterySaver – detects data-saver / low-power hints.
 * When true: reduce confetti, heavy animations, idle redraw.
 */
import { useSyncExternalStore } from "react";

function getSnapshot(): boolean {
  if (typeof navigator === "undefined") return false;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection?.saveData;
  if (saveData === true) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribe(cb: () => void): () => void {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}

export function useBatterySaver(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
