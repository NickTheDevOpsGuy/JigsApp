/**
 * Rest of menu tree: Gameplay, Assistance, Social, Audio, Stats, Advanced, Help.
 */
import type { MenuNode } from "./menuConfigConstants";

export function getRestMenuNodes(): MenuNode[] {
  return [
    {
      type: "folder",
      id: "gameplay",
      label: "Gameplay",
      children: [
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
            {
              type: "toggle",
              id: "pieceLocking",
              label: "Unlock Pieces (Alpha)",
              getLabel: (on) =>
                on ? "Unlock pieces (alpha): off" : "Unlock pieces (alpha): on",
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
          label: "Leaderboard",
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
      label: "Leaderboard",
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
            {
              type: "toggle",
              id: "debugOverlay",
              label: "Show Snap Boundaries",
            },
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
