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
  {
    id: "hundred_puzzles",
    name: "Century",
    description: "Complete 100 puzzles",
    icon: "💯",
  },
  {
    id: "two_fifty_puzzles",
    name: "Dedicated",
    description: "Complete 250 puzzles",
    icon: "📚",
  },
  {
    id: "five_hundred_puzzles",
    name: "Legend",
    description: "Complete 500 puzzles",
    icon: "✨",
  },
  {
    id: "daily_streak_14",
    name: "Two Week Streak",
    description: "Complete daily puzzle 14 days in a row",
    icon: "🌙",
  },
  {
    id: "first_daily",
    name: "Daily Starter",
    description: "Complete your first daily puzzle",
    icon: "📅",
  },
  {
    id: "grid_4x4",
    name: "4×4 Cleared",
    description: "Complete a 4×4 puzzle",
    icon: "🔲",
  },
  {
    id: "grid_5x5",
    name: "5×5 Cleared",
    description: "Complete a 5×5 puzzle",
    icon: "⬛",
  },
  {
    id: "grid_7x7",
    name: "Master Grid",
    description: "Complete a 7×7 puzzle",
    icon: "🧠",
  },
  {
    id: "grid_8x8",
    name: "Legendary Grid",
    description: "Complete an 8×8 puzzle",
    icon: "🔮",
  },
  {
    id: "grid_9x9",
    name: "Extreme Grid",
    description: "Complete a 9×9 puzzle",
    icon: "💀",
  },
  {
    id: "lightning_3x3",
    name: "Lightning",
    description: "Complete a 3×3 puzzle in under 45 seconds",
    icon: "🌩️",
  },
  {
    id: "quick_4x4",
    name: "Quick 4×4",
    description: "Complete a 4×4 puzzle in under 2 minutes",
    icon: "⏱️",
  },
  {
    id: "flawless",
    name: "Flawless",
    description: "Complete a puzzle with no undos",
    icon: "🎯",
  },
];
