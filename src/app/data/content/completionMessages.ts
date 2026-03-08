/**
 * Completion messages and badges for the completion overlay.
 */
export const COMPLETION_MESSAGES = [
  "Nice!",
  "Well done!",
  "Puzzle complete!",
  "You did it!",
  "Solved!",
  "Done!",
  "Complete!",
  "Great solve!",
  "Awesome!",
  "Nailed it!",
];

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function getCompletionMessage(seed: number): string {
  const r = seededRandom(Math.floor(seed) % 233280);
  const idx = Math.floor(r() * COMPLETION_MESSAGES.length) % COMPLETION_MESSAGES.length;
  return COMPLETION_MESSAGES[Math.abs(idx)];
}

export function getCompletionBadge(
  elapsedSeconds: number,
  undoCount: number,
  pieceCount: number,
): string {
  const timePerPiece = pieceCount > 0 ? elapsedSeconds / pieceCount : 0;

  if (undoCount >= 12 || timePerPiece > 55) return "Chill Mode";
  if (undoCount >= 6) return "Persistent";
  if (undoCount === 0 && timePerPiece < 10) return "Speed Demon";
  if (undoCount <= 1 && timePerPiece < 15) return "Precision Pro";
  if (elapsedSeconds < 75 && pieceCount >= 16 && (undoCount > 1 || timePerPiece >= 15))
    return "Lightning";

  return "Puzzle Pro";
}
