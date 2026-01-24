// src/app/puzzle/PuzzleManager.ts

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
  correctEpsilonPx?: number;

  // tile size (no pad)
  pieceWidth: number;
  pieceHeight: number;

  // padding around the tile so tabs and blanks can extend
  pad?: number;

  scatterPadding?: number;
  scatterStartYRatio?: number;

  // snapping distance in pixels (puzzle-space px)
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
   * Solved puzzle origin (tile top-left coords) in PUZZLE space.
   *
   * IMPORTANT:
   * PlayScreen already centers + scales the assembled area via viewRef (offsetX/offsetY + scale).
   * If we ALSO center targets inside PuzzleManager, we get a double-centering effect that makes
   * the assembled area appear offset/squished.
   */
  private readonly targetStartX: number = 0;
  private readonly targetStartY: number = 0;

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

    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
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

  /**
   * Restore piece positions from saved state.
   * Call this after construction if you have saved state to restore.
   */
  restoreFromSaved(
    savedPieces: Array<{
      id: string;
      x: number;
      y: number;
      z: number;
      rotation: number;
      isPlaced: boolean;
      groupId: string;
      inTray: boolean;
    }>,
  ): void {
    // Create a map for quick lookup
    const savedMap = new Map(savedPieces.map((p) => [p.id, p]));

    // Update zCounter to be above all saved z values
    const maxZ = Math.max(...savedPieces.map((p) => p.z), this.zCounter);
    this.zCounter = maxZ + 1;

    // Apply saved positions to pieces
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((piece) => {
        const saved = savedMap.get(piece.id);
        if (!saved) return piece;

        return {
          ...piece,
          x: saved.x,
          y: saved.y,
          z: saved.z,
          rotation: saved.rotation,
          isPlaced: saved.isPlaced,
          groupId: saved.groupId,
          inTray: saved.inTray,
        };
      }),
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

  movePieceToTray(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;
    if (piece.isPlaced) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, inTray: true } : p,
      ),
    };
  }

  movePieceFromTray(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;
    if (!piece.inTray) return;

    // Place piece in a random position on the board
    const x = this.rand(16, Math.max(16, this.boardWidth - piece.w - 16));
    const y = this.rand(16, Math.max(16, this.boardHeight - piece.h - 16));

    this.zCounter += 1;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.id === pieceId ? { ...p, inTray: false, x, y, z: this.zCounter } : p,
      ),
    };
  }

  setBoardSize(boardWidth: number, boardHeight: number) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;

    // Clamp all pieces into view as groups
    const seen = new Set<string>();
    for (const p of this.state.pieces) {
      if (seen.has(p.groupId)) continue;
      seen.add(p.groupId);

      const bounds = this.getGroupBounds(p.groupId);
      if (!bounds) continue;

      const dxMin = -this.pad - bounds.minX;
      const dxMax = this.boardWidth + this.pad - bounds.maxX;
      const dyMin = -this.pad - bounds.minY;
      const dyMax = this.boardHeight + this.pad - bounds.maxY;

      const dx = clamp(0, dxMin, dxMax);
      const dy = clamp(0, dyMin, dyMax);

      if (dx !== 0 || dy !== 0) this.shiftGroup(p.groupId, dx, dy);
    }

    this.recomputeDerivedState();
  }

  pointerDown(pieceId: PieceId, pointerX: number, pointerY: number, pieceRect: DOMRect) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;
    if (this.groupIsPlaced(piece.groupId)) return;

    this.drag = {
      activeId: pieceId,
      offsetX: pointerX - pieceRect.left,
      offsetY: pointerY - pieceRect.top,
      preview: null,
    };

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
    if (this.groupIsPlaced(gid)) return;

    const desiredX = pointerX - boardRect.left - this.drag.offsetX;
    const desiredY = pointerY - boardRect.top - this.drag.offsetY;

    let dx = desiredX - active.x;
    let dy = desiredY - active.y;

    // Update magnet preview even if there is no movement.
    // (This keeps outlines stable as you hover near targets.)
    this.drag = {
      ...this.drag,
      preview: this.computeDragPreview(active, gid, 0, 0),
    };

    if (dx === 0 && dy === 0) return;

    const clamped = this.clampGroupDelta(gid, dx, dy);
    dx = clamped.dx;
    dy = clamped.dy;

    if (dx === 0 && dy === 0) {
      this.drag = {
        ...this.drag,
        preview: this.computeDragPreview(active, gid, 0, 0),
      };
      return;
    }

    // Preview for the clamped move
    this.drag = {
      ...this.drag,
      preview: this.computeDragPreview(active, gid, dx, dy),
    };

    this.shiftGroup(gid, dx, dy);
  }

  pointerUp() {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    const snappedToBoard = this.trySnapActiveGroupToBoard();
    if (!snappedToBoard) this.trySnapActiveGroupToNeighbor();

    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.recomputeDerivedState();
  }

  rotatePiece(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;
    if (this.groupIsPlaced(piece.groupId)) return;
    if (piece.isPlaced) return; // Extra safety check

    const step = this.rotationStepDeg;
    const next = (piece.rotation + step) % 360;
    const groupId = piece.groupId;

    // Rotate ALL pieces in the group together
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === groupId ? { ...p, rotation: next } : p,
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

    // Must be at correct rotation (0) to snap to board
    if (active.rotation !== 0) return false;

    const activeTile = this.tilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;

    if (Math.hypot(dx, dy) > this.snapTolerancePx) return false;
    if (this.wouldOverlapAnyOtherGroup(gid, dx, dy)) return false;

    this.shiftGroup(gid, dx, dy);

    // Check ALL pieces in the group are at correct position AND rotation
    const groupPieces = this.getGroupPieces(gid);
    const allCorrect =
      groupPieces.length > 0 &&
      groupPieces.every((p) => {
        if (p.rotation !== 0) return false;
        const tile = this.tilePos(p);
        return Math.hypot(p.targetX - tile.x, p.targetY - tile.y) <= this.snapTolerancePx;
      });

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

    return true;
  }

  private trySnapActiveGroupToNeighbor(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active) return false;

    const gid = active.groupId;

    if (this.groupIsPlaced(gid)) return false;

    // Get all pieces in the active group
    const groupPieces = this.getGroupPieces(gid);

    let best: null | {
      neighbor: Piece;
      groupPiece: Piece;
      dx: number;
      dy: number;
      dist: number;
    } = null;

    // Check all pieces in the group for potential neighbor snaps
    for (const groupPiece of groupPieces) {
      const neighbors = this.getSolvedNeighbors(groupPiece);
      if (neighbors.length === 0) continue;

      const groupPieceTile = this.tilePos(groupPiece);

      for (const n of neighbors) {
        if (n.groupId === gid) continue;
        // Both pieces must have the same rotation to snap together
        if (n.rotation !== groupPiece.rotation) continue;

        const nTile = this.tilePos(n);

        const expectedDx = (n.col - groupPiece.col) * this.tileW;
        const expectedDy = (n.row - groupPiece.row) * this.tileH;

        const moveDx = nTile.x - expectedDx - groupPieceTile.x;
        const moveDy = nTile.y - expectedDy - groupPieceTile.y;

        const d = Math.hypot(moveDx, moveDy);
        if (d <= this.snapTolerancePx) {
          if (!best || d < best.dist)
            best = { neighbor: n, groupPiece, dx: moveDx, dy: moveDy, dist: d };
        }
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

    const mergedPieces = this.getGroupPieces(intoGroup);
    const allCorrect =
      mergedPieces.length > 0 && mergedPieces.every((p) => this.isPieceCorrect(p));

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

  /**
   * Computes a "magnet" preview for the actively dragged group.
   *
   * The returned dx/dy is the *additional* delta that would be applied (on release)
   * to snap either to the board target or to a neighbor group.
   */
  private computeDragPreview(
    activePiece: Piece,
    groupId: string,
    moveDx: number,
    moveDy: number,
  ) {
    // Board snap preview (based on the active piece's tile position)
    const movedTileX = activePiece.x + moveDx + activePiece.pad;
    const movedTileY = activePiece.y + moveDy + activePiece.pad;

    // Require correct rotation for any preview
    if (activePiece.rotation === activePiece.targetRotation) {
      const dxToBoard = activePiece.targetX - movedTileX;
      const dyToBoard = activePiece.targetY - movedTileY;
      const dBoard = Math.hypot(dxToBoard, dyToBoard);
      if (dBoard <= this.snapTolerancePx) {
        return {
          kind: "board" as const,
          groupId,
          dx: dxToBoard,
          dy: dyToBoard,
        };
      }
    }

    // Neighbor snap preview: find the closest solved neighbor that would snap
    const neighbors = this.getSolvedNeighbors(activePiece);
    if (neighbors.length === 0) return null;

    let best: null | { neighbor: Piece; dx: number; dy: number; dist: number } = null;

    for (const n of neighbors) {
      if (n.groupId === groupId) continue;
      if (n.rotation !== n.targetRotation) continue;

      const nTile = this.tilePos(n);

      const expectedDx = (n.col - activePiece.col) * this.tileW;
      const expectedDy = (n.row - activePiece.row) * this.tileH;

      const dxSnap = nTile.x - expectedDx - movedTileX;
      const dySnap = nTile.y - expectedDy - movedTileY;

      const d = Math.hypot(dxSnap, dySnap);
      if (d <= this.snapTolerancePx) {
        if (!best || d < best.dist)
          best = { neighbor: n, dx: dxSnap, dy: dySnap, dist: d };
      }
    }

    if (!best) return null;

    return {
      kind: "neighbor" as const,
      groupId,
      dx: best.dx,
      dy: best.dy,
      intoGroupId: best.neighbor.groupId,
    };
  }

  // ---------------- Correctness / Win condition ----------------

  private isPieceCorrect(p: Piece) {
    if (p.rotation !== p.targetRotation) return false;
    const tile = this.tilePos(p);
    return Math.hypot(p.targetX - tile.x, p.targetY - tile.y) <= this.snapTolerancePx;
  }

  private recomputeDerivedState() {
    const allPieces = this.state.pieces;
    if (allPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    // Count pieces in the largest group as "progress"
    const groupCounts = new Map<string, number>();
    for (const p of allPieces) {
      groupCounts.set(p.groupId, (groupCounts.get(p.groupId) || 0) + 1);
    }
    const largestGroupSize = Math.max(...groupCounts.values());

    // Check if all pieces are in the same group and have correct rotation
    const firstPiece = allPieces[0];
    const allSameGroup = allPieces.every((p) => p.groupId === firstPiece.groupId);
    const allCorrectRotation = allPieces.every((p) => p.rotation === 0);

    // If all pieces merged into one group with correct rotation, puzzle is complete
    const isComplete = allSameGroup && allCorrectRotation && allPieces.length > 1;

    const prevComplete = this.state.isComplete;

    // placedCount shows how many are "locked in" - use largest group size
    this.state = {
      ...this.state,
      placedCount: largestGroupSize,
      isComplete,
    };

    if (!prevComplete && isComplete) {
      // Mark all as placed
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

    const w = tileW + pad * 2;
    const h = tileH + pad * 2;

    // Calculate scatter zone (below the solved area)
    const scatterStartY = Math.max(
      scatterPadding,
      Math.floor(this.boardHeight * this.scatterStartYRatio),
    );

    const scatterZone = {
      minX: scatterPadding,
      maxX: Math.max(scatterPadding + w, this.boardWidth - scatterPadding),
      minY: scatterStartY,
      maxY: Math.max(scatterStartY + h, this.boardHeight - scatterPadding),
    };

    const zoneWidth = scatterZone.maxX - scatterZone.minX;
    const zoneHeight = scatterZone.maxY - scatterZone.minY;

    // Create a grid of possible positions to prevent overlap
    // Add some spacing between pieces
    const spacing = 8;
    const cellW = w + spacing;
    const cellH = h + spacing;

    const gridCols = Math.max(1, Math.floor(zoneWidth / cellW));
    const gridRows = Math.max(1, Math.floor(zoneHeight / cellH));

    // Generate all possible grid positions
    const positions: Array<{ x: number; y: number }> = [];
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        // Add slight randomness within each cell for natural look
        const jitterX = this.rand(0, Math.min(spacing * 2, cellW - w));
        const jitterY = this.rand(0, Math.min(spacing * 2, cellH - h));

        positions.push({
          x: scatterZone.minX + col * cellW + jitterX,
          y: scatterZone.minY + row * cellH + jitterY,
        });
      }
    }

    // Shuffle positions for randomness
    for (let i = positions.length - 1; i > 0; i--) {
      const j = this.rand(0, i);
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // If we don't have enough grid positions, add random overflow positions
    while (positions.length < total) {
      positions.push({
        x: this.rand(scatterZone.minX, Math.max(scatterZone.minX, scatterZone.maxX - w)),
        y: this.rand(scatterZone.minY, Math.max(scatterZone.minY, scatterZone.maxY - h)),
      });
    }

    const pieces: Piece[] = [];

    for (let i = 0; i < total; i++) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);

      const targetX = this.targetStartX + col * tileW;
      const targetY = this.targetStartY + row * tileH;

      // Use pre-calculated position
      const pos = positions[i];
      const x = pos.x;
      const y = pos.y;

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

        // REQUIRED by your Piece type
        edges: edges[i],
        inTray: false,
      });
    }

    return pieces;
  }
}
