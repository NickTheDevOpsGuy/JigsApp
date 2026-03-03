/** Random completion messages for variety and delight. */
export const COMPLETION_MESSAGES = [
  "Complete!",
  "You did it!",
  "Puzzle master!",
  "So satisfying!",
  "Nailed it!",
  "Piece of cake!",
  "Done and done!",
  "All together!",
  "Perfect fit!",
  "Well done!",
] as const;

const CALM_MESSAGES = [
  "Complete!",
  "Well done.",
  "All together.",
  "Peaceful finish.",
  "Nicely done.",
  "You did it.",
] as const;

const COMPETITIVE_MESSAGES = [
  "Nailed it!",
  "Speed run!",
  "Crushed it!",
  "Lightning finish!",
  "You did it!",
  "Puzzle master!",
] as const;

export function getCompletionMessage(
  seed: number,
  uiTone?: "competitive" | "calm",
): string {
  if (uiTone === "calm") {
    const i = Math.abs(seed) % CALM_MESSAGES.length;
    return CALM_MESSAGES[i];
  }
  if (uiTone === "competitive") {
    const i = Math.abs(seed) % COMPETITIVE_MESSAGES.length;
    return COMPETITIVE_MESSAGES[i];
  }
  const i = Math.abs(seed) % COMPLETION_MESSAGES.length;
  return COMPLETION_MESSAGES[i];
}

/** Dynamic badge based on time, undos. "Chill Mode", "Speed Demon", "Precision Pro", etc. */
export function getCompletionBadge(
  elapsedSeconds: number,
  undoCount: number,
  pieceCount: number,
): string {
  const timePerPiece = pieceCount > 0 ? elapsedSeconds / pieceCount : elapsedSeconds;
  if (undoCount <= 0 && timePerPiece < 10) return "Speed Demon";
  if (undoCount <= 1 && timePerPiece < 15) return "Precision Pro";
  if (undoCount >= 12 || timePerPiece > 55) return "Chill Mode";
  if (elapsedSeconds < 75 && pieceCount >= 16) return "Lightning";
  if (undoCount >= 6) return "Persistent";
  return "Puzzle Pro";
}
