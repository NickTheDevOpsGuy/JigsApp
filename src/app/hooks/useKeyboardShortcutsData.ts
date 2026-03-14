export const SHORTCUTS = [
  { keys: ["Space"], action: "Pause / Resume" },
  { keys: ["Tab"], action: "Select next piece" },
  { keys: ["Shift+Tab"], action: "Select previous piece" },
  { keys: ["R"], action: "Rotate selected piece" },
  { keys: ["Shift+R"], action: "Rotate counter-clockwise" },
  { keys: ["↑ ↓ ← →"], action: "Move selected piece" },
  { keys: ["Ctrl+Z", "⌘Z"], action: "Undo" },
  { keys: ["Ctrl+Shift+Z", "⌘⇧Z", "Ctrl+Y", "⌘Y"], action: "Redo" },
  { keys: ["P"], action: "Toggle preview" },
  { keys: ["F"], action: "Fullscreen" },
  { keys: ["M"], action: "Mute / Unmute sound" },
  { keys: ["H"], action: "Toggle haptics" },
  { keys: ["N"], action: "New puzzle" },
  { keys: ["?", "F1"], action: "Show shortcuts" },
  { keys: ["Esc"], action: "Close / Unpause" },
] as const;

export const SHORTCUT_GROUPS = [
  {
    id: "gameplay",
    title: "Gameplay",
    shortcuts: [
      { keys: ["Space"], action: "Pause / Resume" },
      { keys: ["Ctrl+Z", "⌘Z"], action: "Undo" },
      { keys: ["Ctrl+Shift+Z", "⌘⇧Z"], action: "Redo" },
      { keys: ["P"], action: "Toggle preview" },
      { keys: ["N"], action: "New puzzle" },
      { keys: ["Esc"], action: "Close / Unpause" },
    ],
  },
  {
    id: "pieceControl",
    title: "Piece Control",
    shortcuts: [
      { keys: ["Tab"], action: "Select next piece" },
      { keys: ["Shift", "Tab"], action: "Select previous piece" },
      { keys: ["R"], action: "Rotate selected piece" },
      { keys: ["Shift", "R"], action: "Rotate counter-clockwise" },
      { keys: ["↑", "↓", "←", "→"], action: "Move selected piece" },
    ],
  },
  {
    id: "displayAudio",
    title: "Display & Audio",
    shortcuts: [
      { keys: ["F"], action: "Fullscreen" },
      { keys: ["M"], action: "Mute / Unmute sound" },
      { keys: ["H"], action: "Toggle haptics" },
    ],
  },
  {
    id: "help",
    title: "Help",
    shortcuts: [{ keys: ["?", "F1"], action: "Show shortcuts" }],
  },
] as const;
