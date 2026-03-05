import { formatTime } from "./playUtils";

type ShareMessageArgs = {
  elapsedSeconds: number;
  pieceCount: number;
  playUrl: string;
  accuracyPercent?: number;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getDifficultyLabel(pieceCount: number): string {
  if (pieceCount <= 9) return "Easy";
  if (pieceCount <= 16) return "Medium";
  if (pieceCount <= 25) return "Hard";
  if (pieceCount <= 36) return "Expert";
  if (pieceCount <= 49) return "Master";
  if (pieceCount <= 64) return "Legend";
  return "Extreme";
}

function getPiecesLine(pieceCount: number): string {
  if (pieceCount <= 0) return "Custom Puzzle";
  return `${pieceCount} Pieces • ${getDifficultyLabel(pieceCount)}`;
}

export function buildProgressShareMessage(args: ShareMessageArgs): string {
  const accuracy = clampPercent(args.accuracyPercent ?? 100);
  return [
    "I just finished this puzzle on Phuzzle.",
    "",
    "🧩 PHUZZLE RESULT",
    `Time: ${formatTime(args.elapsedSeconds)}`,
    getPiecesLine(args.pieceCount),
    `Accuracy: ${accuracy}%`,
    "",
    "Play this puzzle:",
    args.playUrl,
  ].join("\n");
}

export function buildChallengeShareMessage(args: ShareMessageArgs): string {
  return [
    "I just finished this puzzle and wanted to share it.",
    "",
    "🧩 PHUZZLE PUZZLE SHARE",
    `Time: ${formatTime(args.elapsedSeconds)}`,
    getPiecesLine(args.pieceCount),
    "",
    "Try the same puzzle:",
    args.playUrl,
  ].join("\n");
}
