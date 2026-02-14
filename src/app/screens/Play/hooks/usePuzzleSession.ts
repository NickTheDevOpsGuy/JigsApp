import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createPuzzleSession,
  getPuzzleSession,
  subscribePuzzleSession,
  updatePuzzleSession,
  type PuzzleSession,
  type PuzzleSessionState,
} from "@/services/puzzleSessionService";
import type { GridSize } from "@/puzzle/types";
import type { Piece } from "@/puzzle/types";
import type { SavedPiece } from "@/puzzle/puzzleStorage";
import { isSupabaseConfigured } from "@/supabase/client";

const SYNC_DEBOUNCE_MS = 150;
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

export type PuzzleSessionResult = {
  sessionId: string | null;
  session: PuzzleSession | null;
  sessionLoading: boolean;
  connectedCount: number;
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
};

export function usePuzzleSession(imageUrl: string, grid: GridSize): PuzzleSessionResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get(SESSION_ID_PARAM);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<PuzzleSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(!!sessionIdFromUrl);
  const [connectedCount, setConnectedCount] = useState(0);
  const [remoteState, setRemoteState] = useState<PuzzleSessionState | null>(null);
  const isHostRef = useRef(false);
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushRef = useRef<number>(0);

  const isHost = isHostRef.current;

  const pushState = useCallback(
    (pieces: Piece[], elapsedSeconds: number, isComplete: boolean) => {
      if (!sessionId || !isSupabaseConfigured()) return;
      const state: PuzzleSessionState = {
        pieces: piecesToSaved(pieces),
        elapsedSeconds,
        isComplete,
      };

      const doPush = () => {
        lastPushRef.current = Date.now();
        updatePuzzleSession(sessionId, state);
      };

      if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
      pushTimeoutRef.current = setTimeout(doPush, SYNC_DEBOUNCE_MS);
    },
    [sessionId],
  );

  const createSession = useCallback(
    async (
      imgUrl?: string,
      g?: GridSize,
      initialPieces?: import("@/puzzle/puzzleStorage").SavedPiece[],
      initialElapsed?: number,
    ): Promise<string | null> => {
      if (!isSupabaseConfigured()) return null;
      const url = imgUrl ?? imageUrl;
      const gr = g ?? grid;
      if (!url) return null;
      const state: PuzzleSessionState = {
        pieces: initialPieces ?? [],
        elapsedSeconds: initialElapsed ?? 0,
        isComplete: false,
      };
      const result = await createPuzzleSession(url, gr, state);
      if (!result) return null;
      isHostRef.current = true;
      setSessionId(result.sessionId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(SESSION_ID_PARAM, result.sessionId);
        return next;
      });
      return result.sessionId;
    },
    [imageUrl, grid, setSearchParams],
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

  // Join: fetch session when we have sessionId in URL
  useEffect(() => {
    if (!sessionIdFromUrl || !isSupabaseConfigured()) {
      setSessionLoading(false);
      return;
    }

    setSessionId(sessionIdFromUrl);
    setSessionLoading(true);

    const load = async () => {
      const s = await getPuzzleSession(sessionIdFromUrl);
      setSession(s);
      setSessionLoading(false);
    };
    load();
  }, [sessionIdFromUrl]);

  // Subscribe to changes when we have a session
  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured()) return;

    const result = subscribePuzzleSession(
      sessionId,
      (state) => {
        if (Date.now() - lastPushRef.current < 400) return;
        setRemoteState(state);
      },
      setConnectedCount,
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
    connectedCount,
    isHost,
    createSession,
    getShareUrl,
    copyShareLink,
    nativeShare,
    pushState,
    remoteState,
    clearRemoteState: () => setRemoteState(null),
  };
}
