/** Rotating tips and quotes for the menu (by day of year for consistency). */
export const MENU_TIPS = [
  "Start with the edges.",
  "Every piece has a place.",
  "One piece at a time.",
  "Zoom in for the tricky bits.",
  "Take a breath. You've got this.",
  "Puzzles are better with sound on.",
  "Try the daily puzzle for a shared challenge.",
  "Lock pieces when you're sure they're right.",
  "Use the ghost hint if you're stuck.",
  "There's no wrong way to puzzle.",
  "Corners first, then edges.",
  "Group by color or pattern.",
  "Undo is your friend.",
  "The tray is for organizing—not giving up.",
] as const;

export function getMenuTip(): string {
  const dayOfYear = (() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  })();
  const i = dayOfYear % MENU_TIPS.length;
  return MENU_TIPS[i];
}
