/** Raccoon avatar options. Some unlock via achievements (checked at runtime). */
export const AVATAR_HATS = [
  { id: "none", label: "None" },
  { id: "cap", label: "Cap" },
  { id: "beanie", label: "Beanie" },
  { id: "crown", label: "Crown" },
  { id: "witch", label: "Witch hat", unlockAchievement: "daily_streak_7" },
];

export const AVATAR_GLASSES = [
  { id: "none", label: "None" },
  { id: "round", label: "Round" },
  { id: "sunglasses", label: "Sunglasses" },
  { id: "nerd", label: "Nerd", unlockAchievement: "fifty_puzzles" },
];

export const AVATAR_HOODIES = [
  { id: "default", label: "Gray" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "purple", label: "Purple", unlockAchievement: "twenty_puzzles" },
  { id: "gold", label: "Gold", unlockAchievement: "hundred_puzzles" },
];
