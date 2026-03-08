import { formatTime } from "@/screens/Play/core/utils/playUtils";

type ShareMessageArgs = {
  elapsedSeconds: number;
  pieceCount: number;
  playUrl: string;
  accuracyPercent?: number;
  moveCount?: number;
  maxGroupSize?: number;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getDifficultyLabel(pieceCount: number): string {
  if (pieceCount <= 9) return "Easy";
  if (pieceCount <= 16) return "Medium";
  if (pieceCount <= 25) return "Hard";
  if (pieceCount <= 36) return "Expert";
  if (pieceCount <= 49) return "Master";
  if (pieceCount <= 64) return "Legend";
  return "Extreme";
}

export function getPiecesLine(pieceCount: number): string {
  if (pieceCount <= 0) return "Custom Puzzle";
  return `${pieceCount} Pieces • ${getDifficultyLabel(pieceCount)}`;
}

export function buildProgressShareMessage(args: ShareMessageArgs): string {
  const accuracy = clampPercent(args.accuracyPercent ?? 100);
  return [
    "🧩 Puzzle complete! Nice solve!",
    "",
    `• Time: ${formatTime(args.elapsedSeconds)}`,
    `• ${getPiecesLine(args.pieceCount)}`,
    `• ${accuracy}% accuracy`,
    "",
    "Same puzzle, same difficulty:",
    "",
    args.playUrl,
  ].join("\n");
}

const CHALLENGE_PHRASES = [
  "BOOM! I just crushed that puzzle! 😎",
  "Another one in the books! 💪",
  "Puzzle demolished. Your turn. 🧩",
  "That was too easy. Try me. 😏",
  "Solved. Who's next? 👀",
  "Crushed it. Think you can keep up? 🏆",
  "Done and dusted. Beat that! ✨",
  "Easy. Your move. 😉",
];

function pickChallengePhrase(): string {
  return CHALLENGE_PHRASES[Math.floor(Math.random() * CHALLENGE_PHRASES.length)];
}

export function buildChallengeShareMessage(args: ShareMessageArgs): string {
  const timeAndMoves =
    args.moveCount != null && args.moveCount > 0
      ? `I did it in ${formatTime(args.elapsedSeconds)} and ${args.moveCount} moves.`
      : `I did it in ${formatTime(args.elapsedSeconds)}.`;
  const largestMerge =
    args.maxGroupSize != null && args.maxGroupSize > 0
      ? `• Largest merge: ${args.maxGroupSize} ${args.maxGroupSize === 1 ? "piece" : "pieces"}`
      : null;
  const bullets = [
    `• ${pickChallengePhrase()}`,
    `• ${timeAndMoves}`,
    ...(largestMerge ? [largestMerge] : []),
    "• Think you can beat me? Let me know if you need lessons! 😉",
  ];
  return [
    "🧩 Phuzzle Challenge",
    "",
    ...bullets,
    "",
    "Same puzzle, same difficulty:",
    "",
    args.playUrl,
  ].join("\n");
}
