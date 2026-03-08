import type { DragPreview, DragState, Piece, PuzzleState } from "@/puzzle/core/types";
import type { MutableRefObject } from "react";
import type {
  PuzzleManagerEvents,
  PuzzleManagerOptions,
} from "@/puzzle/manager/state/puzzleManagerTypes";
import { createInitialPieces } from "@/puzzle/factories/createInitialPieces";
import { UndoManager } from "@/puzzle/manager/undoManager";
import {
  getUndoLimit,
  type EffectiveToleranceOptions,
} from "@/puzzle/manager/state/puzzleManagerUtils";
import {
  getGroupBounds as getGroupBoundsUtil,
  wouldOverlapAnyOtherGroup as wouldOverlapUtil,
} from "@/puzzle/groups/groupUtils";
import {
  CORRECT_EPSILON_PX,
  derivePlacedAndComplete,
  isPieceCorrect as isPieceCorrectDerived,
} from "@/puzzle/manager/state/puzzleManagerDerivedState";
import {
  bumpGroupZ as bumpGroupZHelper,
  clampGroupDelta as clampGroupDeltaHelper,
  clampGroupInsideBoardInterior as clampGroupInsideBoardInteriorHelper,
  setGroupToExactTargetPositions as setGroupToExactTargetPositionsHelper,
  shiftGroupUnclamped as shiftGroupUnclampedHelper,
} from "@/puzzle/manager/state/puzzleManagerGroupHelpers";
import { clampAllBoardGroupsInsideBoardInteriorHelper } from "./puzzleManagerEngineStateHelpers";

export class PuzzleManagerState {
  protected state: PuzzleState;
  protected drag: DragState;
  protected zCounter: number;
  protected events: PuzzleManagerEvents;

  protected readonly undoManager: UndoManager;
  protected boardWidth: number;
  protected boardHeight: number;
  protected snapToleranceBoardPx: number;
  protected snapToleranceNeighborPx: number;
  protected snapScaleRef: MutableRefObject<number> | undefined;
  protected relaxedToleranceMultiplierRef: MutableRefObject<number> | undefined;
  protected snapToleranceOverrideRef: MutableRefObject<number> | undefined;
  protected dynamicDifficultyMultiplierRef: MutableRefObject<number> | undefined;
  protected isMobile: boolean;
  protected scatterStartYRatio: number;
  protected rotationStepDeg: 90 | 180;
  protected pieceLockingEnabled = true;
  protected autoRotateOnSnap = true;
  protected pad: number;
  protected tileW: number;
  protected tileH: number;
  protected readonly targetStartX: number;
  protected readonly targetStartY: number;
  protected readonly boardInset: number;

  constructor(options: PuzzleManagerOptions, events: PuzzleManagerEvents = {}) {
    const {
      imageUrl,
      boardWidth,
      boardHeight,
      grid,
      pieceWidth,
      pieceHeight,
      scatterPadding = 16,
      pad = 18,
      snapToleranceBoardPx = 40,
      snapToleranceNeighborPx = 56,
      snapScaleRef,
      relaxedToleranceMultiplierRef,
      snapToleranceOverrideRef,
      scatterStartYRatio = 0.3,
      rotationStepDeg = 90,
      isMobile = false,
      targetStartX = 0,
      targetStartY = 0,
      boardInset = 0,
    } = options;

    this.targetStartX = targetStartX;
    this.targetStartY = targetStartY;
    this.boardInset = boardInset;
    this.relaxedToleranceMultiplierRef = relaxedToleranceMultiplierRef;
    this.events = events;
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.snapToleranceBoardPx = snapToleranceBoardPx;
    this.snapToleranceNeighborPx = snapToleranceNeighborPx;
    this.snapScaleRef = snapScaleRef;
    this.isMobile = isMobile;
    this.snapToleranceOverrideRef = snapToleranceOverrideRef;
    this.dynamicDifficultyMultiplierRef = options.dynamicDifficultyMultiplierRef;
    this.scatterStartYRatio = scatterStartYRatio;
    this.rotationStepDeg = rotationStepDeg;

    const cutType = options.cutType ?? "classic";
    const depthPct = cutType === "irregular" ? 0.26 : cutType === "hard" ? 0.14 : 0.22;
    const minPad = Math.ceil(Math.min(pieceWidth, pieceHeight) * depthPct);
    this.pad = Math.max(pad, minPad);
    this.tileW = pieceWidth;
    this.tileH = pieceHeight;
    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.zCounter = 10;

    const pieces = createInitialPieces({
      grid,
      boardWidth,
      boardHeight,
      scatterPadding,
      pad: this.pad,
      tileW: pieceWidth,
      tileH: pieceHeight,
      scatterStartYRatio,
      rotationStepDeg,
      targetStartX: this.targetStartX,
      targetStartY: this.targetStartY,
      boardInset: this.boardInset,
      isMobile,
      cutType,
    });

    this.state = {
      imageUrl,
      grid,
      pieces,
      placedCount: 0,
      totalCount: pieces.length,
      isComplete: false,
    };

    this.undoManager = new UndoManager(getUndoLimit(pieces.length));
    this.syncZCounterFromPieces();
    this.recomputeDerivedState();
  }

