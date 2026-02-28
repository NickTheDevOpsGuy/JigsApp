/**
 * Appearance section of the menu tree (Theme, Board, Effects).
 */
import type { Theme } from "@/hooks/useTheme";
import { THEME_LABELS } from "@/hooks/useTheme";
import type { MenuNode } from "./menuConfigConstants";

export function getAppearanceMenuNodes(): MenuNode[] {
  return [
    {
      type: "folder",
      id: "appearance",
      label: "Appearance",
      children: [
        {
          type: "folder",
          id: "theme",
          label: "Theme",
          children: (
            ["light", "dark", "space", "ocean", "forest", "sunset"] as Theme[]
          ).map((t) => ({
            type: "action" as const,
            id: `theme-${t}`,
            label: THEME_LABELS[t],
          })),
        },
        {
          type: "folder",
          id: "board",
          label: "Board",
          children: [
            {
              type: "toggle",
              id: "alignmentGrid",
              label: "Alignment Grid",
              getLabel: (on) => (on ? "Alignment Grid: on" : "Alignment Grid: off"),
            },
            {
              type: "toggle",
              id: "edgeHighlight",
              label: "Edge Highlight",
              getLabel: (on) => (on ? "Edge Highlight: on" : "Edge Highlight: off"),
            },
            { type: "action", id: "centerBoard", label: "Board Center Button" },
          ],
        },
        {
          type: "folder",
          id: "effects",
          label: "Effects",
          children: [{ type: "toggle", id: "immersiveMode", label: "Immersive Mode" }],
        },
      ],
    },
  ];
}
