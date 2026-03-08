import { easeGravityDrop } from "@/puzzle/canvas/renderBoardHelpers";
import type { PuzzleState } from "@/puzzle/types";
import type { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PerfStats } from "../components/ProfilerOverlay";
import type { MutableRefObject, RefObject } from "react";
import {
  DRAG_LERP,
  LOCK_LERP_MS,
  LOCK_LIFT_MAX_PX,
  MAGNETIC_PULL_STRENGTH,
} from "./usePlayScreenAnimationConstants";
import { logger } from "@/utils/logger";

export function updatePerfStats(
  st: PuzzleState,
  now: number,
  dt: number,
  debugShowPerfOverlay: boolean,
  perfStatsRef: RefObject<PerfStats | null> | undefined,
  perfFrameTimesRef: MutableRefObject<number[]>,
  perfDrawCountRef: MutableRefObject<number>,
  perfLastSecRef: MutableRefObject<number>,
) {
  const showPerf = debugShowPerfOverlay && perfStatsRef?.current;
  if (!showPerf) return;

  const times = perfFrameTimesRef.current;
  if (dt > 0) {
    times.push(dt);
    if (times.length > 60) times.shift();
  }
  perfDrawCountRef.current += 1;
  const activeGroups = new Set(st.pieces.filter((p) => !p.inTray).map((p) => p.groupId)).size;
  const elapsed = now - perfLastSecRef.current;
  if (elapsed >= 1000) {
    const stats = perfStatsRef.current!;
    const avg = times.length ? times.reduce((a, t) => a + t, 0) / times.length : 0;
    stats.fps = avg > 0 ? Math.round(1000 / avg) : 0;
    stats.drawsPerSec = perfDrawCountRef.current;
    stats.activeGroups = activeGroups;
    stats.snapChecksPerSec = stats.snapCheckCount;
    stats.snapCheckCount = 0;
    perfDrawCountRef.current = 0;
    perfLastSecRef.current = now;
  } else {
    perfStatsRef.current!.activeGroups = activeGroups;
  }
}

export function updateDragDisplayOverrides(args: {
  st: PuzzleState;
  dragState: ReturnType<PuzzleManager["getDragState"]>;
  reducedMotion: boolean;
  magneticSnapEnabled: boolean;
  manager: PuzzleManager | null;
  dragDisplayRef: MutableRefObject<Map<string, { x: number; y: number }>>;
  lastPiecePositionsRef: MutableRefObject<Map<string, { x: number; y: number }>>;
}) {
  const {
    st,
    dragState,
    reducedMotion,
    magneticSnapEnabled,
    manager,
    dragDisplayRef,
    lastPiecePositionsRef,
  } =
    args;
  const isDragging = dragState.activeId != null;
  const draggedGroupId = dragState.activeId
    ? (st.pieces.find((p) => p.id === dragState.activeId)?.groupId ?? null)
    : null;
  const dragDisplayOverrides = dragDisplayRef.current;

  if (isDragging && draggedGroupId) {
    const groupPieces = st.pieces.filter((p) => !p.inTray && p.groupId === draggedGroupId);
    const snapPreview = manager?.getSnapPreviewState() ?? null;
    let groupDeltaX = 0;
    let groupDeltaY = 0;
    let magneticProximity = 0;
    if (
      magneticSnapEnabled &&
      !reducedMotion &&
      snapPreview &&
      (snapPreview.inSnapRange || snapPreview.nearSnap) &&
      snapPreview.proximity > 0
    ) {
      const activePiece = groupPieces.find((p) => p.id === dragState.activeId);
      if (activePiece) {
        groupDeltaX = activePiece.targetX - activePiece.pad - activePiece.x;
        groupDeltaY = activePiece.targetY - activePiece.pad - activePiece.y;
        magneticProximity = snapPreview.proximity;
      }
    }
    for (const p of groupPieces) {
      let pos = dragDisplayOverrides.get(p.id);
      if (!pos) {
        pos = { x: p.x, y: p.y };
        dragDisplayOverrides.set(p.id, pos);
      }
      pos.x += (p.x - pos.x) * DRAG_LERP;
      pos.y += (p.y - pos.y) * DRAG_LERP;
      if (magneticProximity > 0) {
        pos.x += groupDeltaX * MAGNETIC_PULL_STRENGTH * magneticProximity;
        pos.y += groupDeltaY * MAGNETIC_PULL_STRENGTH * magneticProximity;
      }
    }
  } else if (dragDisplayOverrides.size > 0) {
    for (const [id, pos] of dragDisplayOverrides) {
      lastPiecePositionsRef.current.set(id, { x: pos.x, y: pos.y });
    }
    dragDisplayOverrides.clear();
  }

  return { isDragging, draggedGroupId, dragDisplayOverrides };
}