  protected isPieceCorrect(p: Piece) {
    const tile = this.tilePos(p);
    return isPieceCorrectDerived(p, tile, CORRECT_EPSILON_PX);
  }

  protected recomputeDerivedState() {
    const allPieces = this.state.pieces;
    if (allPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    const { placedCount, isComplete, boardPieces } = derivePlacedAndComplete(
      this.state,
      this.pieceLockingEnabled,
      (piece) => this.isPieceCorrect(piece),
    );

    if (boardPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    const prevComplete = this.state.isComplete;
    this.state = { ...this.state, placedCount, isComplete };
    if (!prevComplete && isComplete) {
      const ref = boardPieces[0];
      this.setGroupToExactTargetPositions(ref.groupId);
      this.updatePieces(
        () => true,
        () => ({ isPlaced: true }),
      );
      this.events.onPuzzleComplete?.(this.state);
    }
  }

  protected updatePieces(
    predicate: (p: Piece) => boolean,
    updater: (p: Piece) => Partial<Piece>,
  ) {
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => (predicate(p) ? { ...p, ...updater(p) } : p)),
    };
  }

  protected replacePieces(newPieces: Piece[]) {
    this.state = { ...this.state, pieces: newPieces };
  }

  protected syncZCounterFromPieces() {
    const maxPieceZ = this.state.pieces.reduce((max, p) => Math.max(max, p.z), 0);
    this.zCounter = Math.max(this.zCounter, maxPieceZ);
  }

  protected getToleranceOptions(): EffectiveToleranceOptions {
    return {
      snapScaleRef: this.snapScaleRef,
      relaxedToleranceMultiplierRef: this.relaxedToleranceMultiplierRef,
      snapToleranceOverrideRef: this.snapToleranceOverrideRef,
      dynamicDifficultyMultiplierRef: this.dynamicDifficultyMultiplierRef,
      isMobile: this.isMobile,
    };
  }

  protected tilePos(p: Piece) {
    return { x: p.x + p.pad, y: p.y + p.pad };
  }

  protected getGroupPieces(groupId: string): Piece[] {
    return this.state.pieces.filter((p) => p.groupId === groupId);
  }

  protected isGroupLocked(groupId: string): boolean {
    return this.state.pieces.some((p) => p.groupId === groupId && p.locked);
  }

  protected shiftGroupUnclamped(groupId: string, dx: number, dy: number) {
    shiftGroupUnclampedHelper(this.updatePieces.bind(this), groupId, dx, dy);
  }

  protected setGroupToExactTargetPositions(groupId: string): void {
    setGroupToExactTargetPositionsHelper(this.updatePieces.bind(this), groupId);
  }

  protected bumpGroupZ(groupId: string): void {
    this.zCounter = bumpGroupZHelper(
      this.state.pieces,
      this.zCounter,
      this.updatePieces.bind(this),
      groupId,
    );
  }

  protected getGroupBounds(groupId: string) {
    return getGroupBoundsUtil(this.state.pieces, groupId);
  }

  protected static readonly SOFT_CLAMP_OVERFLOW = 0;

  protected getSoftClampOverflow(): number {
    return PuzzleManagerState.SOFT_CLAMP_OVERFLOW;
  }

  protected clampGroupDelta(groupId: string, dx: number, dy: number) {
    const b = this.getGroupBounds(groupId);
    return clampGroupDeltaHelper(
      b,
      dx,
      dy,
      this.boardWidth,
      this.boardHeight,
      this.pad,
      this.getSoftClampOverflow(),
    );
  }

  protected clampGroupInsideBoardInterior(groupId: string) {
    const bounds = this.getGroupBounds(groupId);
    const { dx, dy } = clampGroupInsideBoardInteriorHelper(
      bounds,
      this.boardWidth,
      this.boardHeight,
      this.boardInset,
    );
    if (dx !== 0 || dy !== 0) {
      this.updatePieces(
        (p) => p.groupId === groupId,
        (p) => ({ x: p.x + dx, y: p.y + dy }),
      );
    }
  }

  protected clampAllBoardGroupsInsideBoardInterior(): void {
    clampAllBoardGroupsInsideBoardInteriorHelper(this.state, (groupId) =>
      this.clampGroupInsideBoardInterior(groupId),
    );
  }
  protected findPiece(id: string) {
    return this.state.pieces.find((p) => p.id === id) ?? null;
  }
  protected wouldOverlapAnyOtherGroup(
    groupId: string,
    dx: number,
    dy: number,
    overlapEpsilonPx = 0,
    ignoreGroupIds: ReadonlySet<string> = new Set<string>(),
  ): boolean {
    return wouldOverlapUtil(
      this.state.pieces,
      groupId,
      dx,
      dy,
      overlapEpsilonPx,
      ignoreGroupIds,
    );
  }
  protected mergeGroups(from: string, into: string) {
    if (from === into) return;
    this.updatePieces(
      (p) => p.groupId === from,
      () => ({ groupId: into }),
    );
  }
  protected computeSnapPreview(): DragPreview {
    return null;
  }
  getState(): PuzzleState {
    return this.state;
  }
}
