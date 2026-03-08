/**
 * Optional lock/snap debug logger.
 *
 * Enable via either:
 * - query param: ?debugLocks=1
 * - localStorage: phuzzle:debugLocks = "1" or "true"
 */

import { logger } from "@/utils/logger";
const DEBUG_LOCKS_KEY = "phuzzle:debugLocks";
const DEFAULT_DEDUPE_WINDOW_MS = 150;
const OVERLAP_BLOCK_DEDUPE_WINDOW_MS = 750;
const lastLogAtByKey = new Map<string, number>();

function getDedupeWindowMs(message: string): number {
  if (message === "overlap-block") return OVERLAP_BLOCK_DEDUPE_WINDOW_MS;
  return DEFAULT_DEDUPE_WINDOW_MS;
}

function getDedupeKey(message: string, data: unknown): string {
  if (message === "overlap-block" && data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const movingGroupId = String(d.movingGroupId ?? "");
    const blockingGroupId = String(d.blockingGroupId ?? "");
    const movingPieceId = String(d.movingPieceId ?? "");
    const blockingPieceId = String(d.blockingPieceId ?? "");
    return `${message}|${movingGroupId}|${blockingGroupId}|${movingPieceId}|${blockingPieceId}`;
  }

  if (data === undefined) return message;
  try {
    return `${message}|${JSON.stringify(data)}`;
  } catch {
    return `${message}|[unserializable]`;
  }
}

export function isLockDebugEnabled(): boolean {
  try {
    if (typeof window !== "undefined" && window.location?.search) {
      const qp = new URLSearchParams(window.location.search).get("debugLocks");
      if (qp === "1" || qp === "true") return true;
      if (qp === "0" || qp === "false") return false;
    }
  } catch {
    // ignore
  }

  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem(DEBUG_LOCKS_KEY);
      return v === "1" || v === "true";
    }
  } catch {
    // ignore
  }
  return false;
}

export function lockDebug(message: string, data?: unknown): void {
  if (!isLockDebugEnabled()) return;

  const dedupeKey = getDedupeKey(message, data);
  const dedupeWindowMs = getDedupeWindowMs(message);
  const now = Date.now();
  const lastAt = lastLogAtByKey.get(dedupeKey);
  if (lastAt !== undefined && now - lastAt < dedupeWindowMs) {
    return;
  }
  lastLogAtByKey.set(dedupeKey, now);

  if (data === undefined) {
    logger.warn(`[lock-debug] ${message}`);
    return;
  }
  logger.warn(`[lock-debug] ${message}`, data);
}
