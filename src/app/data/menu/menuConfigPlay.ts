/**
 * Play section of the menu tree (New Puzzle, Daily, Packs).
 */
import { GRID_OPTIONS } from "@/screens/Setup/hooks/useGridConfig";
import { TIME_MODE_LABELS } from "./menuConfigConstants";
import type { MenuNode } from "./menuConfigConstants";

export function getPlayMenuNodes(): MenuNode[] {
  return [
    {
      type: "folder",
      id: "play",
      label: "Play",
      children: [
        {
          type: "folder",
          id: "newPuzzle",
          label: "New Puzzle",
          children: [
            {
              type: "folder",
              id: "selectImage",
              label: "Select Image",
              children: [
                { type: "navigate", id: "gallery", label: "Gallery", path: "/new" },
                {
                  type: "navigate",
                  id: "upload",
                  label: "Upload File",
                  path: "/new?source=upload",
                },
                {
                  type: "navigate",
                  id: "camera",
                  label: "Camera",
                  path: "/new?source=camera",
                },
              ],
            },
            {
              type: "folder",
              id: "selectDifficulty",
              label: "Select Difficulty",
              children: [
                ...GRID_OPTIONS.filter((g) => g.rows > 0).map((g) => ({
                  type: "action" as const,
                  id: `grid-${g.rows}x${g.cols}`,
                  label: g.label,
                })),
                { type: "action", id: "grid-custom", label: "Custom" },
              ],
            },
            {
              type: "folder",
              id: "timeMode",
              label: "Time Mode",
              children: [
                {
                  type: "action",
                  id: "time-countdown",
                  label: TIME_MODE_LABELS["countdown"],
                },
                { type: "action", id: "time-active", label: TIME_MODE_LABELS["active"] },
                {
                  type: "action",
                  id: "time-relaxed",
                  label: TIME_MODE_LABELS["relaxed"],
                },
              ],
            },
          ],
        },
        {
          type: "folder",
          id: "dailyPuzzle",
          label: "Daily Puzzle",
          children: [
            { type: "action", id: "daily-easy", label: "Easy" },
            { type: "action", id: "daily-medium", label: "Medium" },
            { type: "action", id: "daily-hard", label: "Hard" },
            { type: "action", id: "daily-expert", label: "Expert" },
          ],
        },
        {
          type: "folder",
          id: "puzzlePacks",
          label: "Puzzle Packs",
          children: [
            { type: "navigate", id: "packs", label: "Browse Packs", path: "/packs" },
          ],
        },
      ],
    },
  ];
}
