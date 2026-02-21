/**
 * useGridConfig – grid presets + custom; persisted in localStorage.
 */
import { useState, useEffect } from "react";

const GRID_KEY = "phuzzle:gridSize";
const MIN_GRID = 2;
const MAX_GRID = 12;

export type GridOption = {
  label: string;
  /** Short label for mobile dropdowns (saves space) */
  labelShort?: string;
  /** Emoji + grid only for mobile dropdown (no "Easy"/"Medium" text) */
  labelIcon?: string;
  rows: number;
  cols: number;
};

export const GRID_OPTIONS: GridOption[] = [
  {
    label: "Easy 🌱 (3×3 - 9 pieces)",
    labelShort: "3×3 Easy",
    labelIcon: "🌱 3×3",
    rows: 3,
    cols: 3,
  },
  {
    label: "Medium ⚡ (4×4 - 16 pieces)",
    labelShort: "4×4 Medium",
    labelIcon: "⚡ 4×4",
    rows: 4,
    cols: 4,
  },
  {
    label: "Hard 🔥 (5×5 - 25 pieces)",
    labelShort: "5×5 Hard",
    labelIcon: "🔥 5×5",
    rows: 5,
    cols: 5,
  },
  {
    label: "Expert 👑 (6×6 - 36 pieces)",
    labelShort: "6×6 Expert",
    labelIcon: "👑 6×6",
    rows: 6,
    cols: 6,
  },
  {
    label: "Master 🧠 (7×7 - 49 pieces)",
    labelShort: "7×7 Master",
    labelIcon: "🧠 7×7",
    rows: 7,
    cols: 7,
  },
  {
    label: "Legend 🔮 (8×8 - 64 pieces)",
    labelShort: "8×8 Legend",
    labelIcon: "🔮 8×8",
    rows: 8,
    cols: 8,
  },
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
