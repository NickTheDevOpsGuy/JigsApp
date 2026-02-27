/**
 * usePlayScreenUIPersistence – syncs Play UI options to localStorage.
 */
import { useEffect } from "react";
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

export function usePlayScreenUIPersistence(state: {
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
  pieceCutType: string;
  progressiveRevealMode: boolean;
  immersiveMode: boolean;
}) {
  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        PIECE_LOCKING_KEY,
        state.pieceLockingEnabled ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.pieceLockingEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(GHOST_HINT_KEY, state.showGhostHint ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [state.showGhostHint]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        ALIGNMENT_GRID_KEY,
        state.showAlignmentGrid ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.showAlignmentGrid]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        GHOST_WHEN_IDLE_KEY,
        state.showGhostWhenIdle ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.showGhostWhenIdle]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        EDGE_HIGHLIGHT_KEY,
        state.showEdgeHighlight ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.showEdgeHighlight]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        CLUSTER_OUTLINE_KEY,
        state.showClusterOutline ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.showClusterOutline]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        DELIBERATE_DETACH_KEY,
        state.deliberateDetachEnabled ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.deliberateDetachEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        RELAXED_MODE_KEY,
        state.relaxedModeEnabled ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.relaxedModeEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(DRIFT_MODE_KEY, state.driftModeEnabled ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [state.driftModeEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        SNAP_TOLERANCE_OVERRIDE_KEY,
        String(state.snapToleranceOverride),
      );
    } catch {
      /* ignore */
    }
  }, [state.snapToleranceOverride]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(CUT_TYPE_KEY, state.pieceCutType);
    } catch {
      /* ignore */
    }
  }, [state.pieceCutType]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        PROGRESSIVE_REVEAL_KEY,
        state.progressiveRevealMode ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.progressiveRevealMode]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        IMMERSIVE_MODE_KEY,
        state.immersiveMode ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.immersiveMode]);
}
