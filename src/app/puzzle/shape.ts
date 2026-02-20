/**
 * shape – buildPiecePath for jigsaw pieces; knob/tab geometry.
 */
import type { EdgeType, PieceEdges } from "./types";
import type { CutType } from "./cutType";
import { CUT_DEPTH_RATIO, CUT_WIDTH_RATIO } from "./cutType";

type ShapeArgs = {
  tileW: number;
  tileH: number;
  pad: number;
  edges: PieceEdges;
  cutType?: CutType;
};

function knobDepth(tileW: number, tileH: number, cutType: CutType = "classic") {
  const ratio = CUT_DEPTH_RATIO[cutType];
  return Math.round(Math.min(tileW, tileH) * ratio);
}

function knobWidth(
  tileW: number,
  tileH: number,
  horizontal: boolean,
  cutType: CutType = "classic",
) {
  const base = horizontal ? tileW : tileH;
  const ratio = CUT_WIDTH_RATIO[cutType];
  return Math.round(base * ratio);
}

function edgeDir(edge: EdgeType): 0 | 1 | -1 {
  if (edge === "flat") return 0;
  return edge === "tab" ? 1 : -1;
}

export function buildPiecePath(args: ShapeArgs): string {
  const { tileW, tileH, pad, edges, cutType = "classic" } = args;

  const kd = knobDepth(tileW, tileH, cutType);
  const kwTop = knobWidth(tileW, tileH, true, cutType);
  const kwSide = knobWidth(tileW, tileH, false, cutType);

  // Tile rect inside the padded container
  const x0 = pad;
  const y0 = pad;
  const x1 = pad + tileW;
  const y1 = pad + tileH;

  const topDir = edgeDir(edges.top);
  const rightDir = edgeDir(edges.right);
  const bottomDir = edgeDir(edges.bottom);
  const leftDir = edgeDir(edges.left);

  // Helpers: build a "knob" in the middle of an edge.
  // We approximate with 2 cubic curves that go out and come back.
  function topEdge(): string {
    const mid = (x0 + x1) / 2;
    const a = mid - kwTop / 2;
    const b = mid + kwTop / 2;
    const out = -kd * topDir; // tab goes up (negative y), blank goes down (positive y)

    if (topDir === 0) return `L ${x1} ${y0}`;

    return [
      `L ${a} ${y0}`,
      // first curve out
      `C ${a + kwTop * 0.12} ${y0} ${a + kwTop * 0.12} ${y0 + out} ${mid} ${y0 + out}`,
      // second curve back
      `C ${b - kwTop * 0.12} ${y0 + out} ${b - kwTop * 0.12} ${y0} ${b} ${y0}`,
      `L ${x1} ${y0}`,
    ].join(" ");
  }

  function rightEdge(): string {
    const mid = (y0 + y1) / 2;
    const a = mid - kwSide / 2;
    const b = mid + kwSide / 2;
    const out = kd * rightDir; // tab goes right (positive x), blank goes left (negative x)

    if (rightDir === 0) return `L ${x1} ${y1}`;

    return [
      `L ${x1} ${a}`,
      `C ${x1} ${a + kwSide * 0.12} ${x1 + out} ${a + kwSide * 0.12} ${x1 + out} ${mid}`,
      `C ${x1 + out} ${b - kwSide * 0.12} ${x1} ${b - kwSide * 0.12} ${x1} ${b}`,
      `L ${x1} ${y1}`,
    ].join(" ");
  }

  function bottomEdge(): string {
    const mid = (x0 + x1) / 2;
    const a = mid + kwTop / 2;
    const b = mid - kwTop / 2;
    const out = kd * bottomDir; // tab goes down (positive y), blank goes up (negative y)

    if (bottomDir === 0) return `L ${x0} ${y1}`;

    // We are going from right to left along bottom edge
    return [
      `L ${a} ${y1}`,
      `C ${a - kwTop * 0.12} ${y1} ${a - kwTop * 0.12} ${y1 + out} ${mid} ${y1 + out}`,
      `C ${b + kwTop * 0.12} ${y1 + out} ${b + kwTop * 0.12} ${y1} ${b} ${y1}`,
      `L ${x0} ${y1}`,
    ].join(" ");
  }

  function leftEdge(): string {
    const mid = (y0 + y1) / 2;
    const a = mid + kwSide / 2;
    const b = mid - kwSide / 2;
    const out = -kd * leftDir; // tab goes left (negative x), blank goes right (positive x)

    if (leftDir === 0) return `L ${x0} ${y0}`;

    // We are going from bottom to top along left edge
    return [
      `L ${x0} ${a}`,
      `C ${x0} ${a - kwSide * 0.12} ${x0 + out} ${a - kwSide * 0.12} ${x0 + out} ${mid}`,
      `C ${x0 + out} ${b + kwSide * 0.12} ${x0} ${b + kwSide * 0.12} ${x0} ${b}`,
      `L ${x0} ${y0}`,
    ].join(" ");
  }

  // Build path clockwise
  const d = [`M ${x0} ${y0}`, topEdge(), rightEdge(), bottomEdge(), leftEdge(), `Z`].join(
    " ",
  );

  return d;
}
