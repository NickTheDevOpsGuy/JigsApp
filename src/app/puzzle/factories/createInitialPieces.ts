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
  } = args;

  const total = grid.cols * grid.rows;
  const edges = buildEdgesForGrid(grid);

  // Tabs/blanks extend ~22% beyond tile edge (see shape.ts knobDepth). Pad must exceed that or shapes get clipped.
  const minPad = Math.ceil(Math.min(tileW, tileH) * 0.22);
  const effectivePad = Math.max(pad, minPad);

  const w = tileW + effectivePad * 2;
  const h = tileH + effectivePad * 2;

  // Use full board area for scattering so pieces spread out well
  const scatterStartY = Math.max(
    scatterPadding,
    Math.floor(boardHeight * scatterStartYRatio),
  );
  const scatterZone = {
    minX: scatterPadding,
    maxX: Math.max(scatterPadding + w, boardWidth - scatterPadding),
    minY: scatterStartY,
    maxY: Math.max(scatterStartY + h, boardHeight - scatterPadding),
  };
  const zoneWidth = scatterZone.maxX - scatterZone.minX;
  const zoneHeight = scatterZone.maxY - scatterZone.minY;

  // Larger spacing for bigger puzzles to avoid overlap and spread things out
  const minSpacing =
    total <= 9 ? 14 : total <= 16 ? 18 : total <= 25 ? 22 : total <= 36 ? 26 : 30;
  const spacing = minSpacing;
  const cellW = w + spacing;
  const cellH = h + spacing;

  const gridCols = Math.max(1, Math.floor(zoneWidth / cellW));
  const gridRows = Math.max(1, Math.floor(zoneHeight / cellH));

  const positions: Array<{ x: number; y: number }> = [];
  const jitterMax = Math.min(
    spacing,
    Math.floor(cellW - w) - 1,
    Math.floor(cellH - h) - 1,
  );

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const jitterX = jitterMax > 0 ? randInt(0, jitterMax) : 0;
      const jitterY = jitterMax > 0 ? randInt(0, jitterMax) : 0;
      positions.push({
        x: scatterZone.minX + col * cellW + jitterX,
        y: scatterZone.minY + row * cellH + jitterY,
      });
    }
  }

  // Shuffle positions
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
      const jitterX = jitterMax > 0 ? randInt(0, jitterMax) : 0;
      const jitterY = jitterMax > 0 ? randInt(0, jitterMax) : 0;
      positions.push({
        x: scatterZone.minX + col * cellW + jitterX,
        y: baseY + jitterY,
      });
    }
  }

  // All pieces start in the tray; player moves them to the board
  const pieces: Piece[] = [];

  for (let i = 0; i < total; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);

    const targetX = targetStartX + col * tileW;
    const targetY = targetStartY + row * tileH;

    const startInTray = true;
    const pos = positions[i];

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
