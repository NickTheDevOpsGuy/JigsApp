import type { DragState, GridSize, Piece, PieceId, PuzzleState } from "./types";
import { createInitialPieces } from "./factories/createInitialPieces";

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
  onPieceSnapped?: () => void;
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

    const pieces = createInitialPieces({
      grid,
      boardWidth: this.boardWidth,
      boardHeight: this.boardHeight,
      scatterPadding,
      pad,
      tileW: pieceWidth,
      tileH: pieceHeight,
      scatterStartYRatio: this.scatterStartYRatio,
      rotationStepDeg: this.rotationStepDeg,
      targetStartX: this.targetStartX,
      targetStartY: this.targetStartY,
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
    const savedMap = new Map(savedPieces.map((p) => [p.id, p]));

    const maxZ = Math.max(...savedPieces.map((p) => p.z), this.zCounter);
    this.zCounter = maxZ + 1;

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

  // Keyboard helpers
  public getPiece(id: PieceId) {
    return this.findPiece(id);
  }

  public nudgeGroup(pieceId: PieceId, dx: number, dy: number) {
    const p = this.findPiece(pieceId);
    if (!p) return;
    if (p.isPlaced) return;
    this.shiftGroup(p.groupId, dx, dy);
    this.recomputeDerivedState();
  }

  public rotateGroup(pieceId: PieceId) {
    const p = this.findPiece(pieceId);
    if (!p) return;
    if (p.isPlaced) return;
    this.rotatePiece(pieceId);
  }

  public snapGroupNow(pieceId: PieceId) {
    const p = this.findPiece(pieceId);
    if (!p) return;
    if (p.isPlaced) return;

    // Temporarily treat as active for snap routines
    this.drag = { ...this.drag, activeId: p.id };
    this.trySnapActiveGroupToBoard();
    this.trySnapActiveGroupToNeighbor();
    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.recomputeDerivedState();
  }

  public sendToTray(pieceId: PieceId) {
    this.movePieceToTray(pieceId);
    this.recomputeDerivedState();
  }

  movePieceToTray(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;
    if (piece.isPlaced) return;

    // Don't allow sending to tray if piece is part of a merged group
    const groupPieces = this.getGroupPieces(piece.groupId);
    if (groupPieces.length > 1) return;

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
    if (piece.isPlaced) return;

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
    if (active.isPlaced) return;

    const desiredX = pointerX - boardRect.left - this.drag.offsetX;
    const desiredY = pointerY - boardRect.top - this.drag.offsetY;

    let dx = desiredX - active.x;
    let dy = desiredY - active.y;

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

    this.drag = {
      ...this.drag,
      preview: this.computeDragPreview(active, gid, dx, dy),
    };

    this.shiftGroup(gid, dx, dy);
  }

  pointerUp() {
    const activeId = this.drag.activeId;
    if (!activeId) return;

    // Try board snap, then neighbor snap
    this.trySnapActiveGroupToBoard();
    this.trySnapActiveGroupToNeighbor();

    // After all snapping, check if the puzzle is now complete and should snap to final position
    // Re-fetch the piece to get its current groupId (may have changed due to merging)
    const active = this.findPiece(activeId);
    if (active) {
      this.trySnapCompletedPuzzleToBoard(active.groupId);
    }

    this.drag = { activeId: null, offsetX: 0, offsetY: 0, preview: null };
    this.recomputeDerivedState();
  }

  rotatePiece(pieceId: PieceId) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;
    if (piece.isPlaced) return;

    // Don't allow rotation if piece is part of a merged group (more than 1 piece)
    const groupPieces = this.getGroupPieces(piece.groupId);
    if (groupPieces.length > 1) return;

    const step = this.rotationStepDeg;
    const groupId = piece.groupId;

    // Rotate the whole group together
    const next = (piece.rotation + step) % 360;

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

    // All pieces in group must have rotation 0 to snap to board
    const groupPieces = this.getGroupPieces(gid);
    if (!groupPieces.every((p) => p.rotation === 0)) return false;

    const activeTile = this.tilePos(active);
    const dx = active.targetX - activeTile.x;
    const dy = active.targetY - activeTile.y;

    if (Math.hypot(dx, dy) > this.snapTolerancePx) return false;
    if (this.wouldOverlapAnyOtherGroup(gid, dx, dy)) return false;

    this.shiftGroup(gid, dx, dy);

    // Check if all pieces in group are now at their correct positions
    const allCorrect =
      groupPieces.length > 0 &&
      groupPieces.every((p) => {
        if (p.rotation !== 0) return false;
        const tile = this.tilePos(p);
        return Math.hypot(p.targetX - tile.x, p.targetY - tile.y) <= this.snapTolerancePx;
      });

    if (allCorrect) {
      // Mark all pieces in this group as PLACED - they can no longer be moved or rotated
      this.state = {
        ...this.state,
        pieces: this.state.pieces.map((p) =>
          p.groupId === gid ? { ...p, justSnapped: true, isPlaced: true } : p,
        ),
      };
      this.events.onPiecePlaced?.(this.findPiece(activeId) ?? active);
    }

    return true;
  }

  private trySnapActiveGroupToNeighbor(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active) return false;

    const gid = active.groupId;

    if (active.isPlaced) return false;

    // Only allow snapping when all pieces in the dragged group are at rotation 0
    const groupPieces = this.getGroupPieces(gid);
    if (!groupPieces.every((p) => p.rotation === 0)) return false;

    let best: null | {
      neighbor: Piece;
      groupPiece: Piece;
      dx: number;
      dy: number;
      dist: number;
    } = null;

    for (const groupPiece of groupPieces) {
      const neighbors = this.getSolvedNeighbors(groupPiece);
      if (neighbors.length === 0) continue;

      const groupPieceTile = this.tilePos(groupPiece);

      for (const n of neighbors) {
        if (n.groupId === gid) continue;
        // Only snap to neighbors that are also at rotation 0
        if (n.rotation !== 0) continue;

        const nTile = this.tilePos(n);

        const expectedDx = (n.col - groupPiece.col) * this.tileW;
        const expectedDy = (n.row - groupPiece.row) * this.tileH;

        const moveDx = nTile.x - expectedDx - groupPieceTile.x;
        const moveDy = nTile.y - expectedDy - groupPieceTile.y;

        const d = Math.hypot(moveDx, moveDy);
        if (d <= this.snapTolerancePx) {
          if (!best || d < best.dist) {
            best = { neighbor: n, groupPiece, dx: moveDx, dy: moveDy, dist: d };
          }
        }
      }
    }

    if (!best) return false;

    this.shiftGroup(gid, best.dx, best.dy);

    const intoGroup = best.neighbor.groupId;
    this.mergeGroups(gid, intoGroup);
    // After merging, align merged group toward board target using reference piece
    const ref = this.getGroupPieces(intoGroup)[0];
    if (ref) {
      const tile = this.tilePos(ref);
      const dxBoard = ref.targetX - tile.x;
      const dyBoard = ref.targetY - tile.y;
      // Move group closer to its solved board position
      this.shiftGroupUnclamped(intoGroup, dxBoard, dyBoard);
    }

    this.events.onPieceSnapped?.();

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === intoGroup ? { ...p, justSnapped: true } : p,
      ),
    };

    // After merging, try to snap the merged group to board target position
    this.trySnapMergedGroupToBoard(intoGroup);

    return true;
  }

  /**
   * After pieces merge, snap the merged group to its correct board position
   * if all pieces in the group are at rotation 0 and would land at valid targets.
   */
  private trySnapMergedGroupToBoard(groupId: string): void {
    const groupPieces = this.getGroupPieces(groupId);
    if (groupPieces.length === 0) return;

    // All pieces must be at rotation 0
    if (!groupPieces.every((p) => p.rotation === 0)) return;

    // Use first piece as reference to calculate offset to target
    const refPiece = groupPieces[0];
    const refTile = this.tilePos(refPiece);
    const dx = refPiece.targetX - refTile.x;
    const dy = refPiece.targetY - refTile.y;

    // If already at target, nothing to do
    if (dx === 0 && dy === 0) return;

    // Check if moving would overlap with other groups
    if (this.wouldOverlapAnyOtherGroup(groupId, dx, dy)) return;

    // Snap the group to target position
    this.shiftGroup(groupId, dx, dy);

    // Check if all pieces are now correctly placed
    const allCorrect = groupPieces.every((p) => {
      const tile = this.tilePos(p);
      return Math.hypot(p.targetX - tile.x, p.targetY - tile.y) < 1;
    });

    if (allCorrect) {
      // Mark all pieces as placed
      this.state = {
        ...this.state,
        pieces: this.state.pieces.map((p) =>
          p.groupId === groupId ? { ...p, isPlaced: true, justSnapped: true } : p,
        ),
      };
      this.events.onPiecePlaced?.(refPiece);
    }
  }

  /**
   * When all pieces are merged into one group, automatically snap to the board position
   */
  private trySnapCompletedPuzzleToBoard(groupId: string): void {
    const allPieces = this.state.pieces;
    const boardPieces = allPieces.filter((p) => !p.inTray);

    // Find the largest group on the board
    const groupCounts = new Map<string, number>();
    for (const p of boardPieces) {
      groupCounts.set(p.groupId, (groupCounts.get(p.groupId) || 0) + 1);
    }

    // Find the group that contains all board pieces
    let completeGroupId: string | null = null;
    for (const [gid, count] of groupCounts) {
      if (count === boardPieces.length && count === allPieces.length) {
        completeGroupId = gid;
        break;
      }
    }

    console.log("[Puzzle] trySnapCompletedPuzzleToBoard:", {
      requestedGroupId: groupId,
      completeGroupId,
      boardPiecesCount: boardPieces.length,
      allPiecesCount: allPieces.length,
      groupCounts: Object.fromEntries(groupCounts),
    });

    if (!completeGroupId) {
      console.log("[Puzzle] No complete group found yet");
      return;
    }

    const groupPieces = this.getGroupPieces(completeGroupId);

    // Check all pieces are at rotation 0
    if (!groupPieces.every((p) => p.rotation === 0)) {
      console.log("[Puzzle] Some pieces not at rotation 0");
      return;
    }

    // Find any piece in the group to calculate the offset to target
    const refPiece = groupPieces[0];
    if (!refPiece) return;

    const refTile = this.tilePos(refPiece);
    const dx = refPiece.targetX - refTile.x;
    const dy = refPiece.targetY - refTile.y;

    console.log(
      "[Puzzle] Snapping completed puzzle to board position, dx:",
      dx,
      "dy:",
      dy,
      "refPiece:",
      refPiece.id,
    );

    // Snap the entire group to the board position (unclamped to ensure exact positioning)
    if (dx !== 0 || dy !== 0) {
      this.shiftGroupUnclamped(completeGroupId, dx, dy);
      console.log("[Puzzle] Shifted group to target position");
    } else {
      console.log("[Puzzle] Already at target position");
    }

    // Mark all pieces as placed
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === completeGroupId ? { ...p, isPlaced: true, justSnapped: true } : p,
      ),
    };

    // Fire placed event
    this.events.onPiecePlaced?.(refPiece);
  }

  private computeDragPreview(
    activePiece: Piece,
    groupId: string,
    moveDx: number,
    moveDy: number,
  ) {
    // Only show preview if piece is at correct rotation (0)
    if (activePiece.rotation !== 0) return null;

    const movedTileX = activePiece.x + moveDx + activePiece.pad;
    const movedTileY = activePiece.y + moveDy + activePiece.pad;

    // Check board snap preview
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

    // Check neighbor snap preview
    const neighbors = this.getSolvedNeighbors(activePiece);
    if (neighbors.length === 0) return null;

    let best: null | { neighbor: Piece; dx: number; dy: number; dist: number } = null;

    for (const n of neighbors) {
      if (n.groupId === groupId) continue;
      // Only show preview for neighbors at rotation 0
      if (n.rotation !== 0) continue;

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

    // Only consider pieces NOT in tray for completion
    const boardPieces = allPieces.filter((p) => !p.inTray);

    // Count pieces in the largest group as "progress"
    const groupCounts = new Map<string, number>();
    for (const p of boardPieces) {
      groupCounts.set(p.groupId, (groupCounts.get(p.groupId) || 0) + 1);
    }
    const largestGroupSize = Math.max(...groupCounts.values(), 0);

    // Completion: all board pieces merged into one group AND all are correct
    // (pieces in tray don't count - puzzle is complete when all board pieces are done)
    if (boardPieces.length === 0) {
      this.state = { ...this.state, placedCount: 0, isComplete: false };
      return;
    }

    const firstPiece = boardPieces[0];
    const allSameGroup = boardPieces.every((p) => p.groupId === firstPiece.groupId);
    const allCorrect = boardPieces.every((p) => this.isPieceCorrect(p));
    const noTrayPieces = boardPieces.length === allPieces.length;
    const isComplete = allSameGroup && allCorrect && noTrayPieces;

    // Debug logging
    if (largestGroupSize === allPieces.length) {
      console.log("[Puzzle] Completion check:", {
        allSameGroup,
        allCorrect,
        noTrayPieces,
        isComplete,
        boardPiecesCount: boardPieces.length,
        allPiecesCount: allPieces.length,
      });
      if (!allCorrect) {
        // Log which pieces are not correct
        for (const p of boardPieces) {
          const tile = this.tilePos(p);
          const dist = Math.hypot(p.targetX - tile.x, p.targetY - tile.y);
          const rotOk = p.rotation === p.targetRotation;
          if (!rotOk || dist > this.snapTolerancePx) {
            console.log(
              `[Puzzle] Piece ${p.id} NOT correct: rotation=${p.rotation} (target=${p.targetRotation}), dist=${dist.toFixed(1)} (tolerance=${this.snapTolerancePx})`,
            );
          }
        }
      }
    }

    const prevComplete = this.state.isComplete;

    this.state = {
      ...this.state,
      placedCount: largestGroupSize,
      isComplete,
    };

    if (!prevComplete && isComplete) {
      console.log("[Puzzle] PUZZLE COMPLETE! Firing onPuzzleComplete event");
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

  // Unclamped version for snapping completed puzzle to exact target
  private shiftGroupUnclamped(groupId: string, dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === groupId ? { ...p, x: p.x + dx, y: p.y + dy } : p,
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
}
