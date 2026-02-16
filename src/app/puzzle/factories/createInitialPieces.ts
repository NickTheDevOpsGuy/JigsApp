/**
 * createInitialPieces – builds scrambled pieces with jigsaw edges, scatter positions, targets.
 */
import type { GridSize, Piece, PieceEdges } from "../types";
import { buildPiecePath } from "../shape";

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
  /** When true, use tighter scatter for mobile (fewer columns, more rows). */
  isMobile?: boolean;
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
    isMobile = false,
  } = args;

  const total = grid.cols * grid.rows;
  const edges = buildEdgesForGrid(grid);

  // Tabs/blanks extend ~22% beyond tile edge (see shape.ts knobDepth). Pad must exceed that or shapes get clipped.
  const minPad = Math.ceil(Math.min(tileW, tileH) * 0.22);
  const effectivePad = Math.max(pad, minPad);

  const w = tileW + effectivePad * 2;
  const h = tileH + effectivePad * 2;

  const scatterStartY = Math.max(
    scatterPadding,
    Math.floor(boardHeight * scatterStartYRatio),
  );
  const scatterZone = {
    minX: scatterPadding,
    maxX: Math.max(scatterPadding, boardWidth - scatterPadding - w),
    minY: scatterStartY,
    maxY: Math.max(scatterStartY, boardHeight - scatterPadding - h),
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

  const SPAWN_RETRY_MAX = 12;

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

  const positions: Array<{ x: number; y: number }> = [];
  const jitterSpace = Math.max(
    0,
    Math.min(
      effectiveCellW - w - 4,
      effectiveCellH - h - 4,
      Math.floor(minSpacing * 0.5),
    ),
  );

  const capacity = gridCols * gridRows;
  for (let i = 0; i < total; i++) {
    let row: number;
    let col: number;
    if (i < capacity) {
      row = Math.floor(i / gridCols);
      col = i % gridCols;
    } else {
      const overflow = i - capacity;
      row = gridRows + Math.floor(overflow / gridCols);
      col = overflow % gridCols;
    }
    const baseX = scatterZone.minX + col * effectiveCellW;
    const baseY = scatterZone.minY + row * effectiveCellH;

    let x: number;
    let y: number;
    let retries = 0;
    do {
      const jitterX = jitterSpace > 0 ? randInt(-jitterSpace, jitterSpace) : 0;
      const jitterY = jitterSpace > 0 ? randInt(-jitterSpace, jitterSpace) : 0;
      x = Math.max(scatterZone.minX, Math.min(scatterZone.maxX - w, baseX + jitterX));
      y = Math.max(scatterZone.minY, Math.min(scatterZone.maxY - h, baseY + jitterY));
      retries++;
      if (retries > SPAWN_RETRY_MAX) break;
    } while (wouldOverlap(positions, x, y));

    positions.push({ x, y });
  }

  // Shuffle so piece assignment is random
  for (let i = positions.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Add more positions in rows below if we have more pieces than grid cells
  let rowOffset = 0;
  while (positions.length < total) {
    rowOffset++;
    const baseY = scatterZone.minY + gridRows * cellH + (rowOffset - 1) * cellH;
    for (let col = 0; col < gridCols && positions.length < total; col++) {
      const jitterX = jitterSpace > 0 ? randInt(0, jitterSpace) : 0;
      const jitterY = jitterSpace > 0 ? randInt(0, jitterSpace) : 0;
      positions.push({
        x: scatterZone.minX + col * cellW + jitterX,
        y: baseY + jitterY,
      });
    }
  }

  // All pieces start in tray; board starts empty (build intentionally)
  const trayIndices = new Set<number>(Array.from({ length: total }, (_, i) => i));

  const pieces: Piece[] = [];

  for (let i = 0; i < total; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);

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
    });

    pieces.push({
      id: `p${i + 1}`,
      row,
      col,
      x: pos.x,
      y: pos.y,
      z: 1,
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

  return pieces;
}
