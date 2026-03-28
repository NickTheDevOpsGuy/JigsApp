/**
 * Canonical category labels and emoji for puzzle picker, packs, and daily spotlight.
 * Add a row here when introducing a new top-level puzzles/ folder category.
 */
function kebabToTitle(str: string): string {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_NAMES: Record<string, string> = {
  nature: "Nature",
  animals: "Animals",
  food: "Food",
  music: "Music",
  space: "Space",
  retro: "Retro",
  art: "Art",
  gaming: "Gaming",
  seasonal: "Seasonal",
  holidays: "Holidays",
};

const CATEGORY_LABELS: Record<string, string> = {
  nature: "🌿",
  animals: "🐾",
  food: "🍕",
  music: "🎵",
  space: "🪐",
  retro: "📼",
  art: "🎨",
  gaming: "🎮",
  seasonal: "🍂",
  holidays: "🎄",
};

/** Default tab / rotation order for known categories. */
export const CATEGORY_ORDER = [
  "nature",
  "animals",
  "food",
  "music",
  "space",
  "retro",
  "art",
  "gaming",
  "seasonal",
  "holidays",
] as const;

export function getCategorySpotlight(categoryId: string): {
  name: string;
  emoji: string;
} {
  return {
    name: CATEGORY_NAMES[categoryId] ?? kebabToTitle(categoryId),
    emoji: CATEGORY_LABELS[categoryId] ?? "🧩",
  };
}
