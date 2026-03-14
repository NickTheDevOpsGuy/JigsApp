/**
 * shape – buildPiecePath for jigsaw pieces; organic bulb-shaped tabs, smooth bezier silhouette.
 * Supports classic, irregular, and hard cut types. Border pieces use flat outer edges.
 */
import type { EdgeType, PieceEdges, PieceCutType } from "@/puzzle/core/types";

type ShapeArgs = {
  tileW: number;
  tileH: number;
  pad: number;
  edges: PieceEdges;
  cutType?: PieceCutType;
};

const CUT_PARAMS: Record<
  PieceCutType,
  { depthPct: number; widthPct: number; entryPct: number; bulbPct: number }
> = {
  // Organic bulb: smooth entry curve, rounded bulb, smooth exit. No perfect circles.
  classic: { depthPct: 0.2, widthPct: 0.34, entryPct: 0.16, bulbPct: 0.32 },
  irregular: { depthPct: 0.22, widthPct: 0.32, entryPct: 0.18, bulbPct: 0.35 },
  hard: { depthPct: 0.14, widthPct: 0.27, entryPct: 0.12, bulbPct: 0.28 },
};

function knobDepth(tileW: number, tileH: number, cutType: PieceCutType) {
  const p = CUT_PARAMS[cutType];
  const raw = Math.round(Math.min(tileW, tileH) * p.depthPct);
  return Math.max(10, Math.min(38, raw));
}

function knobWidth(
  tileW: number,
  tileH: number,
  horizontal: boolean,
  cutType: PieceCutType,
) {
  const p = CUT_PARAMS[cutType];
  const base = horizontal ? tileW : tileH;
  return Math.round(base * p.widthPct);
}

function edgeDir(edge: EdgeType): 0 | 1 | -1 {
  if (edge === "flat") return 0;
  return edge === "tab" ? 1 : -1;
}

/**
 * Organic bulb tab: smooth entry → rounded bulb → smooth exit.
 * Two cubics per tab; entryPct/bulbPct give natural curvature (not circular).
 */
export function buildPiecePath(args: ShapeArgs): string {
  const { tileW, tileH, pad, edges, cutType = "classic" } = args;
  const { entryPct, bulbPct } = CUT_PARAMS[cutType];

  const kd = knobDepth(tileW, tileH, cutType);
  const kwTop = knobWidth(tileW, tileH, true, cutType);
  const kwSide = knobWidth(tileW, tileH, false, cutType);

  const x0 = pad;
  const y0 = pad;
  const x1 = pad + tileW;
  const y1 = pad + tileH;

  const topDir = edgeDir(edges.top);
  const rightDir = edgeDir(edges.right);
  const bottomDir = edgeDir(edges.bottom);
  const leftDir = edgeDir(edges.left);

  function topEdge(): string {
    const mid = (x0 + x1) / 2;
    const a = mid - kwTop / 2;
    const b = mid + kwTop / 2;
    const out = -kd * topDir;
    if (topDir === 0) return `L ${x1} ${y0}`;
    return [
      `L ${a} ${y0}`,
      `C ${a + kwTop * entryPct} ${y0} ${mid - kwTop * bulbPct} ${y0 + out} ${mid} ${y0 + out}`,
      `C ${mid + kwTop * bulbPct} ${y0 + out} ${b - kwTop * entryPct} ${y0} ${b} ${y0}`,
      `L ${x1} ${y0}`,
    ].join(" ");
  }

  function rightEdge(): string {
    const mid = (y0 + y1) / 2;
    const a = mid - kwSide / 2;
    const b = mid + kwSide / 2;
    const out = kd * rightDir;
    if (rightDir === 0) return `L ${x1} ${y1}`;
    return [
      `L ${x1} ${a}`,
      `C ${x1 + out} ${a + kwSide * entryPct} ${x1 + out} ${mid - kwSide * bulbPct} ${x1 + out} ${mid}`,
      `C ${x1 + out} ${mid + kwSide * bulbPct} ${x1} ${b - kwSide * entryPct} ${x1} ${b}`,
      `L ${x1} ${y1}`,
    ].join(" ");
  }

  function bottomEdge(): string {
    const mid = (x0 + x1) / 2;
    const a = mid + kwTop / 2;
    const b = mid - kwTop / 2;
    const out = kd * bottomDir;
    if (bottomDir === 0) return `L ${x0} ${y1}`;
    return [
      `L ${a} ${y1}`,
      `C ${a - kwTop * entryPct} ${y1} ${mid + kwTop * bulbPct} ${y1 + out} ${mid} ${y1 + out}`,
      `C ${mid - kwTop * bulbPct} ${y1 + out} ${b + kwTop * entryPct} ${y1} ${b} ${y1}`,
      `L ${x0} ${y1}`,
    ].join(" ");
  }

  function leftEdge(): string {
    const mid = (y0 + y1) / 2;
    const a = mid + kwSide / 2;
    const b = mid - kwSide / 2;
    const out = -kd * leftDir;
    if (leftDir === 0) return `L ${x0} ${y0}`;
    return [
      `L ${x0} ${a}`,
      `C ${x0 + out} ${a - kwSide * entryPct} ${x0 + out} ${mid + kwSide * bulbPct} ${x0 + out} ${mid}`,
      `C ${x0 + out} ${mid - kwSide * bulbPct} ${x0} ${b + kwSide * entryPct} ${x0} ${b}`,
      `L ${x0} ${y0}`,
    ].join(" ");
  }

  // Build path clockwise; smooth bezier joins at corners via lineJoin in renderer
  const d = [`M ${x0} ${y0}`, topEdge(), rightEdge(), bottomEdge(), leftEdge(), `Z`].join(
    " ",
  );

  return d;
}
