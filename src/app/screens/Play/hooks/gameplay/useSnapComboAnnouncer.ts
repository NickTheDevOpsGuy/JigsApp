/**
 * useSnapComboAnnouncer – snap combo decay interval and announcer line ("Nice!", "Combo!", etc.).
 */
import { useEffect, useState } from "react";
import type { MutableRefObject } from "react";

const SNAP_COMBO_IDLE_MS = 2500;

export function useSnapComboAnnouncer(
  placementTimesRef: MutableRefObject<number[]>,
  snapCombo: number,
  setSnapCombo: (value: number | ((prev: number) => number)) => void,
  isComplete = false,
) {
  const [announcerLine, setAnnouncerLine] = useState<string | null>(null);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => {
      const now = performance.now();
      const comboCutoff = now - SNAP_COMBO_IDLE_MS;
      const recent = placementTimesRef.current.filter((t) => t > comboCutoff);
      setSnapCombo((prev) => {
        const next = recent.length;
        return next !== prev ? next : prev;
      });
    }, 400);
    return () => clearInterval(id);
  }, [placementTimesRef, setSnapCombo, isComplete]);

  useEffect(() => {
    const line =
      snapCombo >= 6
        ? "Unstoppable!"
        : snapCombo >= 4
          ? "Combo!"
          : snapCombo >= 2
            ? "Nice!"
            : null;
    setAnnouncerLine(line);
  }, [snapCombo]);

  useEffect(() => {
    if (!announcerLine) return;
    const t = setTimeout(() => setAnnouncerLine(null), 3_000);
    return () => clearTimeout(t);
  }, [announcerLine]);

  return announcerLine;
}
