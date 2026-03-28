import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { PuzzleState } from "@/puzzle/core/types";
import { useViewport } from "@/screens/Play/hooks/viewport/useViewport";
import { prefersReducedMotion } from "@/screens/Play/hooks/viewport/viewportMath";
import {
  boardPointToBoardLocalCss,
  buildPlacementAssistTarget,
  centroidOfDraggedGroup,
} from "@/screens/Play/hooks/viewport/viewportPlacementAssist";

const ASSIST_INTERVAL_MS = 260;
/** Max scale relative to viewport at drag start (subtle zoom). */
const MAX_SCALE_VS_DRAG_START = 1.07;
const SCALE_MULTIPLIER_PER_NUDGE = 1.028;
const LERP = 0.38;

type ViewportApi = ReturnType<typeof useViewport>;

/**
 * While dragging pieces on the board, gently zoom/pan toward the active group so the
 * placement area stays readable. Restores the pre-drag viewport when the drag ends.
 */
export function usePlacementAssistViewport(args: {
  enabled: boolean;
  manager: PuzzleManager | null;
  state: PuzzleState | null;
  boardRef: RefObject<HTMLDivElement | null>;
  viewportApi: ViewportApi;
  getBounds: () => {
    contentW: number;
    contentH: number;
    containerW: number;
    containerH: number;
  } | null;
  isDraggingBoard: boolean;
  isPaused: boolean;
  replayBarOpen: boolean;
}) {
  const {
    enabled,
    manager,
    state,
    boardRef,
    viewportApi,
    getBounds,
    isDraggingBoard,
    isPaused,
    replayBarOpen,
  } = args;

  const snapshotRef = useRef<{ scale: number; panX: number; panY: number } | null>(null);
  const assistAppliedRef = useRef(false);
  const prevDraggingRef = useRef(false);
  const lastFocalRef = useRef<{ x: number; y: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const viewportApiRef = useRef(viewportApi);
  viewportApiRef.current = viewportApi;

  /* Drag start / end: snapshot & restore */
  useEffect(() => {
    const was = prevDraggingRef.current;
    prevDraggingRef.current = isDraggingBoard;
    const api = viewportApiRef.current;

    if (isDraggingBoard && !was) {
      snapshotRef.current = { ...api.viewport };
      assistAppliedRef.current = false;
      lastFocalRef.current = null;
    }

    if (!isDraggingBoard && was) {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (assistAppliedRef.current && snapshotRef.current) {
        if (prefersReducedMotion()) {
          api.setViewport(snapshotRef.current);
        } else {
          api.animateTo(snapshotRef.current, 280);
        }
      }
      snapshotRef.current = null;
      assistAppliedRef.current = false;
      lastFocalRef.current = null;
    }
  }, [isDraggingBoard]);

  /* Periodic assist while dragging */
  useEffect(() => {
    if (
      !enabled ||
      prefersReducedMotion() ||
      !isDraggingBoard ||
      !manager ||
      !state ||
      state.isComplete ||
      isPaused ||
      replayBarOpen
    ) {
      return;
    }

    const runAssist = () => {
      const api = viewportApiRef.current;
      if (api.isPanning() || api.isPinching()) return;

      const drag = manager.getDragState();
      if (!drag.activeId) return;

      const st = manager.getState();
      const centroid = centroidOfDraggedGroup(st.pieces, drag.activeId);
      if (!centroid) return;

      const boardEl = boardRef.current;
      if (!boardEl) return;
      const r = boardEl.getBoundingClientRect();
      const cssW = r.width;
      const cssH = r.height;
      if (cssW <= 0 || cssH <= 0) return;

      const last = lastFocalRef.current;
      if (last) {
        const dx = centroid.x - last.x;
        const dy = centroid.y - last.y;
        if (dx * dx + dy * dy < 12 * 12) return;
      }
      lastFocalRef.current = { x: centroid.x, y: centroid.y };

      const snap = snapshotRef.current;
      if (!snap) return;

      const focalCss = boardPointToBoardLocalCss(
        centroid.x,
        centroid.y,
        st.pieces,
        st.grid,
        cssW,
        cssH,
        api.viewport,
      );
      if (!focalCss) return;

      const bounds = getBounds();

      api.setViewport((prev) => {
        const maxScale = snap.scale * MAX_SCALE_VS_DRAG_START;
        if (prev.scale >= maxScale - 1e-6) return prev;
        const mult = Math.min(SCALE_MULTIPLIER_PER_NUDGE, maxScale / prev.scale);
        if (mult <= 1.0001) return prev;
        const t = buildPlacementAssistTarget(
          prev,
          focalCss.cssX,
          focalCss.cssY,
          bounds,
          mult,
        );
        return {
          scale: prev.scale + (t.scale - prev.scale) * LERP,
          panX: prev.panX + (t.panX - prev.panX) * LERP,
          panY: prev.panY + (t.panY - prev.panY) * LERP,
        };
      });
      assistAppliedRef.current = true;
    };

    intervalRef.current = setInterval(runAssist, ASSIST_INTERVAL_MS);
    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    enabled,
    isDraggingBoard,
    manager,
    state,
    state?.isComplete,
    isPaused,
    replayBarOpen,
    boardRef,
    getBounds,
  ]);
}
