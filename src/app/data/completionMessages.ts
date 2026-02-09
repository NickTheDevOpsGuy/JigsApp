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

export function getCompletionMessage(seed: number): string {
  const i = Math.abs(seed) % COMPLETION_MESSAGES.length;
  return COMPLETION_MESSAGES[i];
}
