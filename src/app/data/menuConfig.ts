/**
 * menuConfig – hierarchical menu structure.
 * Used by MenuScreen (home) and HeaderMenu (in-play hamburger).
 */
import type { Theme } from "@/hooks/useTheme";
import { THEME_LABELS } from "@/hooks/useTheme";
import { GRID_OPTIONS } from "@/screens/Setup/hooks/useGridConfig";

const TIME_MODE_LABELS: Record<string, string> = {
  elapsed: "Elapsed",
  countdown: "Countdown",
  active: "Active only",
  relaxed: "Relaxed (no timer)",
  best: "Best time",
};

export type MenuNode =
  | {
      type: "folder";
      id: string;
      label: string;
      children: MenuNode[];
      collapsible?: boolean;
    }
  | { type: "action"; id: string; label: string }
  | { type: "theme"; id: string }
  | { type: "toggle"; id: string; label: string; getLabel?: (on: boolean) => string }
  | { type: "navigate"; id: string; label: string; path: string }
  | { type: "custom"; id: string; render: "theme" | "divider" };

/** Root menu tree. Some leaves are placeholders for future features. */
export function getMenuTree(): MenuNode[] {
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
                  id: "time-elapsed",
                  label: TIME_MODE_LABELS["elapsed"],
                },
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
            { type: "action", id: "daily-easy", label: "Easy 🌱" },
            { type: "action", id: "daily-medium", label: "Medium ⚡" },
            { type: "action", id: "daily-hard", label: "Hard 🔥" },
            { type: "action", id: "daily-expert", label: "Expert 👑" },
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
    {
      type: "folder",
      id: "gameplay",
      label: "Gameplay",
      children: [
        {
          type: "folder",
          id: "interaction",
          label: "Interaction",
          children: [
            { type: "toggle", id: "pieceLocking", label: "Lock Pieces (Tap to Rotate)" },
          ],
        },
        {
          type: "folder",
          id: "timeDisplay",
          label: "Time Display",
          children: [
            { type: "action", id: "timeModeQuick", label: "Time mode (tap to cycle)" },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "assistance",
      label: "Assistance",
      children: [
        {
          type: "folder",
          id: "reference",
          label: "Reference",
          children: [
            {
              type: "toggle",
              id: "showPreview",
              label: "Show Reference Image",
              getLabel: (on) => (on ? "Show Reference: on" : "Show Reference: off"),
            },
          ],
        },
        {
          type: "folder",
          id: "hints",
          label: "Hints",
          children: [
            {
              type: "toggle",
              id: "ghostWhenIdle",
              label: "Ghost When Idle",
              getLabel: (on) => (on ? "Ghost When Idle: on" : "Ghost When Idle: off"),
            },
            {
              type: "toggle",
              id: "ghostHint",
              label: "Ghost Hint (wrong rotation)",
              getLabel: (on) => (on ? "Ghost hint: on" : "Ghost hint: off"),
            },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "social",
      label: "Social",
      children: [
        {
          type: "folder",
          id: "leaderboards",
          label: "Leaderboards",
          children: [
            { type: "navigate", id: "stats", label: "Overview", path: "/stats" },
          ],
        },
        {
          type: "folder",
          id: "profile",
          label: "Profile",
          children: [
            {
              type: "navigate",
              id: "statsProfile",
              label: "Edit Profile",
              path: "/stats?tab=profile",
            },
          ],
        },
        {
          type: "action",
          id: "achievements",
          label: "Achievements",
        },
        {
          type: "folder",
          id: "share",
          label: "Share",
          children: [
            { type: "action", id: "shareCompletion", label: "Share Completion" },
            { type: "action", id: "playWithFriend", label: "Play With Friend (Co-op)" },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "audio",
      label: "Audio",
      children: [
        {
          type: "toggle",
          id: "sound",
          label: "Master Sound",
          getLabel: (on) => (on ? "Sound: on" : "Sound: off"),
        },
        {
          type: "toggle",
          id: "haptics",
          label: "Haptics",
          getLabel: (on) => (on ? "Haptics: on" : "Haptics: off"),
        },
      ],
    },
    {
      type: "folder",
      id: "stats",
      label: "Stats",
      children: [
        { type: "navigate", id: "statsOverview", label: "Overview", path: "/stats" },
        { type: "navigate", id: "statsStreaks", label: "Streaks", path: "/stats" },
        {
          type: "navigate",
          id: "statsHistory",
          label: "Completion History",
          path: "/stats",
        },
      ],
    },
    {
      type: "folder",
      id: "advanced",
      label: "Advanced",
      collapsible: true,
      children: [
        {
          type: "folder",
          id: "performance",
          label: "Performance",
          children: [{ type: "toggle", id: "perfOverlay", label: "Performance Overlay" }],
        },
        {
          type: "folder",
          id: "debug",
          label: "Debug",
          children: [
            { type: "toggle", id: "debugOverlay", label: "Show Snap Boundaries" },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "help",
      label: "Help",
      children: [
        { type: "action", id: "howToPlay", label: "How To Play" },
        { type: "action", id: "keyboardShortcuts", label: "Keyboard & Controls" },
        { type: "action", id: "whatsNew", label: "What's New" },
        { type: "action", id: "about", label: "About Phuzzle" },
      ],
    },
  ];
}
