/**
 * usePlayScreenUIPersistence – syncs Play UI options to localStorage.
 */
import { useEffect } from "react";
import {
  PIECE_LOCKING_KEY,
  AUTO_ROTATE_ON_SNAP_KEY,
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
} from "../playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export function usePlayScreenUIPersistence(state: {
  pieceLockingEnabled: boolean;
  autoRotateOnSnap: boolean;
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
  zenModeEnabled: boolean;
  mysteryModeEnabled: boolean;
  precisionModeEnabled: boolean;
  dynamicDifficultyEnabled: boolean;
  adaptivePersonalityEnabled: boolean;
  minimapVisible: boolean;
  minimapPosition: string;
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
      safeLocalStorage.setItem(
        AUTO_ROTATE_ON_SNAP_KEY,
        state.autoRotateOnSnap ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.autoRotateOnSnap]);

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

  useEffect(() => {
    try {
      safeLocalStorage.setItem(ZEN_MODE_KEY, state.zenModeEnabled ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [state.zenModeEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        MYSTERY_MODE_KEY,
        state.mysteryModeEnabled ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.mysteryModeEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        PRECISION_MODE_KEY,
        state.precisionModeEnabled ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.precisionModeEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        DYNAMIC_DIFFICULTY_KEY,
        state.dynamicDifficultyEnabled ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.dynamicDifficultyEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        ADAPTIVE_PERSONALITY_KEY,
        state.adaptivePersonalityEnabled ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.adaptivePersonalityEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        MINIMAP_VISIBLE_KEY,
        state.minimapVisible ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [state.minimapVisible]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(MINIMAP_POSITION_KEY, state.minimapPosition);
    } catch {
      /* ignore */
    }
  }, [state.minimapPosition]);
}
