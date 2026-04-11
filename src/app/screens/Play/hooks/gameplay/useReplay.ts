/**
 * useReplay – record puzzle progress snapshots and replay the solve in accelerated playback.
 */
import { useCallback, useRef, useState, useEffect } from "react";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { PuzzleState } from "@/puzzle/core/types";
import { piecesToSaved } from "@/puzzle/manager/undoManager";

const MAX_SNAPSHOTS = 400;
const DEFAULT_SPEED = 1; // 1x – no speed shown as "on" until user picks
const TICK_MS = 80;

function getIntervalMs(speed: number): number {
  return Math.max(8, Math.floor(TICK_MS / speed));
}

export type ReplaySnapshot = {
  elapsedSeconds: number;
  moveCount: number;
  savedPieces: ReturnType<typeof piecesToSaved>;
};

export type ReplayStateRef = {
  getState: () => PuzzleState | null;
  elapsedSeconds: number;
  moveCount: number;
};

export function useReplay(
  manager: PuzzleManager | null,
  setState: (s: PuzzleState) => void,
  replayStateRef: React.MutableRefObject<ReplayStateRef | null>,
  isComplete: boolean,
) {
  const snapshotsRef = useRef<ReplaySnapshot[]>([]);
  const [snapshots, setSnapshots] = useState<ReplaySnapshot[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isReplayPaused, setIsReplayPaused] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(DEFAULT_SPEED);
  const [speedExplicitlyChosen, setSpeedExplicitlyChosen] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const lastSnapshotCountRef = useRef(0);
  const isReplayingRef = useRef(false);
  const hasAdvancedThisResumeRef = useRef(false);
  isReplayingRef.current = isReplaying;

  const recordSnapshot = useCallback(() => {
    if (isReplayingRef.current) return;
    const r = replayStateRef.current;
    if (!r?.getState || !manager) return;
    const state = r.getState();
    if (!state?.pieces?.length) return;
    const list = snapshotsRef.current;
    list.push({
      elapsedSeconds: r.elapsedSeconds,
      moveCount: r.moveCount,
      savedPieces: piecesToSaved(state.pieces),
    });
    if (list.length > MAX_SNAPSHOTS) list.shift();
    setSnapshots([...list]);
  }, [manager, replayStateRef]);

  const getReplayList = useCallback((): ReplaySnapshot[] => {
    return snapshotsRef.current;
  }, []);

  const stopReplay = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsReplaying(false);
    const list = snapshotsRef.current;
    if (manager && list.length > 0) {
      const last = list[list.length - 1];
      manager.restoreFromSaved(last.savedPieces);
      setState(manager.getState());
    }
  }, [manager, setState]);

  const startReplay = useCallback(() => {
    const list = getReplayList();
    if (!manager || list.length === 0) return;
    setReplayIndex(0);
    manager.restoreFromSaved(list[0].savedPieces);
    setState(manager.getState());
    setIsReplaying(true);
    setIsReplayPaused(true); // Start paused so user presses Play to start
  }, [getReplayList, manager, setState]);

  const pauseReplay = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsReplayPaused(true);
  }, []);

  const resumeReplay = useCallback(() => {
    const list = getReplayList();
    if (!manager || list.length === 0) return;
    hasAdvancedThisResumeRef.current = false;
    // If user resumes from the end, restart from frame 0 so Play always replays.
    if (replayIndex >= list.length - 1) {
      setReplayIndex(0);
      manager.restoreFromSaved(list[0].savedPieces);
      setState(manager.getState());
    }
    setIsReplaying(true);
    setIsReplayPaused(false);
  }, [getReplayList, manager, replayIndex, setState]);

  useEffect(() => {
    if (!isReplaying || isReplayPaused || !manager) return;
    const list = getReplayList();
    if (list.length === 0) return;

    const intervalMs = getIntervalMs(replaySpeed);
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTickRef.current;
      const shouldAdvance =
        elapsed >= intervalMs || (!hasAdvancedThisResumeRef.current && list.length > 1);
      if (shouldAdvance) {
        hasAdvancedThisResumeRef.current = true;
        lastTickRef.current = now;
        setReplayIndex((i) => {
          const next = i + 1;
          if (next >= list.length) {
            if (rafRef.current != null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            setIsReplaying(false);
            manager.restoreFromSaved(list[list.length - 1].savedPieces);
            setState(manager.getState());
            return list.length - 1;
          }
          manager.restoreFromSaved(list[next].savedPieces);
          setState(manager.getState());
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [getReplayList, isReplaying, isReplayPaused, manager, setState, replaySpeed]);

  const replaySnapshots = getReplayList();
  const currentSnapshot = replaySnapshots[replayIndex] ?? null;
  const replayElapsedSeconds = currentSnapshot?.elapsedSeconds ?? 0;
  const replayMoveCount = currentSnapshot?.moveCount ?? 0;

  useEffect(() => {
    if (isComplete && snapshotsRef.current.length > lastSnapshotCountRef.current) {
      lastSnapshotCountRef.current = snapshotsRef.current.length;
    }
    if (!isComplete) lastSnapshotCountRef.current = 0;
  }, [isComplete]);

  const clearSnapshots = useCallback(() => {
    snapshotsRef.current = [];
    setSnapshots([]);
    setReplayIndex(0);
  }, []);

  /** New PuzzleManager instance (e.g. same-image restart) — drop old replay buffers. */
  useEffect(() => {
    if (!manager) return;
    clearSnapshots();
    setIsReplaying(false);
    setIsReplayPaused(false);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [manager, clearSnapshots]);

  const goToStart = useCallback(() => {
    const list = getReplayList();
    if (!manager || list.length === 0) return;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setReplayIndex(0);
    manager.restoreFromSaved(list[0].savedPieces);
    setState(manager.getState());
    setIsReplayPaused(true);
  }, [getReplayList, manager, setState]);

  const goToEnd = useCallback(() => {
    const list = getReplayList();
    if (!manager || list.length === 0) return;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const lastIdx = list.length - 1;
    setReplayIndex(lastIdx);
    manager.restoreFromSaved(list[lastIdx].savedPieces);
    setState(manager.getState());
    setIsReplaying(false);
    setIsReplayPaused(true);
  }, [getReplayList, manager, setState]);

  const seekToIndex = useCallback(
    (index: number) => {
      const list = getReplayList();
      if (!manager || list.length === 0) return;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const clamped = Math.max(0, Math.min(list.length - 1, index));
      setReplayIndex(clamped);
      manager.restoreFromSaved(list[clamped].savedPieces);
      setState(manager.getState());
      setIsReplayPaused(true);
    },
    [getReplayList, manager, setState],
  );

  /** Seek to the snapshot whose elapsedSeconds is closest to current + deltaSeconds (e.g. ±15s). */
  const seekBySeconds = useCallback(
    (deltaSeconds: number) => {
      // Access snapshotsRef.current directly — it's a ref and intentionally excluded
      // from deps. getReplayList was previously listed but never called here (stale dep).
      const list = snapshotsRef.current;
      if (!manager || list.length === 0) return;
      const current = list[replayIndex]?.elapsedSeconds ?? 0;
      const targetSeconds = Math.max(0, current + deltaSeconds);
      let bestIdx = 0;
      let bestDiff = Math.abs((list[0]?.elapsedSeconds ?? 0) - targetSeconds);
      for (let i = 1; i < list.length; i++) {
        const diff = Math.abs((list[i]?.elapsedSeconds ?? 0) - targetSeconds);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      }
      seekToIndex(bestIdx);
    },
    [manager, replayIndex, seekToIndex],
  );

  const setReplaySpeedWithChoice = useCallback((speed: number) => {
    setSpeedExplicitlyChosen(true);
    setReplaySpeed(speed);
  }, []);

  return {
    snapshots,
    replaySnapshots,
    recordSnapshot,
    isReplaying,
    isReplayPaused,
    pauseReplay,
    resumeReplay,
    replayIndex,
    replaySpeed,
    setReplaySpeed: setReplaySpeedWithChoice,
    speedExplicitlyChosen,
    startReplay,
    stopReplay,
    goToStart,
    goToEnd,
    seekToIndex,
    seekBySeconds,
    clearSnapshots,
    replayElapsedSeconds,
    replayMoveCount,
    canReplay: snapshots.length > 1,
  };
}
