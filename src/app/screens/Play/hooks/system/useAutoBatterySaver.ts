import { useEffect, useState } from "react";

function detectAutoBatterySaver(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const reduceMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData ?? false;
  const lowMemory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory != null &&
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
  const lowCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;

  return reduceMotion || saveData || lowMemory || lowCpu;
}

export function useAutoBatterySaver(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => detectAutoBatterySaver());

  useEffect(() => {
    setEnabled(detectAutoBatterySaver());
  }, []);

  return enabled;
}
