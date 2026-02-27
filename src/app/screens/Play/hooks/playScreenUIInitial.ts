/**
 * Load play screen UI preferences from localStorage (for usePlayScreenUI initial state).
 */
import type { PieceCutType } from "@/puzzle/types";
import type { DebugFlags } from "../playScreenUtils";
import {
  PIECE_LOCKING_KEY,
  CUT_TYPE_KEY,
  PROGRESSIVE_REVEAL_KEY,
  GHOST_HINT_KEY,
  IMMERSIVE_MODE_KEY,
  ALIGNMENT_GRID_KEY,
  GHOST_WHEN_IDLE_KEY,
  EDGE_HIGHLIGHT_KEY,
  CLUSTER_OUTLINE_KEY,
  DELIBERATE_DETACH_KEY,
  RELAXED_MODE_KEY,
  DRIFT_MODE_KEY,
  SNAP_TOLERANCE_OVERRIDE_KEY,
} from "../playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

function getBool(key: string, defaultValue: boolean): boolean {
  try {
    const v = safeLocalStorage.getItem(key);
    return v === "true";
  } catch {
    return defaultValue;
  }
}

export function getPlayScreenUIStorageInitial(): {
  pieceLockingEnabled: boolean;
  showGhostHint: boolean;
  showAlignmentGrid: boolean;
  showGhostWhenIdle: boolean;
  showEdgeHighlight: boolean;
  showClusterOutline: boolean;
  deliberateDetachEnabled: boolean;
  relaxedModeEnabled: boolean;
  driftModeEnabled: boolean;
  snapToleranceOverride: number;
  pieceCutType: PieceCutType;
  progressiveRevealMode: boolean;
  immersiveMode: boolean;
} {
  let snapToleranceOverride = 1;
  try {
    const raw = safeLocalStorage.getItem(SNAP_TOLERANCE_OVERRIDE_KEY);
    const parsed = raw != null ? Number(raw) : 1;
    if (Number.isFinite(parsed)) {
      snapToleranceOverride = Math.min(1.6, Math.max(0.6, parsed));
    }
  } catch {
    // keep 1
  }

  let pieceCutType: PieceCutType = "classic";
  try {
    const raw = safeLocalStorage.getItem(CUT_TYPE_KEY);
    if (raw === "irregular" || raw === "hard") pieceCutType = raw;
  } catch {
    // keep classic
  }

  return {
    pieceLockingEnabled: getBool(PIECE_LOCKING_KEY, false),
    showGhostHint: getBool(GHOST_HINT_KEY, false),
    showAlignmentGrid: getBool(ALIGNMENT_GRID_KEY, false),
    showGhostWhenIdle: getBool(GHOST_WHEN_IDLE_KEY, false),
    showEdgeHighlight: getBool(EDGE_HIGHLIGHT_KEY, false),
    showClusterOutline: getBool(CLUSTER_OUTLINE_KEY, false),
    deliberateDetachEnabled: getBool(DELIBERATE_DETACH_KEY, false),
    relaxedModeEnabled: getBool(RELAXED_MODE_KEY, false),
    driftModeEnabled: getBool(DRIFT_MODE_KEY, false),
    snapToleranceOverride,
    pieceCutType,
    progressiveRevealMode: getBool(PROGRESSIVE_REVEAL_KEY, false),
    immersiveMode: getBool(IMMERSIVE_MODE_KEY, false),
  };
}

export const DEBUG_INITIAL: DebugFlags = {
  showGrid: false,
  showBounds: false,
  showIds: false,
  showPerfOverlay: false,
};
