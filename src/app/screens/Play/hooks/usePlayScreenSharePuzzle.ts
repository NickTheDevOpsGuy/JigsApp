/**
 * PlayScreen share-puzzle handler: coop share link or create session + native/clipboard share.
 */
import { useCallback } from "react";
import posthog from "posthog-js";
import type { Piece, PuzzleState, GridSize } from "@/puzzle/types";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { logger } from "@/utils/logger";
import { isSupabaseConfigured } from "@/supabase/client";
import { STORAGE_KEY } from "../playScreenUtils";
import { SESSION_ID_PARAM } from "./usePuzzleSession";

export type UsePlayScreenSharePuzzleParams = {
  sessionId: string | null;
  nativeShare: () => Promise<boolean>;
  copyShareLink: () => Promise<boolean>;
  createSession: (
    imgUrl?: string,
    grid?: GridSize,
    pieces?: Array<{
      id: string;
      row: number;
      col: number;
      x: number;
      y: number;
      z: number;
      rotation: number;
      isPlaced: boolean;
      locked: boolean;
      groupId: string;
      inTray: boolean;
    }>,
    elapsedSeconds?: number,
  ) => Promise<string | null>;
  grid: GridSize;
  isCoarsePointer: boolean;
  stateRef: React.MutableRefObject<PuzzleState | null>;
  elapsedSecondsRef: React.MutableRefObject<number>;
  setShareToast: (msg: string | null) => void;
};

export function usePlayScreenSharePuzzle({
  sessionId,
  nativeShare,
  copyShareLink,
  createSession,
  grid,
  isCoarsePointer,
  stateRef,
  elapsedSecondsRef,
  setShareToast,
}: UsePlayScreenSharePuzzleParams) {
  return useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setShareToast(null);
    const gridSize = stateRef.current?.grid
      ? `${stateRef.current.grid.rows}x${stateRef.current.grid.cols}`
      : "unknown";
    try {
      if (sessionId) {
        posthog.capture("coop_share_clicked", { grid_size: gridSize });
        let ok = false;
        let usedNative = false;
        if (typeof navigator.share === "function") {
          ok = await nativeShare();
          usedNative = ok;
          if (!ok) ok = await copyShareLink();
        } else {
          ok = await copyShareLink();
        }
        if (ok) setShareToast(usedNative ? "Shared!" : "Link copied!");
        return;
      }
      posthog.capture("coop_share_clicked", { grid_size: gridSize });
      const s = stateRef.current;
      const pieces = s?.pieces
        ? s.pieces.map((p: Piece) => ({
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
          }))
        : [];
      const id = await createSession(
        s?.imageUrl ?? safeLocalStorage.getItem(STORAGE_KEY) ?? "",
        s?.grid ?? grid,
        pieces,
        elapsedSecondsRef.current,
      );
      if (!id) {
        setShareToast("Couldn't create share link. Check your connection.");
        return;
      }
      posthog.capture("coop_session_created", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
      });
      const shareUrl = `${window.location.origin}/play?${SESSION_ID_PARAM}=${id}`;
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: "Join my Phuzzle",
            text: "Solve this puzzle with me!",
            url: shareUrl,
          });
          setShareToast("Shared!");
        } catch {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setShareToast("Link copied!");
          } catch {
            setShareToast("Share failed. Link is in address bar.");
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareToast("Link copied!");
        } catch {
          setShareToast("Couldn't copy. Link is in address bar.");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn("Share failed:", err);
      setShareToast(msg || "Share failed. Try again.");
    }
  }, [
    sessionId,
    nativeShare,
    copyShareLink,
    createSession,
    grid,
    isCoarsePointer,
    stateRef,
    elapsedSecondsRef,
    setShareToast,
  ]);
}
