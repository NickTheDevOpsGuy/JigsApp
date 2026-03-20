/**
 * shape – buildPiecePath for jigsaw pieces.
 * Circular knob geometry: single cubic neck sweep + k=0.5523 circle arc.
 */
import type { EdgeType, PieceEdges, PieceCutType } from "@/puzzle/core/types";

type ShapeArgs = {
  tileW: number;
  tileH: number;
  pad: number;
  edges: PieceEdges;
  cutType?: PieceCutType;
};

const CUT_PARAMS: Record<PieceCutType, { depthPct: number; neckRatio: number; bulbRadiusRatio: number }> = {
  classic:   { depthPct: 0.26, neckRatio: 0.42, bulbRadiusRatio: 0.36 },
  irregular: { depthPct: 0.28, neckRatio: 0.40, bulbRadiusRatio: 0.38 },
  hard:      { depthPct: 0.20, neckRatio: 0.46, bulbRadiusRatio: 0.30 },
};

// Bezier magic number for circular arc: 4/3 * tan(π/8) ≈ 0.5523
const K = 0.5523;

function getKnobDims(tileW: number, tileH: number, cutType: PieceCutType) {
  const p = CUT_PARAMS[cutType];
  const depth = Math.max(14, Math.min(56, Math.round(Math.min(tileW, tileH) * p.depthPct)));
  const knobW = tileW * 0.44;
  const neckW = knobW * p.neckRatio;
  const radius = knobW * p.bulbRadiusRatio;
  return { depth, neckW, radius };
}

function edgeDir(edge: EdgeType): 0 | 1 | -1 {
  if (edge === "flat") return 0;
  return edge === "tab" ? 1 : -1;
}

export function buildPiecePath(args: ShapeArgs): string {
  const { tileW, tileH, pad, edges, cutType = "classic" } = args;
  const { depth, neckW, radius } = getKnobDims(tileW, tileH, cutType);
  const hk = K * radius;

  const x0 = pad, y0 = pad;
  const x1 = pad + tileW, y1 = pad + tileH;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;

  const topDir    = edgeDir(edges.top);
  const rightDir  = edgeDir(edges.right);
  const bottomDir = edgeDir(edges.bottom);
  const leftDir   = edgeDir(edges.left);

  // TOP edge (left→right). tab: s=-1 (up), socket: s=+1 (into piece)
  function topEdge(): string {
    if (topDir === 0) return `L ${x1} ${y0}`;
    const s = -topDir;
    const cx = mx, cy = y0 + s * (depth - radius);
    const tangY = cy - s * radius;
    const nl = cx - neckW, nr = cx + neckW;
    const mc = s * Math.abs(tangY - y0) * 0.55;
    return [
      `L ${nl} ${y0}`,
      `C ${nl} ${y0 + mc} ${cx - radius} ${tangY} ${cx - radius} ${cy}`,
      `C ${cx - radius} ${cy + s * hk} ${cx - hk} ${cy + s * radius} ${cx} ${cy + s * radius}`,
      `C ${cx + hk} ${cy + s * radius} ${cx + radius} ${cy + s * hk} ${cx + radius} ${cy}`,
      `C ${cx + radius} ${tangY} ${nr} ${y0 + mc} ${nr} ${y0}`,
      `L ${x1} ${y0}`,
    ].join(" ");
  }

  // RIGHT edge (top→bottom). tab: s=+1 (right), socket: s=-1 (into piece)
  function rightEdge(): string {
    if (rightDir === 0) return `L ${x1} ${y1}`;
    const s = rightDir;
    const cy = my, cx = x1 + s * (depth - radius);
    const tangX = cx - s * radius;
    const nl = cy - neckW, nr = cy + neckW;
    const mc = s * Math.abs(tangX - x1) * 0.55;
    return [
      `L ${x1} ${nl}`,
      `C ${x1 + mc} ${nl} ${tangX} ${cy - radius} ${cx} ${cy - radius}`,
      `C ${cx + s * hk} ${cy - radius} ${cx + s * radius} ${cy - hk} ${cx + s * radius} ${cy}`,
      `C ${cx + s * radius} ${cy + hk} ${cx + s * hk} ${cy + radius} ${cx} ${cy + radius}`,
      `C ${tangX} ${cy + radius} ${x1 + mc} ${nr} ${x1} ${nr}`,
      `L ${x1} ${y1}`,
    ].join(" ");
  }

  // BOTTOM edge (right→left). tab: s=+1 (down), socket: s=-1 (into piece)
  function bottomEdge(): string {
    if (bottomDir === 0) return `L ${x0} ${y1}`;
    const s = bottomDir;
    const cx = mx, cy = y1 + s * (depth - radius);
    const tangY = cy - s * radius;
    const nl = cx + neckW, nr = cx - neckW;
    const mc = s * Math.abs(tangY - y1) * 0.55;
    return [
      `L ${nl} ${y1}`,
      `C ${nl} ${y1 + mc} ${cx + radius} ${tangY} ${cx + radius} ${cy}`,
      `C ${cx + radius} ${cy + s * hk} ${cx + hk} ${cy + s * radius} ${cx} ${cy + s * radius}`,
      `C ${cx - hk} ${cy + s * radius} ${cx - radius} ${cy + s * hk} ${cx - radius} ${cy}`,
      `C ${cx - radius} ${tangY} ${nr} ${y1 + mc} ${nr} ${y1}`,
      `L ${x0} ${y1}`,
    ].join(" ");
  }

  // LEFT edge (bottom→top). tab: s=-1 (left), socket: s=+1 (into piece)
  function leftEdge(): string {
    if (leftDir === 0) return `L ${x0} ${y0}`;
    const s = -leftDir;
    const cy = my, cx = x0 + s * (depth - radius);
    const tangX = cx - s * radius;
    const nl = cy + neckW, nr = cy - neckW;
    const mc = s * Math.abs(tangX - x0) * 0.55;
    return [
      `L ${x0} ${nl}`,
      `C ${x0 + mc} ${nl} ${tangX} ${cy + radius} ${cx} ${cy + radius}`,
      `C ${cx + s * hk} ${cy + radius} ${cx + s * radius} ${cy + hk} ${cx + s * radius} ${cy}`,
      `C ${cx + s * radius} ${cy - hk} ${cx + s * hk} ${cy - radius} ${cx} ${cy - radius}`,
      `C ${tangX} ${cy - radius} ${x0 + mc} ${nr} ${x0} ${nr}`,
      `L ${x0} ${y0}`,
    ].join(" ");
  }

  return [`M ${x0} ${y0}`, topEdge(), rightEdge(), bottomEdge(), leftEdge(), `Z`].join(" ");
}
