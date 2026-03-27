import { formatTime } from "@/screens/Play/core/utils/playUtils";

export type ShareMessageArgs = {
  elapsedSeconds: number;
  pieceCount: number;
  playUrl: string;
  accuracyPercent?: number;
  moveCount?: number;
  rotationCount?: number;
  maxGroupSize?: number;
  puzzleName?: string;
  /** 0 = clean solve. */
  undoCount?: number;
  usedHint?: boolean;
};

const CHALLENGE_TAUNTS = [
  "I destroyed this puzzle. Can you even come close?",
  "Puzzle demolished. Think you can top this?",
  "Another one down. Beat this run if you can.",
  "I crushed this one. Your turn to prove it.",
] as const;

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

const SHARE_ORIGIN = "https://phuzzle.vercel.app";

/** Full https URL for pasted / preview text (matches link unfurl targets). */
export function absShareUrl(pathOrUrl: string): string {
  const t = pathOrUrl.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const path = t.startsWith("/") ? t : `/${t}`;
  return `${SHARE_ORIGIN}${path}`;
}

export function pickChallengeTaunt(randomValue = Math.random()): string {
  const index = Math.max(
    0,
    Math.min(
      CHALLENGE_TAUNTS.length - 1,
      Math.floor(randomValue * CHALLENGE_TAUNTS.length),
    ),
  );
  return CHALLENGE_TAUNTS[index];
}

/**
 * Share Result – same block layout as the challenge preview card, without the taunt line.
 */
export function buildProgressShareMessage(args: ShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const difficulty = getDifficultyLabel(args.pieceCount);
  const pieces = args.pieceCount;
  const moves = args.moveCount ?? 0;
  const rotations = args.rotationCount ?? 0;
  const cleanSolve = (args.undoCount ?? 0) === 0 && !args.usedHint;
  const link = absShareUrl(args.playUrl);

  const lines: string[] = ["Phuzzle"];
  if (args.puzzleName) lines.push(`"${args.puzzleName}"`);
  lines.push(
    "",
    "Puzzle",
    `Difficulty: ${difficulty} (${pieces} pieces)`,
    `Time: ${time}`,
    `Moves: ${moves}`,
  );
  if (rotations > 0) lines.push(`Rotations: ${rotations}`);
  lines.push("");
  if (cleanSolve) lines.push("⭐ Clean solve!");
  lines.push(link);
  return lines.join("\n");
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
 * Beat My Puzzle – challenge share: opening taunt, same stats block as the card, challenge URL (ct/cm).
 */
export function buildChallengeShareMessage(args: ShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const moves = args.moveCount ?? 0;
  const rotations = args.rotationCount ?? 0;
  const difficulty = getDifficultyLabel(args.pieceCount);
  const pieces = args.pieceCount;
  const cleanSolve = (args.undoCount ?? 0) === 0 && !args.usedHint;
  const challengePath = buildChallengePlayUrl(args.playUrl, args.elapsedSeconds, moves);
  const challengeUrl = absShareUrl(challengePath);

  const lines: string[] = [pickChallengeTaunt(), "", "Phuzzle"];
  if (args.puzzleName) lines.push(`"${args.puzzleName}"`);
  lines.push(
    "",
    "Puzzle",
    `Difficulty: ${difficulty} (${pieces} pieces)`,
    `Time: ${time}`,
    `Moves: ${moves}`,
  );
  if (rotations > 0) lines.push(`Rotations: ${rotations}`);
  lines.push("");
  if (cleanSolve) lines.push("⭐ Clean solve — no undos, no hints!");
  lines.push(challengeUrl);
  return lines.join("\n");
}
