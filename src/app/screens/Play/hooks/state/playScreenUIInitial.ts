/**
 * Load play screen UI preferences from localStorage (for usePlayScreenUI initial state).
 */
import type { PieceCutType } from "@/puzzle/core/types";
import type { DebugFlags } from "@/screens/Play/core/utils/playScreenUtils";
import {
  PIECE_LOCKING_KEY,
  PIECE_LOCKING_EXPLICIT_KEY,
  AUTO_ROTATE_ON_SNAP_KEY,
  MAGNETIC_SNAP_KEY,
  SNAP_GLOW_KEY,
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
  ZEN_MODE_KEY,
  MYSTERY_MODE_KEY,
  PRECISION_MODE_KEY,
  DYNAMIC_DIFFICULTY_KEY,
  ADAPTIVE_PERSONALITY_KEY,
  MINIMAP_VISIBLE_KEY,
  MINIMAP_POSITION_KEY,
  UNDO_REDO_ENABLED_KEY,
} from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

function getBool(key: string, defaultValue: boolean): boolean {
  try {
    const v = safeLocalStorage.getItem(key);
    if (v == null) return defaultValue;
    if (v === "true") return true;
    if (v === "false") return false;
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

function getPieceLockingInitial(): boolean {
  try {
    const explicit = safeLocalStorage.getItem(PIECE_LOCKING_EXPLICIT_KEY);
    const raw = safeLocalStorage.getItem(PIECE_LOCKING_KEY);

    // Migration guard:
    // If preference was never explicitly set by user, default lock-on-snap to true
    // even if a stale "false" value exists from older buggy/default behavior.
    if (explicit == null || explicit === "false" || explicit === "0") {
      return true;
    }
    if (raw === "true") return true;
    if (raw === "false") return false;
    return true;
  } catch {
    return true;
  }
}

export function getPlayScreenUIStorageInitial(): {
  pieceLockingEnabled: boolean;
  autoRotateOnSnap: boolean;
  magneticSnapEnabled: boolean;
  snapGlowEnabled: boolean;
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
  zenModeEnabled: boolean;
  mysteryModeEnabled: boolean;
  precisionModeEnabled: boolean;
  dynamicDifficultyEnabled: boolean;
  adaptivePersonalityEnabled: boolean;
  minimapVisible: boolean;
  minimapPosition: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  undoRedoEnabled: boolean;
} {
  let snapToleranceOverride = 0.9;
  try {
    const raw = safeLocalStorage.getItem(SNAP_TOLERANCE_OVERRIDE_KEY);
    const parsed = raw != null ? Number(raw) : 0.9;
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
    pieceLockingEnabled: getPieceLockingInitial(),
    autoRotateOnSnap: getBool(AUTO_ROTATE_ON_SNAP_KEY, true),
    magneticSnapEnabled: getBool(MAGNETIC_SNAP_KEY, true),
    snapGlowEnabled: getBool(SNAP_GLOW_KEY, true),
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
    zenModeEnabled: getBool(ZEN_MODE_KEY, false),
    mysteryModeEnabled: getBool(MYSTERY_MODE_KEY, false),
    precisionModeEnabled: getBool(PRECISION_MODE_KEY, false),
    dynamicDifficultyEnabled: getBool(DYNAMIC_DIFFICULTY_KEY, false),
    adaptivePersonalityEnabled: getBool(ADAPTIVE_PERSONALITY_KEY, false),
    minimapVisible: getBool(MINIMAP_VISIBLE_KEY, true),
    undoRedoEnabled: getBool(UNDO_REDO_ENABLED_KEY, true),
    minimapPosition: (() => {
      try {
        const v = safeLocalStorage.getItem(MINIMAP_POSITION_KEY);
        if (v === "bottom-right" || v === "top-left" || v === "top-right") return v;
      } catch {
        /* ignore */
      }
      return "bottom-left";
    })(),
  };
}

export const DEBUG_INITIAL: DebugFlags = {
  showGrid: false,
  showBounds: false,
  showIds: false,
  showPerfOverlay: false,
  showSilhouette: false,
};
