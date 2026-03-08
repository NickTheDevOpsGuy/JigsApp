import { useRef } from "react";

export function usePlayScreenAnimationRefs() {
  const rafRef = useRef<number | null>(null);
  const completedAtRef = useRef<number | null>(null);
  const pieceCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const lastCompleteRef = useRef<boolean>(false);
  const lastPieceCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsFrameTimesRef = useRef<number[]>([]);
  const fpsLogIntervalRef = useRef<number>(0);
  const dragDisplayRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const lastPiecePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const perfFrameTimesRef = useRef<number[]>([]);
  const perfDrawCountRef = useRef(0);
  const perfLastSecRef = useRef(0);

  return {
    rafRef,
    completedAtRef,
    pieceCacheRef,
    lastCompleteRef,
    lastPieceCountRef,
    lastFrameTimeRef,
    fpsFrameTimesRef,
    fpsLogIntervalRef,
    dragDisplayRef,
    lastPiecePositionsRef,
    perfFrameTimesRef,
    perfDrawCountRef,
    perfLastSecRef,
  };
}

