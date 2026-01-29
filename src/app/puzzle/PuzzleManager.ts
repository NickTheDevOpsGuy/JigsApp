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
      this.trySnapCompletedPuzzleToBoard();
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

    this.events.onPieceSnapped?.();

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === intoGroup ? { ...p, justSnapped: true } : p,
      ),
    };

    // Move the merged group to its correct board position
    // Re-fetch group pieces AFTER state update above
    const mergedGroupPieces = this.getGroupPieces(intoGroup);
    if (
      mergedGroupPieces.length > 0 &&
      mergedGroupPieces.every((p) => p.rotation === 0)
    ) {
      const refPiece = mergedGroupPieces[0];
      const refTile = this.tilePos(refPiece);
      const dx = refPiece.targetX - refTile.x;
      const dy = refPiece.targetY - refTile.y;

      console.log(
        "[Puzzle] Moving merged group",
        intoGroup,
        "to target, dx:",
        dx,
        "dy:",
        dy,
      );

      // Use unclamped shift to ensure pieces reach exact target position
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        this.shiftGroupUnclamped(intoGroup, dx, dy);

        // After moving, check if we should auto-merge with neighbors at target
        this.trySnapGroupToNeighborsAtTarget(intoGroup);
      }
    }

    // After all snapping and moving, check if puzzle is complete
    this.trySnapCompletedPuzzleToBoard();

    return true;
  }

  /**
   * After moving a group to target position, check if it should snap to neighbors
   * that are also at their target positions
   */
  private trySnapGroupToNeighborsAtTarget(groupId: string): void {
    const groupPieces = this.getGroupPieces(groupId);
    if (groupPieces.length === 0) return;

    console.log("[Puzzle] Checking for auto-merge opportunities for group:", groupId);

    // Check each piece in the group for neighbors
    for (const groupPiece of groupPieces) {
      const neighbors = this.getSolvedNeighbors(groupPiece);

      console.log("[Puzzle] Piece", groupPiece.id, "has", neighbors.length, "neighbors");

      for (const n of neighbors) {
        // Skip if already in same group
        if (n.groupId === groupId) continue;

        // Skip if neighbor not at rotation 0
        if (n.rotation !== 0) continue;

        // Skip if this piece not at rotation 0
        if (groupPiece.rotation !== 0) continue;

        // Check if both pieces are at their target positions (within tolerance)
        const groupPieceTile = this.tilePos(groupPiece);
        const nTile = this.tilePos(n);

        const groupPieceDist = Math.hypot(
          groupPiece.targetX - groupPieceTile.x,
          groupPiece.targetY - groupPieceTile.y,
        );

        const neighborDist = Math.hypot(n.targetX - nTile.x, n.targetY - nTile.y);

        console.log("[Puzzle] Checking neighbor", n.id, "- distances:", {
          groupPieceDist,
          neighborDist,
          groupPieceAtTarget: groupPieceDist <= 2,
          neighborAtTarget: neighborDist <= 2,
        });

        const groupPieceAtTarget = groupPieceDist <= 2;
        const neighborAtTarget = neighborDist <= 2;

        // If both at target, they should be merged
        if (groupPieceAtTarget && neighborAtTarget) {
          console.log(
            "[Puzzle] ✅ Auto-merging groups at target:",
            groupId,
            "and",
            n.groupId,
          );
          this.mergeGroups(n.groupId, groupId);
          this.state = {
            ...this.state,
            pieces: this.state.pieces.map((p) =>
              p.groupId === groupId ? { ...p, justSnapped: true } : p,
            ),
          };
          this.events.onPieceSnapped?.();

          // Recursively check the newly merged group
          this.trySnapGroupToNeighborsAtTarget(groupId);
          return;
        }
      }
    }
  }

  /**
   * When all pieces are merged into one group, automatically snap to the board position
   */
  private trySnapCompletedPuzzleToBoard(): void {
    const allPieces = this.state.pieces;

    // Only consider pieces on the board
    const boardPieces = allPieces.filter((p) => !p.inTray);
    if (boardPieces.length === 0) return;

    // FORCE MERGE: If pieces are at correct positions, merge them
    for (const piece of boardPieces) {
      if (piece.rotation !== 0) continue;

      const neighbors = this.getSolvedNeighbors(piece);
      for (const n of neighbors) {
        if (n.groupId === piece.groupId) continue;
        if (n.rotation !== 0) continue;

        // Check if both are at target
        const pieceTile = this.tilePos(piece);
        const nTile = this.tilePos(n);

        const pieceAtTarget =
          Math.hypot(piece.targetX - pieceTile.x, piece.targetY - pieceTile.y) <= 2;
        const nAtTarget = Math.hypot(n.targetX - nTile.x, n.targetY - nTile.y) <= 2;

        if (pieceAtTarget && nAtTarget) {
          console.log(
            "[Puzzle] Force merging",
            piece.id,
            "and",
            n.id,
            "- both at target",
          );
          this.mergeGroups(n.groupId, piece.groupId);
        }
      }
    }

    // Find the largest group on the board
    const groupCounts = new Map<string, number>();
    for (const p of boardPieces) {
      groupCounts.set(p.groupId, (groupCounts.get(p.groupId) || 0) + 1);
    }

    // Find the group that contains all board pieces
    let completeGroupId: string | null = null;
    for (const [gid, count] of groupCounts) {
      if (count === boardPieces.length) {
        completeGroupId = gid;
        break;
      }
    }

    console.log(
      "[Puzzle] Completion check - groups:",
      Object.fromEntries(groupCounts),
      "complete:",
      completeGroupId,
    );

    // If not all pieces are in one group, puzzle is not complete
    if (!completeGroupId) return;

    const groupPieces = this.getGroupPieces(completeGroupId);

    // Check all pieces are at rotation 0
    if (!groupPieces.every((p) => p.rotation === 0)) return;

    console.log("[Puzzle] ✅ PUZZLE COMPLETE!");

    // Snap everything perfectly to targets (safety net)
    for (const p of groupPieces) {
      const tile = this.tilePos(p);
      const dx = p.targetX - tile.x;
      const dy = p.targetY - tile.y;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        this.shiftGroupUnclamped(p.groupId, dx, dy);
      }
    }

    // Lock all pieces - puzzle is complete!
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === completeGroupId ? { ...p, isPlaced: true, justSnapped: true } : p,
      ),
    };

    // Fire completion event
    if (groupPieces[0]) {
      this.events.onPiecePlaced?.(groupPieces[0]);
    }

    this.recomputeDerivedState();
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

    const spacing = 8;
    const cellW = w + spacing;
    const cellH = h + spacing;

    const gridCols = Math.max(1, Math.floor(zoneWidth / cellW));
    const gridRows = Math.max(1, Math.floor(zoneHeight / cellH));

    const positions: Array<{ x: number; y: number }> = [];
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const jitterX = this.rand(0, Math.min(spacing * 2, cellW - w));
        const jitterY = this.rand(0, Math.min(spacing * 2, cellH - h));

        positions.push({
          x: scatterZone.minX + col * cellW + jitterX,
          y: scatterZone.minY + row * cellH + jitterY,
        });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = this.rand(0, i);
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

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
        edges: edges[i],
        inTray: false,
      });
    }

    return pieces;
  }
}
