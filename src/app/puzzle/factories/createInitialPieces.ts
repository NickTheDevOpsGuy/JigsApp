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

  // Spacing between pieces: larger = more spread out (avoids piling on top of each other)
  const tileSize = Math.min(tileW, tileH);
  const spacing = Math.max(28, Math.floor(tileSize * 0.85));
  const cellW = w + spacing;
  const cellH = h + spacing;

  const gridCols = Math.max(1, Math.floor(zoneWidth / cellW));
  const gridRows = Math.max(1, Math.floor(zoneHeight / cellH));

  const positions: Array<{ x: number; y: number }> = [];
  const maxJitter = Math.min(
    Math.floor(spacing * 0.35),
    Math.max(0, cellW - w - 4),
    Math.max(0, cellH - h - 4),
  );
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const jitterX = maxJitter > 0 ? randInt(0, maxJitter) : 0;
      const jitterY = maxJitter > 0 ? randInt(0, maxJitter) : 0;

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

  // If there are fewer cells than pieces, add positions with strict overlap avoidance.
  const minGap = Math.max(20, Math.floor(spacing * 0.9));
  const requiredGap = w + minGap;
  while (positions.length < total) {
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const candidate = {
        x: randInt(scatterZone.minX, Math.max(scatterZone.minX, scatterZone.maxX - w)),
        y: randInt(scatterZone.minY, Math.max(scatterZone.minY, scatterZone.maxY - h)),
      };
      const tooClose = positions.some(
        (p) =>
          Math.abs(p.x - candidate.x) < requiredGap &&
          Math.abs(p.y - candidate.y) < requiredGap,
      );
      if (!tooClose) {
        positions.push(candidate);
        placed = true;
      }
    }
    if (!placed) {
      // Last resort: place in a grid pattern to guarantee separation
      const idx = positions.length;
      const cols = Math.max(1, Math.floor(zoneWidth / requiredGap));
      const extraCol = idx % cols;
      const extraRow = Math.floor(idx / cols);
      const maxX = Math.max(scatterZone.minX, scatterZone.maxX - w);
      const maxY = Math.max(scatterZone.minY, scatterZone.maxY - h);
      positions.push({
        x: Math.min(
          maxX,
          scatterZone.minX + extraCol * requiredGap + randInt(0, Math.min(6, minGap)),
        ),
        y: Math.min(
          maxY,
          scatterZone.minY + extraRow * requiredGap + randInt(0, Math.min(6, minGap)),
        ),
      });
    }
  }

  const pieces: Piece[] = [];

  for (let i = 0; i < total; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);

    const targetX = targetStartX + col * tileW;
    const targetY = targetStartY + row * tileH;

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
      inTray: false,
    });
  }

  return pieces;
}
