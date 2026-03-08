/**
 * Achievement definitions and IDs for pack progression.
 */
export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first_puzzle",
    name: "First Steps",
    description: "Complete your first puzzle",
    icon: "🧩",
  },
  {
    id: "five_puzzles",
    name: "Getting Started",
    description: "Complete 5 puzzles",
    icon: "⭐",
  },
  {
    id: "twenty_puzzles",
    name: "Puzzle Enthusiast",
    description: "Complete 20 puzzles",
    icon: "🌟",
  },
  {
    id: "fifty_puzzles",
    name: "Puzzle Master",
    description: "Complete 50 puzzles",
    icon: "🏆",
  },
  {
    id: "daily_streak_3",
    name: "Three Day Streak",
    description: "Complete daily puzzle 3 days in a row",
    icon: "🔥",
  },
  {
    id: "daily_streak_7",
    name: "Week Warrior",
    description: "Complete daily puzzle 7 days in a row",
    icon: "💪",
  },
  {
    id: "daily_streak_30",
    name: "Monthly Champion",
    description: "Complete daily puzzle 30 days in a row",
    icon: "👑",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete a 3×3 puzzle in under 60 seconds",
    icon: "⚡",
  },
  {
    id: "expert_grid",
    name: "Expert Grid",
    description: "Complete a 6×6 puzzle",
    icon: "🎯",
  },
];
