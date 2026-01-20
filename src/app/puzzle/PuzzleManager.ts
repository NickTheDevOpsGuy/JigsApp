// src/app/puzzle/PuzzleManager.ts
//
// Single source of truth for game rules:
// - drag + rotate
// - snap to board (solved position) AND to neighbors
// - correctness checks include BOTH position and rotation
// - clear state transitions: in-progress -> complete
//
// Notes:
// - "Placed" means the piece group is locked to its solved board position.
// - Neighbor snapping merges groups so they move as one unit.
// - Once a group is placed, it cannot be dragged or rotated.

import type {
  DragState,
  GridSize,
  Piece,
  PieceEdges,
  PieceId,
  PuzzleState,
} from "./types";
import { buildPiecePath } from "./shape";

export type PuzzleManagerOptions = {
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;
  grid: GridSize;

  // tile size (no pad)
  pieceWidth: number;
  pieceHeight: number;

  // padding around the tile so tabs and blanks can extend
  pad?: number;

  scatterPadding?: number;
  scatterStartYRatio?: number;

  // snapping distance in pixels
  snapTolerancePx?: number;

  // rotation step size
  rotationStepDeg?: 90 | 180;
};

export type PuzzleManagerEvents = {
  onPiecePlaced?: (piece: Piece) => void;
  onPuzzleComplete?: (state: PuzzleState) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export class PuzzleManager {
  private state: PuzzleState;
  private drag: DragState;
  private zCounter: number;
  private events: PuzzleManagerEvents;

  private boardWidth: number;
  private boardHeight: number;

  private snapTolerancePx: number;
  private scatterStartYRatio: number;
  private rotationStepDeg: 90 | 180;

  private pad: number;
  private tileW: number;
  private tileH: number;

  /**
   * Solved puzzle origin in board space.
   * Targets are computed from this start.
   *
   * NOTE:
   * These targets are tile top-left targets (no pad).
   * Since the piece container includes pad, the container will naturally want to go to x=-pad / y=-pad
   * for edge pieces when targetStartX/Y are 0.
   *
   * Option B in this file allows that by clamping inside [-pad .. board+pad].
   */
  private readonly targetStartX = 0;
  private readonly targetStartY = 0;

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
      snapTolerancePx = 40,
      scatterStartYRatio = 0.3,
      rotationStepDeg = 90,
    } = options;

    this.events = events;

    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;

    this.snapTolerancePx = snapTolerancePx;
    this.scatterStartYRatio = scatterStartYRatio;
    this.rotationStepDeg = rotationStepDeg;

    this.pad = pad;
    this.tileW = pieceWidth;
    this.tileH = pieceHeight;

    this.drag = { activeId: null, offsetX: 0, offsetY: 0 };
    this.zCounter = 10;

    const pieces = this.createPieces({
      grid,
      scatterPadding,
      pad,
      tileW: pieceWidth,
      tileH: pieceHeight,
    });

    this.state = {
      imageUrl,
      grid,
      pieces,
      placedCount: 0,
      totalCount: pieces.length,
      isComplete: false,
    };

    this.recomputeDerivedState();
  }

  // ---------------- Public API ----------------

  getState(): PuzzleState {
    return this.state;
  }

  getDragState(): DragState {
    return this.drag;
  }

  /**
   * Option B: allow pieces to move slightly outside the board by pad.
   * This avoids "invisible walls" and makes it possible for edge pieces to align to targets
   * that imply x=-pad / y=-pad at the container level.
   */
  setBoardSize(boardWidth: number, boardHeight: number) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;

    // Clamp all pieces into view (as groups, to avoid shearing)
    const seen = new Set<string>();
    for (const p of this.state.pieces) {
      if (seen.has(p.groupId)) continue;
      seen.add(p.groupId);

      const bounds = this.getGroupBounds(p.groupId);
      if (!bounds) continue;

      // Option B clamp window: [-pad .. board+pad]
      const dxMin = -this.pad - bounds.minX;
      const dxMax = this.boardWidth + this.pad - bounds.maxX;
      const dyMin = -this.pad - bounds.minY;
      const dyMax = this.boardHeight + this.pad - bounds.maxY;

      const dx = clamp(0, dxMin, dxMax);
      const dy = clamp(0, dyMin, dyMax);

      if (dx !== 0 || dy !== 0) {
        this.shiftGroup(p.groupId, dx, dy);
      }
    }

    this.recomputeDerivedState();
  }

  pointerDown(pieceId: PieceId, pointerX: number, pointerY: number, pieceRect: DOMRect) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;

    // If the group is placed, it's locked
    if (this.groupIsPlaced(piece.groupId)) return;

    this.drag = {
      activeId: pieceId,
      offsetX: pointerX - pieceRect.left,
      offsetY: pointerY - pieceRect.top,
    };

    // Bring entire group to front
    this.zCounter += 1;
    const gid = piece.groupId;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === gid ? { ...p, z: this.zCounter } : p,
      ),
    };
  }

  pointerMove(pointerX: number, pointerY: number, boardRect: DOMRect) {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const active = this.findPiece(activeId);
    if (!active) return;

    const gid = active.groupId;

    // Never move placed groups
    if (this.groupIsPlaced(gid)) return;

    // Desired new top-left for the ACTIVE piece container in board space
    const desiredX = pointerX - boardRect.left - this.drag.offsetX;
    const desiredY = pointerY - boardRect.top - this.drag.offsetY;

    // Delta from current active position
    let dx = desiredX - active.x;
    let dy = desiredY - active.y;

    if (dx === 0 && dy === 0) return;

    // Clamp delta for the WHOLE group only (prevents shearing)
    const clamped = this.clampGroupDelta(gid, dx, dy);
    dx = clamped.dx;
    dy = clamped.dy;

    if (dx === 0 && dy === 0) return;

    // Collision is intentionally relaxed while dragging for smoother feel.
    this.shiftGroup(gid, dx, dy);
  }

  pointerUp() {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const snappedToBoard = this.trySnapActiveGroupToBoard();
    if (!snappedToBoard) {
      this.trySnapActiveGroupToNeighbor();
    }

    this.drag = { activeId: null, offsetX: 0, offsetY: 0 };
    this.recomputeDerivedState();
  }

  rotatePiece(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;

    if (this.groupIsPlaced(piece.groupId)) return;

    const step = this.rotationStepDeg;
    const next = (piece.rotation + step) % 360;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, rotation: next } : p,
      ),
    };

    this.recomputeDerivedState();
  }

  clearJustSnapped(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;
    if (!piece.justSnapped) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, justSnapped: false } : p,
      ),
    };
  }

  // ---------------- Snapping ----------------

  private trySnapActiveGroupToBoard(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active) return false;

    const gid = active.groupId;

    // Require correct rotation on the grabbed piece
    if (active.rotation !== active.targetRotation) return false;

    const activeTile = this.tilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;

    if (Math.hypot(dx, dy) > this.snapTolerancePx) return false;

    // Avoid snapping into heavy overlap
    if (this.wouldOverlapAnyOtherGroup(gid, dx, dy)) return false;

    // Apply shift (clamped by Option B bounds)
    this.shiftGroup(gid, dx, dy);

    // Lock only if every piece in the group is correct (pos + rotation)
    const groupPieces = this.getGroupPieces(gid);
    const allCorrect = groupPieces.every((p) => this.isPieceCorrect(p));

    if (allCorrect) {
      this.state = {
        ...this.state,
        pieces: this.state.pieces.map((p) =>
          p.groupId === gid ? { ...p, isPlaced: true, justSnapped: true } : p,
        ),
      };
      this.events.onPiecePlaced?.(this.findPiece(activeId) ?? active);
      return true;
    }

    // Shift is allowed but group is not locked
    return true;
  }

  private trySnapActiveGroupToNeighbor(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active) return false;

    const gid = active.groupId;

    if (this.groupIsPlaced(gid)) return false;
    if (active.rotation !== active.targetRotation) return false;

    const neighbors = this.getSolvedNeighbors(active);
    if (neighbors.length === 0) return false;

    const activeTile = this.tilePos(active);

    let best: null | { neighbor: Piece; dx: number; dy: number; dist: number } = null;

    for (const n of neighbors) {
      if (n.groupId === gid) continue;
      if (n.rotation !== n.targetRotation) continue;

      const nTile = this.tilePos(n);

      const expectedDx = (n.col - active.col) * this.tileW;
      const expectedDy = (n.row - active.row) * this.tileH;

      const moveDx = nTile.x - expectedDx - activeTile.x;
      const moveDy = nTile.y - expectedDy - activeTile.y;

      const d = Math.hypot(moveDx, moveDy);
      if (d <= this.snapTolerancePx) {
        if (!best || d < best.dist)
          best = { neighbor: n, dx: moveDx, dy: moveDy, dist: d };
      }
    }

    if (!best) return false;

    if (this.wouldOverlapAnyOtherGroup(gid, best.dx, best.dy)) return false;

    this.shiftGroup(gid, best.dx, best.dy);

    const intoGroup = best.neighbor.groupId;
    this.mergeGroups(gid, intoGroup);

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === intoGroup ? { ...p, justSnapped: true } : p,
      ),
    };

    // If merged cluster is fully correct, lock it immediately
    const mergedPieces = this.getGroupPieces(intoGroup);
    const allCorrect = mergedPieces.every((p) => this.isPieceCorrect(p));
    if (allCorrect) {
      this.state = {
        ...this.state,
        pieces: this.state.pieces.map((p) =>
          p.groupId === intoGroup ? { ...p, isPlaced: true, justSnapped: true } : p,
        ),
      };
      this.events.onPiecePlaced?.(best.neighbor);
    }

    return true;
  }

  // ---------------- Correctness / Win condition ----------------

  private isPieceCorrect(p: Piece) {
    if (p.rotation !== p.targetRotation) return false;
    return (
      Math.hypot(p.targetX - (p.x + p.pad), p.targetY - (p.y + p.pad)) <=
      this.snapTolerancePx
    );
  }

  private recomputeDerivedState() {
    // HUD and completion should come from the same truth as win condition.
    const correctCount = this.state.pieces.filter((p) => this.isPieceCorrect(p)).length;

    const allCorrect =
      this.state.pieces.length > 0 &&
      this.state.pieces.every((p) => this.isPieceCorrect(p));
    const isComplete = allCorrect;

    const prevComplete = this.state.isComplete;

    this.state = {
      ...this.state,
      placedCount: correctCount,
      isComplete,
    };

    if (!prevComplete && isComplete) {
      // When complete, lock everything
      this.state = {
        ...this.state,
        pieces: this.state.pieces.map((p) => ({ ...p, isPlaced: true })),
      };
      this.events.onPuzzleComplete?.(this.state);
    }
  }

  // ---------------- Collision ----------------

  private wouldOverlapAnyOtherGroup(groupId: string, dx: number, dy: number): boolean {
    const moving = this.getGroupPieces(groupId);

    const overlapArea = (ddx: number, ddy: number) => {
      let total = 0;

      for (const m of moving) {
        const ax1 = m.x + ddx;
        const ay1 = m.y + ddy;
        const ax2 = ax1 + m.w;
        const ay2 = ay1 + m.h;

        for (const p of this.state.pieces) {
          if (p.groupId === groupId) continue;

          const bx1 = p.x;
          const by1 = p.y;
          const bx2 = p.x + p.w;
          const by2 = p.y + p.h;

          const ix = Math.min(ax2, bx2) - Math.max(ax1, bx1);
          const iy = Math.min(ay2, by2) - Math.max(ay1, by1);

          if (ix > 0 && iy > 0) total += ix * iy;
        }
      }

      return total;
    };

    const before = overlapArea(0, 0);
    const after = overlapArea(dx, dy);

    return after > before + 2;
  }

  /**
   * Option B clamp window: allow group bounds inside [-pad .. board+pad]
   */
  private clampGroupDelta(groupId: string, dx: number, dy: number) {
    const bounds = this.getGroupBounds(groupId);
    if (!bounds) return { dx: 0, dy: 0 };

    const dxMin = -this.pad - bounds.minX;
    const dxMax = this.boardWidth + this.pad - bounds.maxX;
    const dyMin = -this.pad - bounds.minY;
    const dyMax = this.boardHeight + this.pad - bounds.maxY;

    return {
      dx: clamp(dx, dxMin, dxMax),
      dy: clamp(dy, dyMin, dyMax),
    };
  }

  // ---------------- Group utilities ----------------

  private getGroupPieces(groupId: string): Piece[] {
    return this.state.pieces.filter((p) => p.groupId === groupId);
  }

  private groupIsPlaced(groupId: string): boolean {
    return this.state.pieces.some((p) => p.groupId === groupId && p.isPlaced);
  }

  private getGroupBounds(groupId: string) {
    const pieces = this.getGroupPieces(groupId);
    if (pieces.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of pieces) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    }

    return { minX, minY, maxX, maxY };
  }

  private shiftGroup(groupId: string, dx: number, dy: number) {
    const clamped = this.clampGroupDelta(groupId, dx, dy);
    const cdx = clamped.dx;
    const cdy = clamped.dy;

    if (cdx === 0 && cdy === 0) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === groupId ? { ...p, x: p.x + cdx, y: p.y + cdy } : p,
      ),
    };
  }

  private mergeGroups(fromGroupId: string, intoGroupId: string) {
    if (fromGroupId === intoGroupId) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === fromGroupId ? { ...p, groupId: intoGroupId } : p,
      ),
    };
  }

  private tilePos(p: Piece) {
    return { x: p.x + p.pad, y: p.y + p.pad };
  }

  private getSolvedNeighbors(piece: Piece): Piece[] {
    const byRC = (r: number, c: number) =>
      this.state.pieces.find((p) => p.row === r && p.col === c) ?? null;

    const out: Piece[] = [];
    const up = byRC(piece.row - 1, piece.col);
    const down = byRC(piece.row + 1, piece.col);
    const left = byRC(piece.row, piece.col - 1);
    const right = byRC(piece.row, piece.col + 1);

    if (up) out.push(up);
    if (down) out.push(down);
    if (left) out.push(left);
    if (right) out.push(right);

    return out;
  }

  // ---------------- Piece creation ----------------

  private findPiece(id: PieceId) {
    return this.state.pieces.find((p) => p.id === id) ?? null;
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randRotation(): number {
    const steps = 360 / this.rotationStepDeg;
    const k = this.rand(0, steps - 1);
    return (k * this.rotationStepDeg) % 360;
  }

  private buildEdgesForGrid(grid: GridSize): PieceEdges[] {
    const edges: PieceEdges[] = [];

    const randomTabOrBlank = (): "tab" | "blank" =>
      Math.random() < 0.5 ? "tab" : "blank";
    const opposite = (e: PieceEdges["top"]): PieceEdges["top"] => {
      if (e === "flat") return "flat";
      return e === "tab" ? "blank" : "tab";
    };

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const top: PieceEdges["top"] =
          r === 0 ? "flat" : opposite(edges[(r - 1) * grid.cols + c].bottom);

        const left: PieceEdges["left"] =
          c === 0 ? "flat" : opposite(edges[r * grid.cols + (c - 1)].right);

        const right: PieceEdges["right"] =
          c === grid.cols - 1 ? "flat" : randomTabOrBlank();
        const bottom: PieceEdges["bottom"] =
          r === grid.rows - 1 ? "flat" : randomTabOrBlank();

        edges.push({ top, right, bottom, left });
      }
    }

    return edges;
  }

  private createPieces(args: {
    grid: GridSize;
    scatterPadding: number;
    pad: number;
    tileW: number;
    tileH: number;
  }): Piece[] {
    const { grid, scatterPadding, pad, tileW, tileH } = args;

    const total = grid.cols * grid.rows;
    const edges = this.buildEdgesForGrid(grid);

    const pieces: Piece[] = [];

    for (let i = 0; i < total; i++) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);

      // Solved tile target (no pad)
      const targetX = this.targetStartX + col * tileW;
      const targetY = this.targetStartY + row * tileH;

      // Container includes pad on all sides
      const w = tileW + pad * 2;
      const h = tileH + pad * 2;

      // Spawn region
      const scatterMinX = scatterPadding;
      const scatterMaxX = Math.max(scatterPadding, this.boardWidth - w - scatterPadding);

      const scatterMinY = Math.max(
        scatterPadding,
        Math.floor(this.boardHeight * this.scatterStartYRatio),
      );
      const scatterMaxY = Math.max(scatterMinY, this.boardHeight - h - scatterPadding);

      const x = this.rand(scatterMinX, scatterMaxX);
      const y = this.rand(scatterMinY, scatterMaxY);

      const shapePath = buildPiecePath({
        tileW,
        tileH,
        pad,
        edges: edges[i],
      });

      pieces.push({
        id: `p${i + 1}`,
        row,
        col,
        x,
        y,
        z: 1,
        w,
        h,
        tileW,
        tileH,
        pad,
        targetX,
        targetY,
        rotation: this.randRotation(),
        targetRotation: 0,
        isPlaced: false,
        groupId: `g${i + 1}`,
        justSnapped: false,
        shapePath,
      });
    }

    return pieces;
  }
}
