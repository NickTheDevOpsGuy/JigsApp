import { formatTime } from "@/screens/Play/core/utils/playUtils";

export type ShareMessageArgs = {
  elapsedSeconds: number;
  pieceCount: number;
  playUrl: string;
  accuracyPercent?: number;
  moveCount?: number;
  maxGroupSize?: number;
  /** Display name of the puzzle (e.g. from win screen data). */
  puzzleName?: string;
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

export function buildChallengePlayUrl(
  playUrl: string,
  elapsedSeconds: number,
  moveCount = 0,
): string {
  const isAbsolute = /^https?:\/\//i.test(playUrl);
  const base = isAbsolute ? undefined : "https://phuzzle.vercel.app";
  const url = new URL(playUrl, base);
  url.searchParams.set("ct", String(elapsedSeconds));
  url.searchParams.set("cm", String(moveCount));
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Share Result – brag/summary share. Exact message structure per spec.
 */
export function buildProgressShareMessage(args: ShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const difficulty = getDifficultyLabel(args.pieceCount);
  const pieces = args.pieceCount;
  const moves = args.moveCount ?? 0;
  const puzzleName = args.puzzleName?.trim() || "Puzzle";
  const accuracy = clampPercent(args.accuracyPercent ?? 100);
  return [
    "🧩 Phuzzle Complete",
    "",
    puzzleName,
    `${difficulty} • ${pieces} pieces`,
    "",
    `⏱ Time: ${time}`,
    `🔁 Moves: ${moves}`,
    `↩️ Turns: ${moves}`,
    `🎯 Accuracy: ${accuracy}%`,
    "",
    "Play this exact puzzle:",
    args.playUrl,
  ].join("\n");
}

/** Daily Share – Wordle-style compact format. Only for Daily Puzzle. */
export type DailyShareMessageArgs = {
  dailyNumber: number;
  pieceCount: number;
  elapsedSeconds: number;
  moveCount: number;
  dailyLink: string;
  /** 4 cells: completed, good time, efficient moves, clean solve (no hint/undo). Deterministic. */
  completionGrid: string;
};

export function buildDailyShareMessage(args: DailyShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const difficulty = getDifficultyLabel(args.pieceCount);
  return [
    `Phuzzle Daily #${args.dailyNumber}`,
    `${difficulty} • ${args.pieceCount} pieces`,
    "",
    `⏱ ${time}`,
    `🔁 ${args.moveCount}`,
    "",
    args.completionGrid,
    "",
    "Play:",
    args.dailyLink,
  ].join("\n");
}

/** Deterministic 4-cell grid: completed, good time, efficient moves, no hint/undo. */
export type DailyShareGridArgs = {
  pieceCount: number;
  elapsedSeconds: number;
  moveCount: number;
  usedHint: boolean;
  undoCount: number;
};

const FILLED = "🟦";
const EMPTY = "⬜";

export function getDailyShareCompletionGrid(args: DailyShareGridArgs): string {
  const { pieceCount, elapsedSeconds, moveCount, usedHint, undoCount } = args;
  const completed = true;
  const goodTime = elapsedSeconds <= Math.ceil(pieceCount * 3.5);
  const efficientMoves = moveCount <= pieceCount * 2.5;
  const cleanSolve = !usedHint && undoCount === 0;
  const c1 = completed ? FILLED : EMPTY;
  const c2 = goodTime ? FILLED : EMPTY;
  const c3 = efficientMoves ? FILLED : EMPTY;
  const c4 = cleanSolve ? FILLED : EMPTY;
  return `${c1}${c2}${c3}${c4}`;
}

/**
 * Beat My Puzzle – challenge share. Per spec: "I solved this puzzle in 1:42 with 31 moves. Think you can beat me?" + puzzle image, difficulty, puzzle link.
 */
export function buildChallengeShareMessage(args: ShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const moves = args.moveCount ?? 0;
  const puzzleName = args.puzzleName?.trim() || "Puzzle";
  const difficulty = getDifficultyLabel(args.pieceCount);
  const challengeUrl = buildChallengePlayUrl(args.playUrl, args.elapsedSeconds, moves);
  return [
    "🧩 Phuzzle Challenge",
    "",
    `I finished ${puzzleName} in ${time} with ${moves} moves.`,
    "Can you best me? Prove it!",
    "",
    `${difficulty} • ${args.pieceCount} pieces`,
    `⏱ Time to beat: ${time}`,
    `🔁 Moves to beat: ${moves}`,
    `↩️ Turns to beat: ${moves}`,
    "",
    "Play this exact puzzle:",
    challengeUrl,
  ].join("\n");
}
