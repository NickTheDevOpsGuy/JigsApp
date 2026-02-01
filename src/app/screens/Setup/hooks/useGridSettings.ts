import { useState, useEffect, useCallback } from "react";

const GRID_KEY = "phuzzle:gridSize";

export type GridOption = {
  label: string;
  rows: number;
  cols: number;
};

export const GRID_OPTIONS: GridOption[] = [
  { label: "Easy (3×3 - 9 pieces)", rows: 3, cols: 3 },
  { label: "Medium (4×4 - 16 pieces)", rows: 4, cols: 4 },
  { label: "Hard (5×5 - 25 pieces)", rows: 5, cols: 5 },
  { label: "Expert (6×6 - 36 pieces)", rows: 6, cols: 6 },
];

export function useGridSettings() {
  const [gridIndex, setGridIndex] = useState(1); // Default to Medium

  // Load saved grid setting
  useEffect(() => {
    const existingGrid = localStorage.getItem(GRID_KEY);
    if (existingGrid) {
      const idx = GRID_OPTIONS.findIndex((g) => `${g.rows}x${g.cols}` === existingGrid);
      if (idx >= 0) setGridIndex(idx);
    }
  }, []);

  const selectedGrid = GRID_OPTIONS[gridIndex];

  const saveGrid = useCallback(() => {
    const grid = GRID_OPTIONS[gridIndex];
    localStorage.setItem(GRID_KEY, `${grid.rows}x${grid.cols}`);
  }, [gridIndex]);

  return {
    gridIndex,
    setGridIndex,
    selectedGrid,
    gridOptions: GRID_OPTIONS,
    saveGrid,
  };
}
