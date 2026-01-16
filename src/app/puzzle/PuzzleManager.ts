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

  // overall snapping distance
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
   * We assemble the solved puzzle starting at (0,0) in board space.
   * That means tile targets are:
   *   targetX = col * tileW
   *   targetY = row * tileH
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
      snapTolerancePx = 18,
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

  getState(): PuzzleState {
    return this.state;
  }

  getDragState(): DragState {
    return this.drag;
  }

  setBoardSize(boardWidth: number, boardHeight: number) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;

    // Clamp all pieces into view
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((piece) => {
        const maxX = Math.max(0, this.boardWidth - piece.w);
        const maxY = Math.max(0, this.boardHeight - piece.h);
        return {
          ...piece,
          x: clamp(piece.x, 0, maxX),
          y: clamp(piece.y, 0, maxY),
        };
      }),
    };

    this.recomputeDerivedState();
  }

  pointerDown(pieceId: PieceId, pointerX: number, pointerY: number, pieceRect: DOMRect) {
    const piece = this.findPiece(pieceId);
    if (!piece) return;

    // Lock the whole group if any piece is placed
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

    // Never move placed groups
    if (this.groupIsPlaced(active.groupId)) return;

    const rawX = pointerX - boardRect.left - this.drag.offsetX;
    const rawY = pointerY - boardRect.top - this.drag.offsetY;

    const maxX = Math.max(0, this.boardWidth - active.w);
    const maxY = Math.max(0, this.boardHeight - active.h);

    const nextX = clamp(rawX, 0, maxX);
    const nextY = clamp(rawY, 0, maxY);

    const dx = nextX - active.x;
    const dy = nextY - active.y;

    if (dx === 0 && dy === 0) return;

    /**
     * OPTION A (classic jigsaw):
     * - groups act like solid cardboard
     * - BUT: allow pulling out of existing overlaps
     * - block only moves that create NEW overlaps
     *
     * This fixes "I can't drag at all" when pieces start overlapped.
     */
    if (this.wouldCreateNewOverlaps(active.groupId, dx, dy)) return;

    // Move whole group by delta
    const gid = active.groupId;

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => {
        if (p.groupId !== gid) return p;

        const nx = clamp(p.x + dx, 0, Math.max(0, this.boardWidth - p.w));
        const ny = clamp(p.y + dy, 0, Math.max(0, this.boardHeight - p.h));

        return { ...p, x: nx, y: ny };
      }),
    };
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

  // ---------- Snapping ----------

  /**
   * Snap the active group into its solved board location.
   *
   * Pad-aware alignment:
   *   tileTopLeft = (x + pad, y + pad)
   *   target tileTopLeft = (targetX, targetY)
   */
  private trySnapActiveGroupToBoard(): boolean {
    const activeId = this.drag.activeId;
    if (!activeId) return false;

    const active = this.findPiece(activeId);
    if (!active) return false;

    const gid = active.groupId;

    // Require correct rotation
    if (active.rotation !== active.targetRotation) return false;

    const activeTileX = active.x + active.pad;
    const activeTileY = active.y + active.pad;

    const dx = active.targetX - activeTileX;
    const dy = active.targetY - activeTileY;

    if (Math.hypot(dx, dy) > this.snapTolerancePx) return false;

    // Reject snap if it would create NEW overlaps
    if (this.wouldCreateNewOverlaps(gid, dx, dy)) return false;

    this.shiftGroup(gid, dx, dy);

    // If all pieces in group have correct rotation, lock them
    const groupPieces = this.getGroupPieces(gid);
    const allRotOk = groupPieces.every((p) => p.rotation === p.targetRotation);

    if (!allRotOk) return true; // snapped, but not locked

    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === gid ? { ...p, isPlaced: true, justSnapped: true } : p,
      ),
    };

    this.events.onPiecePlaced?.(this.findPiece(activeId) ?? active);
    return true;
  }

  /**
   * Snap the active group to one of its solved neighbors (up/down/left/right).
   * When snapped, merge groups so they move together as a cluster.
   */
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

    let best: null | { neighbor: Piece; dx: number; dy: number; dist: number } = null;
    const activeTile = this.tilePos(active);

    for (const n of neighbors) {
      if (n.groupId === gid) continue;
      if (n.rotation !== n.targetRotation) continue;

      const nTile = this.tilePos(n);

      const expectedDx = (n.col - active.col) * this.tileW;
      const expectedDy = (n.row - active.row) * this.tileH;

      const moveDx = activeTile.x + expectedDx - nTile.x;
      const moveDy = activeTile.y + expectedDy - nTile.y;

      const d = Math.hypot(moveDx, moveDy);
      if (d <= this.snapTolerancePx) {
        if (!best || d < best.dist)
          best = { neighbor: n, dx: moveDx, dy: moveDy, dist: d };
      }
    }

    if (!best) return false;

    // Reject snap if it would create NEW overlaps
    if (this.wouldCreateNewOverlaps(gid, best.dx, best.dy)) return false;

    this.shiftGroup(gid, best.dx, best.dy);

    const neighborGroup = best.neighbor.groupId;
    this.mergeGroups(gid, neighborGroup);

    // Pop animation on merged cluster
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) =>
        p.groupId === neighborGroup ? { ...p, justSnapped: true } : p,
      ),
    };

    return true;
  }

  // ---------- Option A solid cluster collision (but allow pulling apart) ----------

  /**
   * Returns which OTHER groupIds this group overlaps if moved by (dx,dy).
   */
  private getOverlapsForGroup(groupId: string, dx: number, dy: number): Set<string> {
    const moving = this.getGroupPieces(groupId);
    const overlappedGroups = new Set<string>();

    for (const m of moving) {
      const ax1 = m.x + dx;
      const ay1 = m.y + dy;
      const ax2 = ax1 + m.w;
      const ay2 = ay1 + m.h;

      for (const p of this.state.pieces) {
        if (p.groupId === groupId) continue;

        const bx1 = p.x;
        const by1 = p.y;
        const bx2 = p.x + p.w;
        const by2 = p.y + p.h;

        const overlap = ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
        if (overlap) overlappedGroups.add(p.groupId);
      }
    }

    return overlappedGroups;
  }

  /**
   * Blocks movement ONLY if it would create a NEW overlap that didn't exist before.
   * This allows pulling pieces out of an existing overlap.
   */
  private wouldCreateNewOverlaps(groupId: string, dx: number, dy: number): boolean {
    const current = this.getOverlapsForGroup(groupId, 0, 0);
    const next = this.getOverlapsForGroup(groupId, dx, dy);

    for (const gid of next) {
      if (!current.has(gid)) return true;
    }

    return false;
  }

  // ---------- Group utilities ----------

  private getGroupPieces(groupId: string): Piece[] {
    return this.state.pieces.filter((p) => p.groupId === groupId);
  }

  private groupIsPlaced(groupId: string): boolean {
    return this.state.pieces.some((p) => p.groupId === groupId && p.isPlaced);
  }

  private shiftGroup(groupId: string, dx: number, dy: number) {
    this.state = {
      ...this.state,
      pieces: this.state.pieces.map((p) => {
        if (p.groupId !== groupId) return p;

        const nx = clamp(p.x + dx, 0, Math.max(0, this.boardWidth - p.w));
        const ny = clamp(p.y + dy, 0, Math.max(0, this.boardHeight - p.h));
        return { ...p, x: nx, y: ny };
      }),
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

  // ---------- Derived state ----------

  private recomputeDerivedState() {
    const placedCount = this.state.pieces.filter((p) => p.isPlaced).length;
    const isComplete = placedCount === this.state.totalCount;

    const prevComplete = this.state.isComplete;

    this.state = {
      ...this.state,
      placedCount,
      isComplete,
    };

    if (!prevComplete && isComplete) {
      this.events.onPuzzleComplete?.(this.state);
    }
  }

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

      const targetX = this.targetStartX + col * tileW;
      const targetY = this.targetStartY + row * tileH;

      // Container includes pad
      const w = tileW + pad * 2;
      const h = tileH + pad * 2;

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
