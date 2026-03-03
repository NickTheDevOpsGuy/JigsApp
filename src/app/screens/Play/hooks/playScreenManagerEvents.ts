/**
 * Play screen manager events: place, snap, lock, wrong-rotation hint, complete.
 * Extracted from usePlayScreenManager to keep the hook file smaller.
 */
import type { MutableRefObject } from "react";
import type { Theme } from "@/hooks/useTheme";
import type { Piece } from "@/puzzle/types";
import type { PuzzleManagerEvents } from "@/puzzle/PuzzleManager";
import type { SnapParticle } from "@/puzzle/canvas/renderBoardHelpers";
import { soundManager } from "@/audio/sounds";
import { getQuadrant } from "../timeMode";

const PLACEMENT_STREAK_MS = 3000;
const STREAK_COOLDOWN_MS = 5000;
const SNAP_COMBO_IDLE_MS = 2500;
const SNAP_PARTICLE_COUNT = 8;

export type PlayScreenManagerEventsDeps = {
  grid: { rows: number; cols: number };
  optionsRef: MutableRefObject<
    | {
        haptic?: (kind: "place" | "snap" | "rotate") => void;
        onPlacementStreak?: () => void;
        onSnapCheck?: () => void;
        wrongRotationHintRef?: MutableRefObject<{
          groupId: string;
          pieceIds: string[];
          triggeredAt: number;
        } | null>;
        dragStartTimeRef?: MutableRefObject<number | null>;
        onPieceSnappedAnalytics?: (timeToSnapMs: number) => void;
        elapsedSecondsRef?: MutableRefObject<number>;
        onQuadrantPlaced?: (quadrant: 0 | 1 | 2 | 3, elapsedSeconds: number) => void;
        batterySaverMode?: boolean;
        themeRef?: MutableRefObject<Theme | undefined>;
        /** Precision Mode: called with snap distance in px (lower = more precise). */
        onPrecisionSnap?: (precisionPx: number) => void;
      }
    | undefined
  >;
  lastInteractionRef: MutableRefObject<number>;
  popMapRef: MutableRefObject<Map<string, number>>;
  lockMapRef: MutableRefObject<Map<string, number>>;
  snapParticlesRef: MutableRefObject<SnapParticle[]>;
  placementTimesRef: MutableRefObject<number[]>;
  lastStreakAtRef: MutableRefObject<number | null>;
  setSnapCombo: (value: number | ((prev: number) => number)) => void;
  getManager: () => { getState(): { pieces: Piece[] } } | null;
};

export function createPlayScreenManagerEvents(
  deps: PlayScreenManagerEventsDeps,
): PuzzleManagerEvents {
  const {
    grid,
    optionsRef,
    lastInteractionRef,
    popMapRef,
    lockMapRef,
    snapParticlesRef,
    placementTimesRef,
    lastStreakAtRef,
    setSnapCombo,
    getManager,
  } = deps;

  return {
    onPiecePlaced: (p) => {
      const now = performance.now();
      const opts = optionsRef.current;
      const startTime = opts?.dragStartTimeRef?.current;
      if (startTime != null && typeof opts?.onPieceSnappedAnalytics === "function") {
        opts.onPieceSnappedAnalytics(Math.round(now - startTime));
      }
      lastInteractionRef.current = now;
      const manager = getManager();
      const groupPieces = manager
        ? manager.getState().pieces.filter((piece) => piece.groupId === p.groupId)
        : [];
      for (const piece of groupPieces) {
        popMapRef.current.set(piece.id, now);
      }
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const particles = snapParticlesRef.current;
      for (let i = 0; i < SNAP_PARTICLE_COUNT; i++) {
        const angle = (i / SNAP_PARTICLE_COUNT) * Math.PI * 2 + (now % 1);
        const r = 3 + (now % 2);
        particles.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          t0: now,
        });
      }
      const maxAge = 500;
      snapParticlesRef.current = particles.filter((part) => now - part.t0 < maxAge);
      soundManager.play("place");
      opts?.haptic?.("place");
      const elapsed = opts?.elapsedSecondsRef?.current ?? 0;
      const q = getQuadrant(p.row, p.col, grid.rows, grid.cols);
      opts?.onQuadrantPlaced?.(q, elapsed);
      placementTimesRef.current.push(now);
      const cutoff = now - PLACEMENT_STREAK_MS;
      const comboCutoff = now - SNAP_COMBO_IDLE_MS;
      placementTimesRef.current = placementTimesRef.current.filter((t) => t > cutoff);
      const combo = placementTimesRef.current.filter((t) => t > comboCutoff).length;
      setSnapCombo(combo);
      if (
        placementTimesRef.current.length >= 3 &&
        (lastStreakAtRef.current == null ||
          now - lastStreakAtRef.current > STREAK_COOLDOWN_MS)
      ) {
        lastStreakAtRef.current = now;
        opts?.onPlacementStreak?.();
      }
    },
    onPieceSnapped: (pieceIds, center, precisionPx) => {
      const now = performance.now();
      const opts = optionsRef.current;
      const startTime = opts?.dragStartTimeRef?.current;
      if (startTime != null && typeof opts?.onPieceSnappedAnalytics === "function") {
        opts.onPieceSnappedAnalytics(Math.round(now - startTime));
      }
      if (typeof precisionPx === "number") opts?.onPrecisionSnap?.(precisionPx);
      lastInteractionRef.current = now;
      soundManager.play("snap", { groupSize: pieceIds.length });
      opts?.haptic?.("snap");
      for (const id of pieceIds) popMapRef.current.set(id, now);
      if (center) {
        const particles = snapParticlesRef.current;
        for (let i = 0; i < SNAP_PARTICLE_COUNT; i++) {
          const angle = (i / SNAP_PARTICLE_COUNT) * Math.PI * 2 + (now % 1);
          const r = 4 + (now % 3);
          particles.push({
            x: center.x + Math.cos(angle) * r,
            y: center.y + Math.sin(angle) * r,
            t0: now,
          });
        }
        const maxAge = 500;
        snapParticlesRef.current = particles.filter((p) => now - p.t0 < maxAge);
      }
    },
    onPieceLocked: (ids) => {
      const now = performance.now();
      for (const id of ids) lockMapRef.current.set(id, now);
    },
    onSnapCheck: () => optionsRef.current?.onSnapCheck?.(),
    onWrongRotationHint: (groupId, pieceIds) => {
      const ref = optionsRef.current?.wrongRotationHintRef;
      if (!ref) return;
      const now = performance.now();
      const cur = ref.current;
      if (cur && now - cur.triggeredAt < 5000) return;
      ref.current = { groupId, pieceIds, triggeredAt: now };
    },
    onPuzzleComplete: () => {
      placementTimesRef.current = [];
      setSnapCombo(0);
      soundManager.play("complete");
    },
  };
}
