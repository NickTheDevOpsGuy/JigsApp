/**
 * ReplayModal – fast-forward build animation of completed puzzle.
 */
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Play, Pause, X } from "lucide-react";
import styles from "./ReplayModal.module.css";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";

type PlacementEvent = { elapsedMs: number; pieceIds: string[] };

type ReplayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  state: PuzzleState;
  imageUrl: string;
  placementSequence: PlacementEvent[];
};

const REPLAY_SPEED = 4;

export function ReplayModal({
  isOpen,
  onClose,
  state,
  imageUrl,
  placementSequence,
}: ReplayModalProps) {
  const [replayStep, setReplayStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const placedIds = React.useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < replayStep && i < placementSequence.length; i++) {
      for (const id of placementSequence[i].pieceIds) set.add(id);
    }
    return set;
  }, [placementSequence, replayStep]);

  const replayState: PuzzleState = React.useMemo(
    () => ({
      ...state,
      pieces: state.pieces.map((p) => ({
        ...p,
        inTray: !placedIds.has(p.id),
      })),
      placedCount: placedIds.size,
    }),
    [state, placedIds],
  );

  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
    };
    return () => {
      imgRef.current = null;
    };
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (!isPlaying || replayStep >= placementSequence.length) {
      setIsPlaying(false);
      return;
    }
    const start = performance.now();
    const startStep = replayStep;
    const run = (now: number) => {
      const elapsed = (now - start) * REPLAY_SPEED;
      const stepsToAdvance = Math.floor(elapsed / 200);
      const next = Math.min(startStep + stepsToAdvance, placementSequence.length);
      setReplayStep(next);
      if (next < placementSequence.length) {
        animationRef.current = requestAnimationFrame(run);
      } else {
        setIsPlaying(false);
      }
    };
    animationRef.current = requestAnimationFrame(run);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, replayStep, placementSequence.length]);

  useEffect(() => {
    if (!isOpen) return;
    setReplayStep(0);
    setIsPlaying(false);
  }, [isOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || img.naturalWidth === 0) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const first = replayState.pieces[0];
    if (!first) return;
    const assembledW = state.grid.cols * first.tileW;
    const assembledH = state.grid.rows * first.tileH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderBoard(
      ctx,
      replayState,
      img,
      assembledW,
      assembledH,
      new Map(),
      new Map(),
      performance.now(),
      { showGrid: false, showBounds: false, showIds: false },
      undefined,
      {
        draggedGroupId: null,
        hoveredPieceId: null,
        selectedPieceId: null,
        isComplete: false,
        completedAtMs: null,
        showAlignmentGrid: false,
      },
    );
  }, [replayState, state.grid]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Replay</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.canvasWrap}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <div className={styles.controls}>
          <input
            type="range"
            min={0}
            max={Math.max(1, placementSequence.length)}
            value={replayStep}
            onChange={(e) => {
              setReplayStep(Number(e.target.value));
              setIsPlaying(false);
            }}
          />
          <Button
            size="sm"
            onClick={() => setIsPlaying((p) => !p)}
            disabled={replayStep >= placementSequence.length && !isPlaying}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </div>
    </div>
  );
}
