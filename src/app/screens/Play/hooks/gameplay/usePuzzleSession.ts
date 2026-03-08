/**
 * usePuzzleSession – co-op session from URL param; create/join, push state, subscribe.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createPuzzleSession,
  getPuzzleSession,
  subscribePuzzleSession,
  updatePuzzleSession,
  type PuzzleSession,
  type PuzzleSessionState,
} from "@/services/session/puzzleSessionService";
import type { GridSize } from "@/puzzle/core/types";
import type { Piece } from "@/puzzle/core/types";
import type { SavedPiece } from "@/puzzle/storage/puzzleStorage";
import { isSupabaseConfigured } from "@/supabase/client";

const SYNC_THROTTLE_MS = 50; // ~20fps max during drag
export const SESSION_ID_PARAM = "session";

function piecesToSaved(pieces: Piece[]): SavedPiece[] {
  return pieces.map((p) => ({
    id: p.id,
    row: p.row,
    col: p.col,
    x: p.x,
    y: p.y,
    z: p.z,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    locked: p.locked,
    groupId: p.groupId,
    inTray: p.inTray,
  }));
}

export type RealtimeStatus = "connected" | "reconnecting" | "disconnected" | null;

export type PuzzleSessionResult = {
  sessionId: string | null;
  session: PuzzleSession | null;
  sessionLoading: boolean;
  creatingSession: boolean;
  connectedCount: number;
  realtimeStatus: RealtimeStatus;
  isHost: boolean;
  createSession: (
    imgUrl?: string,
    g?: GridSize,
    initialPieces?: SavedPiece[],
    initialElapsed?: number,
  ) => Promise<string | null>;
  getShareUrl: () => string;
  copyShareLink: () => Promise<boolean>;
  nativeShare: () => Promise<boolean>;
  pushState: (pieces: Piece[], elapsedSeconds: number, isComplete: boolean) => void;
  remoteState: PuzzleSessionState | null;
  clearRemoteState: () => void;
  retryJoin: () => void;
  joinError: Error | null;
  lastEventTimestamp: number | null;
  lastDbWriteMs: number | null;
  channelName: string | null;
};

export function usePuzzleSession(imageUrl: string, grid: GridSize): PuzzleSessionResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get(SESSION_ID_PARAM);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<PuzzleSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(!!sessionIdFromUrl);
  const [creatingSession, setCreatingSession] = useState(false);
  const [connectedCount, setConnectedCount] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>(null);
  const [remoteState, setRemoteState] = useState<PuzzleSessionState | null>(null);
  const [joinError, setJoinError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const isHostRef = useRef(false);
  const createInFlightRef = useRef(false);
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushRef = useRef<number>(0);
  const lastEventRef = useRef<number | null>(null);
  const pendingStateRef = useRef<PuzzleSessionState | null>(null);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<number | null>(null);
  const [lastDbWriteMs, setLastDbWriteMs] = useState<number | null>(null);

  const isHost = isHostRef.current;

  const pushState = useCallback(
    (pieces: Piece[], elapsedSeconds: number, isComplete: boolean) => {
      if (!sessionId || !isSupabaseConfigured()) return;
      const state: PuzzleSessionState = {
        pieces: piecesToSaved(pieces),
        elapsedSeconds,
        isComplete,
      };
      pendingStateRef.current = state;

      const doPush = async () => {
        const pending = pendingStateRef.current;
        if (!pending) return;
        const t0 = Date.now();
        lastPushRef.current = t0;
        pendingStateRef.current = null;
        await updatePuzzleSession(sessionId, pending);
        setLastDbWriteMs(Math.round(Date.now() - t0));
      };

      const now = Date.now();
      const elapsed = now - lastPushRef.current;
      if (elapsed >= SYNC_THROTTLE_MS || lastPushRef.current === 0) {
        if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
        pushTimeoutRef.current = null;
        doPush();
      } else if (!pushTimeoutRef.current) {
        pushTimeoutRef.current = setTimeout(() => {
          pushTimeoutRef.current = null;
          doPush();
        }, SYNC_THROTTLE_MS - elapsed);
      }
    },
    [sessionId],
  );

  const createSession = useCallback(
    async (
      imgUrl?: string,
      g?: GridSize,
      initialPieces?: import("@/puzzle/storage/puzzleStorage").SavedPiece[],
      initialElapsed?: number,
    ): Promise<string | null> => {
      if (!isSupabaseConfigured()) return null;
      if (createInFlightRef.current) return sessionId; // Prevent duplicate creation
      const url = imgUrl ?? imageUrl;
      const gr = g ?? grid;
      if (!url) return null;
      createInFlightRef.current = true;
      setCreatingSession(true);
      try {
        const state: PuzzleSessionState = {
          pieces: initialPieces ?? [],
          elapsedSeconds: initialElapsed ?? 0,
          isComplete: false,
        };
        const result = await createPuzzleSession(url, gr, state);
        if ("error" in result) throw new Error(result.error);
        isHostRef.current = true;
        setSessionId(result.sessionId);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set(SESSION_ID_PARAM, result.sessionId);
          return next;
        });
        return result.sessionId;
      } finally {
        createInFlightRef.current = false;
        setCreatingSession(false);
      }
    },
    [imageUrl, grid, setSearchParams, sessionId],
  );

  const getShareUrl = useCallback(() => {
    if (!sessionId) return "";
    return `${window.location.origin}/play?${SESSION_ID_PARAM}=${sessionId}`;
  }, [sessionId]);

  const copyShareLink = useCallback(async (): Promise<boolean> => {
    const url = getShareUrl();
    if (!url) return false;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [getShareUrl]);

  const nativeShare = useCallback(async (): Promise<boolean> => {
    if (!navigator.share || !getShareUrl()) return false;
    try {
      await navigator.share({
        title: "Join my Phuzzle",
        text: "Solve this puzzle with me!",
        url: getShareUrl(),
      });
      return true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return false;
      return false;
    }
  }, [getShareUrl]);

  const retryJoin = useCallback(() => {
    setJoinError(null);
    setRetryCount((c) => c + 1);
  }, []);

  // Join: fetch session when we have sessionId in URL
  useEffect(() => {
    if (!sessionIdFromUrl || !isSupabaseConfigured()) {
      setSessionLoading(false);
      setJoinError(null);
      return;
    }

    setSessionId(sessionIdFromUrl);
    setSessionLoading(true);
    setJoinError(null);

    const load = async () => {
      try {
        const s = await getPuzzleSession(sessionIdFromUrl);
        setSession(s);
        if (!s) setJoinError(new Error("Session not found"));
      } catch (e) {
        setJoinError(e instanceof Error ? e : new Error(String(e)));
        setSession(null);
      } finally {
        setSessionLoading(false);
      }
    };
    load();
  }, [sessionIdFromUrl, retryCount]);

  // Subscribe to changes when we have a session
  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured()) return;

    const result = subscribePuzzleSession(
      sessionId,
      (state) => {
        if (Date.now() - lastPushRef.current < 400) return;
        lastEventRef.current = Date.now();
        setLastEventTimestamp(lastEventRef.current);
        setRemoteState(state);
      },
      setConnectedCount,
      setRealtimeStatus,
    );

    return () => {
      if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
      result.unsubscribe();
    };
  }, [sessionId]);

  return {
    sessionId,
    session,
    sessionLoading,
    creatingSession,
    connectedCount,
    realtimeStatus,
    isHost,
    createSession,
    getShareUrl,
    copyShareLink,
    nativeShare,
    pushState,
    remoteState,
    clearRemoteState: () => setRemoteState(null),
    retryJoin,
    joinError,
    lastEventTimestamp,
    lastDbWriteMs,
    channelName: sessionId ? `puzzle:${sessionId}` : null,
  };
}
