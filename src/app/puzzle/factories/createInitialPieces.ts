/**
 * createInitialPieces – builds scrambled pieces with jigsaw edges, scatter positions, targets.
 */
import type { GridSize, Piece, PieceEdges, PieceCutType } from "../types";
import { buildPiecePath } from "../shape";

const CUT_DEPTH_PCT: Record<PieceCutType, number> = {
  classic: 0.17,
  irregular: 0.2,
  hard: 0.12,
};

type CreateInitialPiecesArgs = {
  grid: GridSize;
  boardWidth: number;
  boardHeight: number;
  scatterPadding: number;
  pad: number;
  tileW: number;
  tileH: number;
  scatterStartYRatio: number;
  rotationStepDeg: 90 | 180;
  targetStartX: number;
  targetStartY: number;
  /** Inset from board edge so scatter zone and targets stay inside play area. Default 0. */
  boardInset?: number;
  /** When true, use tighter scatter for mobile (fewer columns, more rows). */
  isMobile?: boolean;
  /** Piece cut style (default: classic) */
  cutType?: PieceCutType;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randRotation(rotationStepDeg: 90 | 180): number {
  const steps = 360 / rotationStepDeg;
  const k = randInt(0, steps - 1);
  return (k * rotationStepDeg) % 360;
}

function buildEdgesForGrid(grid: GridSize): PieceEdges[] {
  const edges: PieceEdges[] = [];

  const randomTabOrBlank = (): "tab" | "blank" => (Math.random() < 0.5 ? "tab" : "blank");

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

/**
 * Creates all pieces in their initial scattered positions.
 *
 * This is a pure helper so PuzzleManager stays focused on interaction logic.
 */
export function createInitialPieces(args: CreateInitialPiecesArgs): Piece[] {
  const {
    grid,
    boardWidth,
    boardHeight,
    scatterPadding,
    pad,
    tileW,
    tileH,
    scatterStartYRatio,
    rotationStepDeg,
    targetStartX,
    targetStartY,
    boardInset = 0,
    isMobile = false,
    cutType = "classic",
  } = args;

  const total = grid.cols * grid.rows;
  const edges = buildEdgesForGrid(grid);
  const depthPct = CUT_DEPTH_PCT[cutType];
  const rawPad = Math.ceil(Math.min(tileW, tileH) * depthPct);
  const minPad = Math.max(10, Math.min(34, rawPad));
  const effectivePad = Math.max(pad, minPad);

  const w = tileW + effectivePad * 2;
  const h = tileH + effectivePad * 2;

  const scatterStartY = Math.max(
    boardInset + scatterPadding,
    Math.floor(boardHeight * scatterStartYRatio),
  );
  const scatterZone = {
    minX: boardInset + scatterPadding,
    maxX: Math.max(
      boardInset + scatterPadding,
      boardWidth - boardInset - scatterPadding - w,
    ),
    minY: scatterStartY,
    maxY: Math.max(scatterStartY, boardHeight - boardInset - scatterPadding - h),
  };
  const zoneWidth = Math.max(w, scatterZone.maxX - scatterZone.minX);
  const zoneHeight = Math.max(h, scatterZone.maxY - scatterZone.minY);

  // Min spacing by piece count: larger puzzles need more clearance for visual clarity
  const minSpacing =
    total <= 9
      ? 18
      : total <= 16
        ? 22
        : total <= 25
          ? 26
          : total <= 36
            ? 30
            : total <= 49
              ? 34
              : 40;

  // Grid-based distribution: allocate exactly total cells within zone bounds
  const cellW = w + minSpacing;
  const cellH = h + minSpacing;
  const maxCols = Math.max(1, Math.floor(zoneWidth / cellW));
  const maxRows = Math.max(1, Math.floor(zoneHeight / cellH));

  // Choose grid shape: mobile prefers fewer cols (narrower layout), desktop more square
  let gridCols: number;
  let gridRows: number;
  if (isMobile) {
    gridCols = Math.min(maxCols, Math.max(2, Math.ceil(Math.sqrt(total) * 0.8)));
    gridRows = Math.ceil(total / gridCols);
  } else {
    gridCols = Math.min(maxCols, Math.ceil(Math.sqrt(total)));
    gridRows = Math.ceil(total / gridCols);
  }
  gridCols = Math.min(gridCols, maxCols);
  gridRows = Math.min(gridRows, maxRows);

  // If we can't fit all pieces, reduce spacing until we do (with floor)
  let effectiveCellW = cellW;
  let effectiveCellH = cellH;
  while (
    gridCols * gridRows < total &&
    effectiveCellW > w + 8 &&
    effectiveCellH > h + 8
  ) {
    effectiveCellW = Math.max(w + 8, effectiveCellW - 4);
    effectiveCellH = Math.max(h + 8, effectiveCellH - 4);
    gridCols = Math.min(maxCols, Math.floor(zoneWidth / effectiveCellW));
    gridRows = Math.min(maxRows, Math.ceil(total / gridCols));
  }

  const SPAWN_RETRY_MAX = 80;
  const rangeX = Math.max(0, scatterZone.maxX - scatterZone.minX - w);
  const rangeY = Math.max(0, scatterZone.maxY - scatterZone.minY - h);

  function wouldOverlap(
    placed: Array<{ x: number; y: number }>,
    nx: number,
    ny: number,
  ): boolean {
    for (const p of placed) {
      if (!(nx + w <= p.x || p.x + w <= nx || ny + h <= p.y || p.y + h <= ny)) {
        return true;
      }
    }
    return false;
  }

  /** Random position in scatter zone (inclusive of padding so pieces don't touch edges). */
  function randomPosition(): { x: number; y: number } {
    const x =
      rangeX <= 0
        ? scatterZone.minX
        : scatterZone.minX + Math.floor(Math.random() * (rangeX + 1));
    const y =
      rangeY <= 0
        ? scatterZone.minY
        : scatterZone.minY + Math.floor(Math.random() * (rangeY + 1));
    return { x, y };
  }

  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < total; i++) {
    let x: number;
    let y: number;
    let retries = 0;
    do {
      const pos = randomPosition();
      x = pos.x;
      y = pos.y;
      retries++;
      if (retries > SPAWN_RETRY_MAX) {
        // Fallback: grid position so we always place all pieces
        const row = Math.floor(i / gridCols);
        const col = i % gridCols;
        x =
          scatterZone.minX +
          col * effectiveCellW +
          randInt(0, Math.max(0, effectiveCellW - w - 2));
        y =
          scatterZone.minY +
          row * effectiveCellH +
          randInt(0, Math.max(0, effectiveCellH - h - 2));
        break;
      }
    } while (wouldOverlap(positions, x, y));

    positions.push({ x, y });
  }

  // Shuffle so piece assignment to positions is random (which piece gets which spot)
  for (let i = positions.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // All pieces start in tray; board starts empty (build intentionally)
  const trayIndices = new Set<number>(Array.from({ length: total }, (_, i) => i));

  const pieces: Piece[] = [];

  for (let i = 0; i < total; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);

    // Integer target positions (targetStart + integer tile size) so tiles align to the pixel grid and seams line up 100%.
    const targetX = targetStartX + col * tileW;
    const targetY = targetStartY + row * tileH;

    const startInTray = trayIndices.has(i);
    const rawPos = positions[i];
    // Clamp to ensure piece stays fully on-board (piece has size w×h)
    const pos = {
      x: Math.max(scatterZone.minX, Math.min(scatterZone.maxX - w, rawPos.x)),
      y: Math.max(scatterZone.minY, Math.min(scatterZone.maxY - h, rawPos.y)),
    };

    const shapePath = buildPiecePath({
      tileW,
      tileH,
      pad: effectivePad,
      edges: edges[i],
      cutType,
    });

    pieces.push({
      id: `p${i + 1}`,
      row,
      col,
      dragCount: 0,
      x: pos.x,
      y: pos.y,
      z: i + 1,
      w,
      h,
      tileW,
      tileH,
      pad: effectivePad,
      targetX,
      targetY,
      rotation: randRotation(rotationStepDeg),
      targetRotation: 0,
      isPlaced: false,
      locked: false,
      groupId: `g${i + 1}`,
      justSnapped: false,
      shapePath,
      edges: edges[i],
      inTray: startInTray,
    });
  }

  // Randomize tray order at start (Fisher–Yates shuffle)
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }

  return pieces;
}
