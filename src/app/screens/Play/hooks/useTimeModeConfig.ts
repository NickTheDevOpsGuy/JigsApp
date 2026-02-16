/**
 * useTimeModeConfig – time mode + countdown minutes, persisted in localStorage.
 */
import { useCallback, useEffect, useState } from "react";
import {
  TIME_MODE_KEY,
  COUNTDOWN_MINUTES_KEY,
  DEFAULT_TIME_MODE,
  DEFAULT_COUNTDOWN_MINUTES,
  type TimeMode,
} from "../timeMode";

export function useTimeModeConfig() {
  const [timeMode, setTimeModeState] = useState<TimeMode>(() => {
    try {
      const v = localStorage.getItem(TIME_MODE_KEY);
      return (v as TimeMode) || DEFAULT_TIME_MODE;
    } catch {
      return DEFAULT_TIME_MODE;
    }
  });

  const [countdownMinutes, setCountdownMinutesState] = useState(() => {
    try {
      const v = localStorage.getItem(COUNTDOWN_MINUTES_KEY);
      return v ? parseInt(v, 10) : DEFAULT_COUNTDOWN_MINUTES;
    } catch {
      return DEFAULT_COUNTDOWN_MINUTES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(TIME_MODE_KEY, timeMode);
    } catch {
      // ignore
    }
  }, [timeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(COUNTDOWN_MINUTES_KEY, String(countdownMinutes));
    } catch {
      // ignore
    }
  }, [countdownMinutes]);

  const setTimeMode = useCallback((mode: TimeMode | ((m: TimeMode) => TimeMode)) => {
    setTimeModeState((prev) => (typeof mode === "function" ? mode(prev) : mode));
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
