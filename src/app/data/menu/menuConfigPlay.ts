/**
 * Play section of the menu tree (New Puzzle, Daily, Packs).
 */
import type { MenuNode } from "./menuConfigConstants";

export function getPlayMenuNodes(): MenuNode[] {
  return [
    {
      type: "folder",
      id: "play",
      label: "Play",
      children: [
        {
          type: "action",
          id: "newPuzzle",
          label: "New Puzzle",
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
