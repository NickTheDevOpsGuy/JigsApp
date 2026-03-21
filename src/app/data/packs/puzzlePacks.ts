import type { Season } from "@/utils/seasons";
import type { SamplePuzzle } from "./samplePuzzles";
import { SAMPLE_PUZZLES } from "./samplePuzzles";

export type PuzzlePack = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Category used to filter SAMPLE_PUZZLES, or explicit puzzle IDs */
  category?: string;
  puzzleIds?: string[];
  /** Pack surfaces as "Season's pick" when current season matches */
  season?: Season;
};

/**
 * Curated puzzle packs (max 10). Packs filter SAMPLE_PUZZLES by category when category is set.
 */
export const PUZZLE_PACKS: PuzzlePack[] = [
  {
    id: "nature",
    name: "Nature",
    description: "Flowers, forests, mountains, lakes, sunsets",
    emoji: "🌿",
    category: "nature",
    season: "spring",
  },
  {
    id: "animals",
    name: "Animals",
    description: "Pets, wildlife, birds, cute animals",
    emoji: "🐶",
    category: "animals",
  },
  {
    id: "food",
    name: "Food",
    description: "Desserts, coffee, burgers, pasta, fruit",
    emoji: "🍔",
    category: "food",
  },
  {
    id: "music",
    name: "Music",
    description: "Instruments, concerts, vinyl records, musicians",
    emoji: "🎵",
    category: "music",
  },
  {
    id: "space",
    name: "Space",
    description: "Galaxies, planets, astronauts",
    emoji: "🌌",
    category: "space",
  },
  {
    id: "retro",
    name: "Retro",
    description: "Synthwave, vaporwave, neon sunsets, 80s",
    emoji: "🧠",
    category: "retro",
    season: "fall",
  },
  {
    id: "art",
    name: "Art",
    description: "Paintings, digital art, illustrations",
    emoji: "🖼",
    category: "art",
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Pixel art, controllers, retro arcades",
    emoji: "🎮",
    category: "gaming",
  },
  {
    id: "seasonal",
    name: "Seasonal",
    description: "Spring blossoms, fall leaves, winter snow",
    emoji: "🌸",
    category: "seasonal",
  },
  {
    id: "holidays",
    name: "Holidays",
    description: "Christmas, Halloween, Easter, New Year celebrations",
    emoji: "🎄",
    category: "holidays",
    season: "winter",
  },
];

/** Get puzzles belonging to a pack */
export function getPuzzlesForPack(pack: PuzzlePack): SamplePuzzle[] {
  if (pack.puzzleIds?.length) {
    return pack.puzzleIds
      .map((id) => SAMPLE_PUZZLES.find((p) => p.id === id))
      .filter((p): p is SamplePuzzle => p != null);
  }
  if (pack.category) {
    return SAMPLE_PUZZLES.filter((p) => p.category === pack.category);
  }
  return [];
}
