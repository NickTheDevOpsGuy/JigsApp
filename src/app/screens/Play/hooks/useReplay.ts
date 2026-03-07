/**
 * useReplay – record puzzle progress snapshots and replay the solve in accelerated playback.
 */
import { useCallback, useRef, useState, useEffect } from "react";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import type { SavedPiece } from "@/puzzle/puzzleStorage";
import { piecesToSaved } from "@/puzzle/undoManager";

const MAX_SNAPSHOTS = 400;
const DEFAULT_SPEED = 4; // 4x
const TICK_MS = 80;

function getIntervalMs(speed: number): number {
  return Math.max(8, Math.floor(TICK_MS / speed));
}

export type ReplaySnapshot = {
  elapsedSeconds: number;
  moveCount: number;
  savedPieces: SavedPiece[];
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
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const lastSnapshotCountRef = useRef(0);
  const isReplayingRef = useRef(false);
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
    const list = snapshotsRef.current;
    if (!manager || list.length === 0) return;
    setReplayIndex(0);
    manager.restoreFromSaved(list[0].savedPieces);
    setState(manager.getState());
    setIsReplaying(true);
    setIsReplayPaused(false);
  }, [manager, setState]);

  const pauseReplay = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsReplayPaused(true);
  }, []);

  const resumeReplay = useCallback(() => {
    setIsReplayPaused(false);
  }, []);

  useEffect(() => {
    if (!isReplaying || isReplayPaused || !manager) return;
    const list = snapshotsRef.current;
    if (list.length === 0) return;

    const intervalMs = getIntervalMs(replaySpeed);
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTickRef.current;
      if (elapsed >= intervalMs) {
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
  }, [isReplaying, isReplayPaused, manager, setState, replaySpeed]);

  const currentSnapshot = snapshots[replayIndex] ?? null;
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

  const goToStart = useCallback(() => {
    const list = snapshotsRef.current;
    if (!manager || list.length === 0) return;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setReplayIndex(0);
    manager.restoreFromSaved(list[0].savedPieces);
    setState(manager.getState());
    setIsReplayPaused(true);
  }, [manager, setState]);

  const goToEnd = useCallback(() => {
    const list = snapshotsRef.current;
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
  }, [manager, setState]);

  return {
    snapshots,
    recordSnapshot,
    isReplaying,
    isReplayPaused,
    pauseReplay,
    resumeReplay,
    replayIndex,
    replaySpeed,
    setReplaySpeed,
    startReplay,
    stopReplay,
    goToStart,
    goToEnd,
    clearSnapshots,
    replayElapsedSeconds,
    replayMoveCount,
    canReplay: snapshots.length > 1,
  };
}
