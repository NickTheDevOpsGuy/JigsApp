import type { MutableRefObject } from "react";
import type { GridSize, Piece, PieceCutType, PuzzleState } from "./types";

export type PuzzleManagerOptions = {
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;
  grid: GridSize;
  correctEpsilonPx?: number;
  pieceWidth: number;
  pieceHeight: number;
  pad?: number;
  scatterPadding?: number;
  scatterStartYRatio?: number;
  snapToleranceBoardPx?: number;
  snapToleranceNeighborPx?: number;
  snapScaleRef?: MutableRefObject<number>;
  relaxedToleranceMultiplierRef?: MutableRefObject<number>;
  snapToleranceOverrideRef?: MutableRefObject<number>;
  dynamicDifficultyMultiplierRef?: MutableRefObject<number>;
  rotationStepDeg?: 90 | 180;
  isMobile?: boolean;
  cutType?: PieceCutType;
  targetStartX?: number;
  targetStartY?: number;
  boardInset?: number;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  onPieceSnapped?: (
    pieceIds: string[],
    center?: { x: number; y: number },
    precisionPx?: number,
  ) => void;
  onPieceLocked?: (pieceIds: string[]) => void;
  onPuzzleComplete?: (state: PuzzleState) => void;
  onSnapCheck?: () => void;
  onWrongRotationHint?: (groupId: string, pieceIds: string[]) => void;
};
