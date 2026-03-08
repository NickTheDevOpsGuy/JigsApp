/**
 * Pure helpers for restoring piece state from saved snapshots (undo/redo).
 * Used by PuzzleManager.restoreFromSaved.
 */
import type { Piece } from "./types";
import type { SavedPiece } from "./puzzleStorage";
import { lockDebug } from "./puzzleLockDebug";
import { logger } from "@/utils/logger";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeRotation(rotation: number): number {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Merge saved piece data into current pieces. Returns new array; does not mutate.
 * Validates count and id set; throws if mismatch.
 */
export function applySavedPieces(
  currentPieces: Piece[],
  savedPieces: SavedPiece[],
): Piece[] {
  lockDebug("applySavedPieces:start", {
    currentCount: currentPieces.length,
    savedCount: savedPieces.length,
    savedLocked: savedPieces.filter((p) => p.locked).length,
    savedInTray: savedPieces.filter((p) => p.inTray).length,
  });
  if (savedPieces.length !== currentPieces.length) {
    throw new Error(
      `Saved piece count (${savedPieces.length}) does not match grid (${currentPieces.length})`,
    );
  }
  const pieceMap = new Map(savedPieces.map((p) => [p.id, p]));
  const currentIds = new Set(currentPieces.map((p) => p.id));
  for (const sp of savedPieces) {
    if (!currentIds.has(sp.id)) {
      throw new Error(`Saved piece id ${sp.id} not found in current puzzle`);
    }
  }

  const merged = currentPieces.map((p) => {
    const saved = pieceMap.get(p.id);
    if (saved) {
      const isPlaced = saved.isPlaced;
      const locked = saved.locked ?? false;
      // Guard against legacy/corrupt snapshots where a placed/locked piece was flagged in tray.
      const inTray = isPlaced || locked ? false : saved.inTray;
      const solvedContainerX = p.targetX - p.pad;
      const solvedContainerY = p.targetY - p.pad;

      return {
        ...p,
        // Locked pieces should restore exactly to solved coordinates. This avoids
        // false unlocks across responsive layout/session restores.
        x: locked ? solvedContainerX : isFiniteNumber(saved.x) ? saved.x : p.x,
        y: locked ? solvedContainerY : isFiniteNumber(saved.y) ? saved.y : p.y,
        z: isFiniteNumber(saved.z) ? saved.z : p.z,
        rotation: locked
          ? p.targetRotation
          : isFiniteNumber(saved.rotation)
            ? normalizeRotation(saved.rotation)
            : p.rotation,
        groupId:
          typeof saved.groupId === "string" && saved.groupId.trim().length > 0
            ? saved.groupId
            : p.groupId,
        isPlaced,
        locked,
        inTray,
        dragCount: saved.dragCount ?? p.dragCount ?? 0,
      };
    }
    return p;
  });

  // Group-level safety: if a group mixes tray + board members in saved state,
  // split tray members back to their own single-piece groups. Mixed groups can
  // block board snap/lock checks for otherwise correct board pieces.
  const groupHasTray = new Map<string, boolean>();
  const groupHasBoard = new Map<string, boolean>();
  for (const p of merged) {
    if (p.inTray) {
      groupHasTray.set(p.groupId, true);
    } else {
      groupHasBoard.set(p.groupId, true);
    }
  }
  const withSplitTrayGroups = merged.map((p) => {
    const mixed = groupHasTray.get(p.groupId) && groupHasBoard.get(p.groupId);
    if (!mixed || !p.inTray) return p;
    return { ...p, groupId: p.id };
  });
  lockDebug("applySavedPieces:splitMixedGroups", {
    splitCount: withSplitTrayGroups.filter((p, i) => p.groupId !== merged[i]?.groupId)
      .length,
  });

  // Mixed locked/unlocked board groups from stale snapshots can make puzzles unsolvable.
  // Split unlocked board members out so locked anchors don't freeze unrelated pieces.
  const groupHasLockedBoard = new Map<string, boolean>();
  const groupHasUnlockedBoard = new Map<string, boolean>();
  for (const p of withSplitTrayGroups) {
    if (p.inTray) continue;
    if (p.locked) groupHasLockedBoard.set(p.groupId, true);
    else groupHasUnlockedBoard.set(p.groupId, true);
  }
  const withSplitMixedLockGroups = withSplitTrayGroups.map((p) => {
    if (p.inTray) return p;
    const mixedLocks =
      groupHasLockedBoard.get(p.groupId) && groupHasUnlockedBoard.get(p.groupId);
    if (!mixedLocks || p.locked) return p;
    return { ...p, groupId: p.id };
  });
  lockDebug("applySavedPieces:splitMixedLockGroups", {
    splitCount: withSplitMixedLockGroups.filter(
      (p, i) => p.groupId !== withSplitTrayGroups[i]?.groupId,
    ).length,
  });

  // Locked pieces must be on-board, unrotated, and near target; otherwise unlock them.
  const lockValidityEpsilonPx = 4;
  let unlockedInvalidCount = 0;
  let unplacedInvalidCount = 0;
  const normalized = withSplitMixedLockGroups.map((p) => {
    const tileX = p.x + p.pad;
    const tileY = p.y + p.pad;
    const atTarget =
      Math.abs(tileX - p.targetX) <= lockValidityEpsilonPx &&
      Math.abs(tileY - p.targetY) <= lockValidityEpsilonPx;

    if (!p.locked) return p;
    const validLock = !p.inTray && p.rotation === p.targetRotation && atTarget;
    if (validLock) return { ...p, inTray: false };
    unlockedInvalidCount += 1;
    return { ...p, locked: false, isPlaced: false };
  });
  if (unlockedInvalidCount > 0) {
    lockDebug("applySavedPieces:unlockedInvalidLocks", { unlockedInvalidCount });
  }
  const finalPieces = normalized.map((p) => {
    if (!p.isPlaced) return p;
    const tileX = p.x + p.pad;
    const tileY = p.y + p.pad;
    const atTarget =
      Math.abs(tileX - p.targetX) <= lockValidityEpsilonPx &&
      Math.abs(tileY - p.targetY) <= lockValidityEpsilonPx &&
      p.rotation === p.targetRotation;
    if (atTarget) return p;
    unplacedInvalidCount += 1;
    return { ...p, isPlaced: false, locked: false };
  });
  if (unplacedInvalidCount > 0) {
    lockDebug("applySavedPieces:unplacedInvalidPlacedState", { unplacedInvalidCount });
  }
  lockDebug("applySavedPieces:done", {
    lockedAfter: finalPieces.filter((p) => p.locked).length,
    inTrayAfter: finalPieces.filter((p) => p.inTray).length,
  });
  return finalPieces;
}

/** Dev-only: warn if any piece has invalid groupId. */
export function assertGroupConsistency(pieces: Piece[]): void {
  if (import.meta.env?.DEV !== true) return;
  for (const p of pieces) {
    if (!p.groupId || typeof p.groupId !== "string") {
      logger.warn("[PuzzleManager] Piece has invalid groupId after restore:", p.id);
    }
  }
}
