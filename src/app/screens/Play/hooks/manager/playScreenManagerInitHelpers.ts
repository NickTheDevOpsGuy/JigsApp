import { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type React from "react";
import { BOARD_INSET_PX } from "@/puzzle/manager/state/puzzleManagerUtils";
import { clearPuzzleState, type SavedPiece } from "@/puzzle/storage/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { logger } from "@/utils/logger";
import { CUT_TYPE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { createPlayScreenManagerEvents } from "@/screens/Play/hooks/manager/playScreenManagerEvents";
import type { PieceCutType } from "@/puzzle/core/types";

export function deriveBoardLayout(
  rectW: number,
  rectH: number,
  grid: { rows: number; cols: number },
  img: HTMLImageElement,
) {
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const isMobile = viewportW < 600;
  const cutTypeRaw = safeLocalStorage.getItem(CUT_TYPE_KEY);
  const cutType: PieceCutType =
    cutTypeRaw === "irregular" || cutTypeRaw === "hard" ? cutTypeRaw : "classic";
  const cutDepthPct = cutType === "irregular" ? 0.2 : cutType === "hard" ? 0.12 : 0.17;

  const boardW = rectW;
  const boardH = rectH;
  const tileAspect =
    (img.naturalWidth * grid.rows) / Math.max(1, img.naturalHeight * grid.cols);

  const fitTileSizeAtInset = (inset: number) => {
    const innerW = Math.max(1, boardW - 2 * inset);
    const innerH = Math.max(1, boardH - 2 * inset);
    const maxPieceWByWidth = Math.max(1, Math.floor(innerW / grid.cols));
    const maxPieceHByHeight = Math.max(1, Math.floor(innerH / grid.rows));
    let pieceWidth = maxPieceWByWidth;
    let pieceHeight = Math.max(1, Math.floor(pieceWidth / tileAspect));
    if (pieceHeight * grid.rows > innerH) {
      pieceHeight = maxPieceHByHeight;
      pieceWidth = Math.max(1, Math.floor(pieceHeight * tileAspect));
    }
    pieceWidth = Math.max(1, Math.min(pieceWidth, maxPieceWByWidth));
    pieceHeight = Math.max(1, Math.min(pieceHeight, maxPieceHByHeight));
    return { pieceWidth, pieceHeight };
  };

  let { pieceWidth, pieceHeight } = fitTileSizeAtInset(BOARD_INSET_PX);
  const padReserve = Math.max(
    18,
    Math.min(34, Math.ceil(Math.min(pieceWidth, pieceHeight) * cutDepthPct)),
  );
  const effectiveInset = BOARD_INSET_PX + padReserve;
  ({ pieceWidth, pieceHeight } = fitTileSizeAtInset(effectiveInset));

  const innerW = Math.max(1, boardW - 2 * effectiveInset);
  const innerH = Math.max(1, boardH - 2 * effectiveInset);
  const targetStartX = Math.round(effectiveInset + (innerW - grid.cols * pieceWidth) / 2);
  const targetStartY = Math.round(
    effectiveInset + (innerH - grid.rows * pieceHeight) / 2,
  );
  const managerBoardInset = Math.max(BOARD_INSET_PX, Math.round(effectiveInset));

  return {
    boardW,
    boardH,
    pieceWidth,
    pieceHeight,
    targetStartX,
    targetStartY,
    managerBoardInset,
    isMobile,
    cutType,
  };
}

export function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function maybeRestoreManagerState(
  manager: PuzzleManager,
  hasSavedGame: boolean,
  savedState: { pieces: SavedPiece[] } | null,
  resumeChoice: "resume" | "fresh" | null,
  initialSessionPieces: SavedPiece[] | undefined,
) {
  if (hasSavedGame && savedState && resumeChoice === "resume") {
    try {
      manager.restoreFromSaved(savedState.pieces);
    } catch (e) {
      logger.warn("Failed to restore puzzle state, starting fresh:", e);
      clearPuzzleState();
    }
    return;
  }
  if (initialSessionPieces !== undefined && initialSessionPieces.length > 0) {
    try {
      manager.restoreFromSaved(initialSessionPieces);
    } catch (e) {
      logger.warn("Failed to restore session state:", e);
    }
  }
}

export function createManagerWithLayout(args: {
  imageUrl: string;
  grid: { rows: number; cols: number };
  layout: ReturnType<typeof deriveBoardLayout>;
  optionsRef: React.MutableRefObject<
    | {
        snapScaleRef?: React.MutableRefObject<number>;
        dynamicDifficultyMultiplierRef?: React.MutableRefObject<number>;
      }
    | undefined
  >;
  lastInteractionRef: React.MutableRefObject<number>;
  popMapRef: React.MutableRefObject<Map<string, number>>;
  lockMapRef: React.MutableRefObject<Map<string, number>>;
  snapParticlesRef: React.MutableRefObject<
    import("@/puzzle/canvas/utils/renderBoardHelpers").SnapParticle[]
  >;
  placementTimesRef: React.MutableRefObject<number[]>;
  lastStreakAtRef: React.MutableRefObject<number | null>;
  setSnapCombo: React.Dispatch<React.SetStateAction<number>>;
  relaxedToleranceMultiplierRef: React.MutableRefObject<number>;
  snapToleranceOverrideRef: React.MutableRefObject<number>;
  getManager: () => PuzzleManager | null;
}) {
  const events = createPlayScreenManagerEvents({
    grid: args.grid,
    optionsRef: args.optionsRef as never,
    lastInteractionRef: args.lastInteractionRef,
    popMapRef: args.popMapRef,
    lockMapRef: args.lockMapRef,
    snapParticlesRef: args.snapParticlesRef,
    placementTimesRef: args.placementTimesRef,
    lastStreakAtRef: args.lastStreakAtRef,
    setSnapCombo: args.setSnapCombo,
    getManager: args.getManager,
  });

  return new PuzzleManager(
    {
      imageUrl: args.imageUrl,
      boardWidth: args.layout.boardW,
      boardHeight: args.layout.boardH,
      grid: args.grid,
      pieceWidth: args.layout.pieceWidth,
      pieceHeight: args.layout.pieceHeight,
      targetStartX: args.layout.targetStartX,
      targetStartY: args.layout.targetStartY,
      boardInset: args.layout.managerBoardInset,
      isMobile: args.layout.isMobile,
      cutType: args.layout.cutType,
      snapScaleRef: args.optionsRef.current?.snapScaleRef,
      relaxedToleranceMultiplierRef: args.relaxedToleranceMultiplierRef,
      snapToleranceOverrideRef: args.snapToleranceOverrideRef,
      dynamicDifficultyMultiplierRef:
        args.optionsRef.current?.dynamicDifficultyMultiplierRef,
    },
    events,
  );
}
