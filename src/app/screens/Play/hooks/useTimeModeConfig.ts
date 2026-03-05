/**
 * useTimeModeConfig – time mode + countdown minutes, persisted in localStorage.
 */
import { useCallback, useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import {
  TIME_MODE_KEY,
  COUNTDOWN_MINUTES_KEY,
  DEFAULT_COUNTDOWN_MINUTES,
  normalizeTimeMode,
  type TimeMode,
} from "../timeMode";

export function useTimeModeConfig() {
  const [timeMode, setTimeModeState] = useState<TimeMode>(() => {
    const v = safeLocalStorage.getItem(TIME_MODE_KEY);
    return normalizeTimeMode(v);
  });

  const [countdownMinutes, setCountdownMinutesState] = useState(() => {
    const v = safeLocalStorage.getItem(COUNTDOWN_MINUTES_KEY);
    return v ? parseInt(v, 10) : DEFAULT_COUNTDOWN_MINUTES;
  });

  useEffect(() => {
    safeLocalStorage.setItem(TIME_MODE_KEY, timeMode);
  }, [timeMode]);

  useEffect(() => {
    safeLocalStorage.setItem(COUNTDOWN_MINUTES_KEY, String(countdownMinutes));
  }, [countdownMinutes]);

  const setTimeMode = useCallback((mode: TimeMode | ((m: TimeMode) => TimeMode)) => {
    setTimeModeState((prev) =>
      normalizeTimeMode(typeof mode === "function" ? mode(prev) : mode),
    );
  }, []);

  const setCountdownMinutes = useCallback((mins: number | ((m: number) => number)) => {
    setCountdownMinutesState((prev) => (typeof mins === "function" ? mins(prev) : mins));
  }, []);

  return {
    timeMode,
    setTimeMode,
    countdownMinutes,
    setCountdownMinutes,
  };
}