export function buildLockLerpOverrides(args: {
  st: PuzzleState;
  now: number;
  isDragging: boolean;
  reducedMotion: boolean;
  lockMap: Map<string, number>;
  assembledW: number;
  assembledH: number;
  lastPiecePositionsRef: MutableRefObject<Map<string, { x: number; y: number }>>;
}) {
  const { st, now, isDragging, reducedMotion, lockMap, assembledW, assembledH, lastPiecePositionsRef } =
    args;
  let lockLerpOverrides: Map<string, { x: number; y: number }> | undefined;
  if (!isDragging && !reducedMotion) {
    const lastPos = lastPiecePositionsRef.current;
    const maxTravel = Math.max(assembledW, assembledH) * 1.5;
    for (const p of st.pieces) {
      if (p.inTray) continue;
      const lockAt = lockMap.get(p.id);
      if (lockAt == null) continue;
      const elapsed = now - lockAt;
      if (elapsed >= LOCK_LERP_MS) continue;
      const from = lastPos.get(p.id);
      if (from == null) continue;
      const dx = p.x - from.x;
      const dy = p.y - from.y;
      if (Math.hypot(dx, dy) > maxTravel) continue;
      const t = Math.min(1, elapsed / LOCK_LERP_MS);
      const easeX = 1 - (1 - t) ** 4;
      const easeY = easeGravityDrop(t);
      const liftPx = Math.min(LOCK_LIFT_MAX_PX, Math.max(4, p.h * 0.08));
      const liftOffset = liftPx * (1 - t) ** 2;
      const lerpX = from.x + dx * easeX;
      const lerpY = from.y + dy * easeY - liftOffset;
      const minY = Math.min(from.y, p.y) - liftPx;
      const maxY = Math.max(from.y, p.y);
      lockLerpOverrides ??= new Map();
      lockLerpOverrides.set(p.id, {
        x: Math.min(Math.max(lerpX, Math.min(from.x, p.x)), Math.max(from.x, p.x)),
        y: Math.min(Math.max(lerpY, minY), maxY),
      });
    }
  }
  return lockLerpOverrides;
}

export function updateLastPiecePositions(args: {
  st: PuzzleState;
  now: number;
  isDragging: boolean;
  draggedGroupId: string | null;
  dragDisplayOverrides: Map<string, { x: number; y: number }>;
  lockMap: Map<string, number>;
  lastPiecePositionsRef: MutableRefObject<Map<string, { x: number; y: number }>>;
}) {
  const { st, now, isDragging, draggedGroupId, dragDisplayOverrides, lockMap, lastPiecePositionsRef } =
    args;
  for (const p of st.pieces) {
    if (p.inTray) continue;
    const lockAt = lockMap.get(p.id);
    if (lockAt != null && now - lockAt < LOCK_LERP_MS) continue;
    const pos =
      isDragging && draggedGroupId && p.groupId === draggedGroupId && dragDisplayOverrides.has(p.id)
        ? dragDisplayOverrides.get(p.id)!
        : { x: p.x, y: p.y };
    lastPiecePositionsRef.current.set(p.id, { x: pos.x, y: pos.y });
  }
}

export function updateDebugFps(args: {
  showDebug: boolean;
  dt: number;
  now: number;
  isDragging: boolean;
  pieceCount: number;
  fpsFrameTimesRef: MutableRefObject<number[]>;
  fpsLogIntervalRef: MutableRefObject<number>;
}) {
  const { showDebug, dt, isDragging, pieceCount, fpsFrameTimesRef, fpsLogIntervalRef } =
    args;
  if (!showDebug) return;
  performance.mark("render-frame-start");
  const times = fpsFrameTimesRef.current;
  if (dt > 0) {
    times.push(dt);
    if (times.length > 60) times.shift();
  }
  fpsLogIntervalRef.current += dt;
  if (fpsLogIntervalRef.current < 2000) return;
  fpsLogIntervalRef.current = 0;
  const avg = times.length ? times.reduce((a, t) => a + t, 0) / times.length : 0;
  const fps = avg > 0 ? Math.round(1000 / avg) : 0;
  if (import.meta.env.DEV) {
    logger.warn(
      `[Phuzzle] FPS: ~${fps} (drag: ${isDragging ? "yes" : "no"}, pieces: ${pieceCount})`,
    );
  }
}

export function shouldPublishState(
  st: PuzzleState,
  lastCompleteRef: MutableRefObject<boolean>,
  lastPieceCountRef: MutableRefObject<number>,
): boolean {
  const currentPlacedCount = st.pieces.filter((p) => p.isPlaced).length;
  const changed =
    st.isComplete !== lastCompleteRef.current || currentPlacedCount !== lastPieceCountRef.current;
  if (changed) {
    lastCompleteRef.current = st.isComplete;
    lastPieceCountRef.current = currentPlacedCount;
  }
  return changed;
}

export function prepareCanvasForRender(
  canvas: HTMLCanvasElement,
  boardEl: HTMLDivElement,
  reducedQuality: boolean,
) {
  const rect = boardEl.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));
  const nativeDpr = window.devicePixelRatio || 1;
  const maxDpr = reducedQuality ? 1.5 : 2;
  let dpr = Math.min(nativeDpr, maxDpr);
  const pixelBudget = reducedQuality ? 2_100_000 : 2_800_000;
  const projectedPixels = cssW * cssH * dpr * dpr;
  if (projectedPixels > pixelBudget) {
    dpr = Math.sqrt(pixelBudget / Math.max(1, cssW * cssH));
  }
  dpr = Math.max(1, Math.min(dpr, maxDpr));

  const targetW = Math.floor(cssW * dpr);
  const targetH = Math.floor(cssH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = reducedQuality ? "medium" : "high";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, cssW, cssH, dpr };
}
