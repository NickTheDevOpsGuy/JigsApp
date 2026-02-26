/**
 * Minimap – overview of board for large puzzles; tap to pan, pinch to zoom.
 */
import React, { useCallback, useRef } from "react";
import type { Piece } from "@/puzzle/types";
import type { ViewportState } from "../hooks/useViewport";
import styles from "./Minimap.module.css";

type Props = {
  pieces: Piece[];
  grid: { rows: number; cols: number };
  assembledW: number;
  assembledH: number;
  viewport: ViewportState;
  containerW: number;
  containerH: number;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  visible?: boolean;
};

const MINIMAP_SIZE = 100;
const MIN_GRID_SIZE = 25; // Show minimap for 25+ pieces

export function Minimap({
  pieces,
  grid,
  assembledW,
  assembledH,
  viewport,
  containerW,
  containerH,
  setViewport,
  visible = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const placedByCell = React.useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of pieces) {
      if (!p.inTray && (p.isPlaced || p.locked)) {
        map.set(`${p.row},${p.col}`, true);
      }
    }
    return map;
  }, [pieces]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = Math.min(MINIMAP_SIZE / assembledW, MINIMAP_SIZE / assembledH);
    const drawW = assembledW * s;
    const drawH = assembledH * s;
    const offX = (MINIMAP_SIZE - drawW) / 2;
    const offY = (MINIMAP_SIZE - drawH) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    const tileW = (grid.cols > 0 ? assembledW / grid.cols : 0) * s;
    const tileH = (grid.rows > 0 ? assembledH / grid.rows : 0) * s;

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (placedByCell.get(`${r},${c}`)) {
          ctx.fillStyle = "rgba(0, 180, 100, 0.5)";
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
        }
        ctx.fillRect(offX + c * tileW, offY + r * tileH, tileW, tileH);
      }
    }

    const vpLeft = -viewport.panX / viewport.scale;
    const vpTop = -viewport.panY / viewport.scale;
    const vpW = containerW / viewport.scale;
    const vpH = containerH / viewport.scale;
    const vpDrawX = offX + (vpLeft / assembledW) * drawW;
    const vpDrawY = offY + (vpTop / assembledH) * drawH;
    const vpDrawW = (vpW / assembledW) * drawW;
    const vpDrawH = (vpH / assembledH) * drawH;

    ctx.strokeStyle = "rgba(102, 126, 234, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(vpDrawX, vpDrawY, vpDrawW, vpDrawH);
  }, [
    pieces,
    placedByCell,
    grid,
    assembledW,
    assembledH,
    viewport,
    containerW,
    containerH,
    visible,
  ]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const s = Math.min(MINIMAP_SIZE / assembledW, MINIMAP_SIZE / assembledH);
      const drawW = assembledW * s;
      const drawH = assembledH * s;
      const offX = (MINIMAP_SIZE - drawW) / 2;
      const offY = (MINIMAP_SIZE - drawH) / 2;
      const boardX = ((mx - offX) / drawW) * assembledW;
      const boardY = ((my - offY) / drawH) * assembledH;
      const newPanX = -(boardX - containerW / viewport.scale / 2) * viewport.scale;
      const newPanY = -(boardY - containerH / viewport.scale / 2) * viewport.scale;
      setViewport((prev) => ({ ...prev, panX: newPanX, panY: newPanY }));
    },
    [assembledW, assembledH, containerW, containerH, viewport.scale, setViewport],
  );

  if (!visible || grid.rows * grid.cols < MIN_GRID_SIZE) return null;

  return (
    <div className={styles.wrap}>
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        role="img"
        aria-label="Board minimap - tap to pan"
      />
    </div>
  );
}
