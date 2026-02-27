/**
 * playScreenAnimationOverrides – compute drag display, lock lerp, and undo snap-back overrides.
 * Extracted from usePlayScreenAnimation to keep the RAF loop shorter.
 */
import type React from "react";
import type { PuzzleState } from "@/puzzle/types";
import type { UndoSnapBackFrom } from "../playUtils";

const UNDO_SNAPBACK_MS = 280;

export type FrameOverridesParams = {
  st: PuzzleState;
  now: number;
  isDragging: boolean;
  draggedGroupId: string | null;
  dragDisplayRef: React.MutableRefObject<Map<string, { x: number; y: number }>>;
  lastPiecePositionsRef: React.MutableRefObject<Map<string, { x: number; y: number }>>;
  lockMap: Map<string, number>;
  undoSnapBackRef?: React.MutableRefObject<{
    fromPositions: UndoSnapBackFrom;
    startMs: number;
  } | null> | null;
  DRAG_LERP: number;
  LOCK_LERP_MS: number;
  onUndoSnapBackComplete?: () => void;
};

export type FrameOverridesResult = {
  lockLerpOverrides: Map<string, { x: number; y: number }> | undefined;
  undoSnapBackOverrides: Map<string, { x: number; y: number }> | undefined;
};

export function computeFrameOverrides(
  params: FrameOverridesParams,
): FrameOverridesResult {
  const {
    st,
    now,
    isDragging,
    draggedGroupId,
    dragDisplayRef,
    lastPiecePositionsRef,
    lockMap,
    undoSnapBackRef,
    DRAG_LERP,
    LOCK_LERP_MS,
    onUndoSnapBackComplete,
  } = params;

  const dragDisplayOverrides = dragDisplayRef.current;
  if (isDragging && draggedGroupId) {
    const groupPieces = st.pieces.filter(
      (p) => !p.inTray && p.groupId === draggedGroupId,
    );
    for (const p of groupPieces) {
      let pos = dragDisplayOverrides.get(p.id);
      if (!pos) {
        pos = { x: p.x, y: p.y };
        dragDisplayOverrides.set(p.id, pos);
      }
      pos.x += (p.x - pos.x) * DRAG_LERP;
      pos.y += (p.y - pos.y) * DRAG_LERP;
    }
  } else {
    if (dragDisplayOverrides.size > 0) {
      for (const [id, pos] of dragDisplayOverrides) {
        lastPiecePositionsRef.current.set(id, { x: pos.x, y: pos.y });
      }
      dragDisplayOverrides.clear();
    }
  }

  let undoSnapBackOverrides: Map<string, { x: number; y: number }> | undefined;
  const undoSnapBack = undoSnapBackRef?.current ?? null;
  if (undoSnapBack) {
    const elapsed = now - undoSnapBack.startMs;
    if (elapsed >= UNDO_SNAPBACK_MS) {
      onUndoSnapBackComplete?.();
    } else {
      const t = elapsed / UNDO_SNAPBACK_MS;
      const easeOut = 1 - Math.pow(1 - t, 1.5);
      undoSnapBackOverrides = new Map();
      for (const p of st.pieces) {
        if (p.inTray) continue;
        const from = undoSnapBack.fromPositions.get(p.id);
        if (!from) continue;
        undoSnapBackOverrides.set(p.id, {
          x: from.x + (p.x - from.x) * easeOut,
          y: from.y + (p.y - from.y) * easeOut,
        });
      }
    }
  }

  let lockLerpOverrides: Map<string, { x: number; y: number }> | undefined;
  if (!isDragging && !undoSnapBackOverrides) {
    const lastPos = lastPiecePositionsRef.current;
    for (const p of st.pieces) {
      if (p.inTray) continue;
      const lockAt = lockMap.get(p.id);
      if (lockAt == null) continue;
      const lockElapsedMs = now - lockAt;
      if (lockElapsedMs >= LOCK_LERP_MS) continue;
      const from = lastPos.get(p.id);
      if (from == null) continue;
      const t = Math.min(1, lockElapsedMs / LOCK_LERP_MS);
      const easeOut = 1 - (1 - t) * (1 - t);
      lockLerpOverrides ??= new Map();
      lockLerpOverrides.set(p.id, {
        x: from.x + (p.x - from.x) * easeOut,
        y: from.y + (p.y - from.y) * easeOut,
      });
    }
  }

  for (const p of st.pieces) {
    if (p.inTray) continue;
    const lockAt = lockMap.get(p.id);
    if (lockAt != null && now - lockAt < LOCK_LERP_MS) continue;
    const pos =
      isDragging &&
      draggedGroupId &&
      p.groupId === draggedGroupId &&
      dragDisplayOverrides.has(p.id)
        ? dragDisplayOverrides.get(p.id)!
        : { x: p.x, y: p.y };
    lastPiecePositionsRef.current.set(p.id, { x: pos.x, y: pos.y });
  }

  return {
    lockLerpOverrides,
    undoSnapBackOverrides,
  };
}
