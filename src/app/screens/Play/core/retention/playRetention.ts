import { getDifficultyLabel } from "@/screens/Play/core/share/shareMessages";

export type ChallengeTarget = {
  elapsedSeconds: number;
  moveCount: number | null;
};

export type NextGoalInput = {
  isDaily: boolean;
  isPackPuzzle: boolean;
  dailyStreak: number;
  puzzlesCompleted: number | null;
  pieceCount: number;
  elapsedSeconds: number;
  moveCount: number;
  challengeTarget?: ChallengeTarget | null;
};

export type NextGoal = {
  eyebrow: string;
  title: string;
  body: string;
  tone: "win" | "push" | "daily";
};

function parsePositiveInt(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

export function parseChallengeTarget(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): ChallengeTarget | null {
  const elapsedSeconds = parsePositiveInt(searchParams?.get("ct") ?? null);
  if (elapsedSeconds == null) return null;
  return {
    elapsedSeconds,
    moveCount: parsePositiveInt(searchParams?.get("cm") ?? null),
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, Math.round(seconds % 60));
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function getChallengeHudLabel(target: ChallengeTarget | null): string | null {
  if (!target) return null;
  const moves = target.moveCount != null ? ` / ${target.moveCount} moves` : "";
  return `Beat ${formatTime(target.elapsedSeconds)}${moves}`;
}

export function buildNextGoal(input: NextGoalInput): NextGoal {
  const target = input.challengeTarget ?? null;
  if (target) {
    const beatTime = input.elapsedSeconds < target.elapsedSeconds;
    const beatMoves =
      target.moveCount == null ? true : input.moveCount <= target.moveCount;
    if (beatTime && beatMoves) {
      return {
        eyebrow: "Challenge won",
        title: "Send the win back",
        body: `You beat ${formatTime(target.elapsedSeconds)}${target.moveCount != null ? ` and ${target.moveCount} moves` : ""}. Share your run and keep the rivalry going.`,
        tone: "win",
      };
    }
    const timeGap = Math.max(0, input.elapsedSeconds - target.elapsedSeconds);
    const moveGap =
      target.moveCount == null ? 0 : Math.max(0, input.moveCount - target.moveCount);
    const gapParts = [
      timeGap > 0 ? `${formatTime(timeGap)} faster` : null,
      moveGap > 0 ? `${moveGap} fewer ${moveGap === 1 ? "move" : "moves"}` : null,
    ].filter(Boolean);
    return {
      eyebrow: "Challenge target",
      title: "Run it back",
      body:
        gapParts.length > 0
          ? `You need ${gapParts.join(" and ")} to take this one.`
          : "You matched the target. One cleaner run can take it.",
      tone: "push",
    };
  }

  if (input.isDaily) {
    const nextMilestone = input.dailyStreak < 3 ? 3 : input.dailyStreak < 7 ? 7 : 14;
    const remaining = Math.max(1, nextMilestone - input.dailyStreak);
    return {
      eyebrow: "Daily ritual",
      title:
        remaining === 1
          ? `${nextMilestone}-day streak is next`
          : `${remaining} dailies to the ${nextMilestone}-day badge`,
      body: "Come back tomorrow for the same puzzle everyone else gets.",
      tone: "daily",
    };
  }

  if (input.isPackPuzzle) {
    return {
      eyebrow: "Pack progress",
      title: "Keep the set moving",
      body: "One more from this pack builds collection progress and unlocks better comparison runs.",
      tone: "push",
    };
  }

  const completed = input.puzzlesCompleted ?? 0;
  const nextBadge = completed < 5 ? 5 : completed < 20 ? 20 : completed < 50 ? 50 : 100;
  const remaining = Math.max(1, nextBadge - completed);
  return {
    eyebrow: getDifficultyLabel(input.pieceCount),
    title:
      remaining === 1
        ? `${nextBadge}-puzzle badge is next`
        : `${remaining} puzzles to the ${nextBadge}-puzzle badge`,
    body: "A faster or cleaner solve improves your share card and leaderboard shot.",
    tone: "push",
  };
}
