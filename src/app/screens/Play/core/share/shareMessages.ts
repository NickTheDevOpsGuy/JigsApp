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
  challengeTarget?: {
    elapsedSeconds: number;
    moveCount: number | null;
  } | null;
};

export function getDifficultyLabel(pieceCount: number): string {
  if (pieceCount <= 9) return "Easy";
  if (pieceCount <= 16) return "Medium";
  if (pieceCount <= 25) return "Hard";
  if (pieceCount <= 36) return "Expert";
  if (pieceCount <= 49) return "Master";
  if (pieceCount <= 64) return "Legend";
  return "Extreme";
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

/**
 * Share Result – same layout as the challenge card preview, neutral (no challenge line).
 */
export function buildProgressShareMessage(args: ShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const difficulty = getDifficultyLabel(args.pieceCount);
  const pieces = args.pieceCount;
  const moves = args.moveCount ?? 0;
  const rotations = args.rotationCount ?? 0;
  const cleanSolve = (args.undoCount ?? 0) === 0 && !args.usedHint;
  const challengeLine = getChallengeResultLine(args);
  const link = absShareUrl(args.playUrl);

  const lines = [
    `Phuzzle — solved in ${time} · ${moves} moves`,
    `${difficulty} (${pieces} pieces)${rotations > 0 ? ` · ${rotations} rotations` : ""}`,
    ...(cleanSolve ? ["Clean solve (no undos, no hints)"] : []),
    ...(challengeLine ? [challengeLine] : []),
    "",
    link,
  ];
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
  dailyStreak?: number;
};

export function buildDailyShareMessage(args: DailyShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const difficulty = getDifficultyLabel(args.pieceCount);
  const streakLine =
    args.dailyStreak && args.dailyStreak > 1
      ? [`🔥 ${args.dailyStreak}-day streak`, ""]
      : [];
  return [
    `Phuzzle Daily #${args.dailyNumber}`,
    `${difficulty} • ${args.pieceCount} pieces`,
    "",
    `⏱ ${time}`,
    `🔁 ${args.moveCount}`,
    "",
    ...streakLine,
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

function getChallengeResultLine(args: ShareMessageArgs): string | null {
  const target = args.challengeTarget ?? null;
  if (!target) return null;
  const moves = args.moveCount ?? 0;
  const beatTime = args.elapsedSeconds < target.elapsedSeconds;
  const beatMoves = target.moveCount == null || moves <= target.moveCount;
  if (!beatTime || !beatMoves) {
    const moveTarget = target.moveCount != null ? ` · ${target.moveCount} moves` : "";
    return `Challenge target: ${formatTime(target.elapsedSeconds)}${moveTarget}`;
  }
  const timeDelta = target.elapsedSeconds - args.elapsedSeconds;
  const moveDelta = target.moveCount == null ? 0 : Math.max(0, target.moveCount - moves);
  const parts = [
    `${formatTime(timeDelta)} faster`,
    moveDelta > 0 ? `${moveDelta} fewer ${moveDelta === 1 ? "move" : "moves"}` : null,
  ].filter(Boolean);
  return `Beat the challenge: ${parts.join(" · ")}`;
}

/**
 * Beat My Puzzle – challenge share: stats (incl. rotations), “Can you beat my time?”, challenge URL.
 * URL includes same puzzle + grid (from playUrl) and ct/cm for the challenge.
 */
export function buildChallengeShareMessage(args: ShareMessageArgs): string {
  const time = formatTime(args.elapsedSeconds);
  const moves = args.moveCount ?? 0;
  const rotations = args.rotationCount ?? 0;
  const difficulty = getDifficultyLabel(args.pieceCount);
  const pieces = args.pieceCount;
  const cleanSolve = (args.undoCount ?? 0) === 0 && !args.usedHint;
  const challengeLine = getChallengeResultLine(args);
  const challengePath = buildChallengePlayUrl(args.playUrl, args.elapsedSeconds, moves);
  const challengeUrl = absShareUrl(challengePath);

  const lines = [
    "Can you beat my time on this puzzle?",
    `Phuzzle — ${difficulty} (${pieces} pieces) · ${time} · ${moves} moves${rotations > 0 ? ` · ${rotations} rotations` : ""}`,
    ...(cleanSolve ? ["Clean solve (no undos, no hints)"] : []),
    ...(challengeLine ? [challengeLine] : []),
    "",
    challengeUrl,
  ];
  return lines.join("\n");
}
