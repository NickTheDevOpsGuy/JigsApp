import { useState, useEffect } from "react";

const GRID_KEY = "phuzzle:gridSize";
const MIN_GRID = 2;
const MAX_GRID = 12;

export type GridOption = {
  label: string;
  rows: number;
  cols: number;
};

export const GRID_OPTIONS: GridOption[] = [
  { label: "Easy 🌱 (3×3 - 9 pieces)", rows: 3, cols: 3 },
  { label: "Medium ⚡ (4×4 - 16 pieces)", rows: 4, cols: 4 },
  { label: "Hard 🔥 (5×5 - 25 pieces)", rows: 5, cols: 5 },
  { label: "Expert 👑 (6×6 - 36 pieces)", rows: 6, cols: 6 },
  { label: "Custom", rows: 0, cols: 0 },
];

export function useGridConfig() {
  const [gridIndex, setGridIndex] = useState(1); // Default to Medium
  const [customRows, setCustomRows] = useState(5);
  const [customCols, setCustomCols] = useState(5);

  useEffect(() => {
    const existingGrid = localStorage.getItem(GRID_KEY);
    if (existingGrid) {
      const idx = GRID_OPTIONS.findIndex(
        (g) => g.rows > 0 && `${g.rows}x${g.cols}` === existingGrid,
      );
      if (idx >= 0) {
        setGridIndex(idx);
      } else {
        const [r, c] = existingGrid.split("x").map(Number);
        if (r >= MIN_GRID && r <= MAX_GRID && c >= MIN_GRID && c <= MAX_GRID) {
          setGridIndex(GRID_OPTIONS.length - 1); // Custom
          setCustomRows(r);
          setCustomCols(c);
        }
      }
    }
  }, []);

  const isCustom = gridIndex === GRID_OPTIONS.length - 1;
  const effectiveRows = isCustom ? customRows : GRID_OPTIONS[gridIndex].rows;
  const effectiveCols = isCustom ? customCols : GRID_OPTIONS[gridIndex].cols;

  const saveGrid = () => {
    localStorage.setItem(GRID_KEY, `${effectiveRows}x${effectiveCols}`);
  };

  return {
    gridIndex,
    setGridIndex,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    isCustom,
    effectiveRows,
    effectiveCols,
    saveGrid,
    minGrid: MIN_GRID,
    maxGrid: MAX_GRID,
  };
}
