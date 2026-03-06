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
 * Curated puzzle packs grouped by theme.
 * Packs filter SAMPLE_PUZZLES by category when category is set.
 */
export const PUZZLE_PACKS: PuzzlePack[] = [
  {
    id: "cozy-animals",
    name: "Cozy Animals",
    description: "Cute critters to piece together",
    emoji: "🐻",
    category: "animals",
    season: "winter",
  },
  {
    id: "retro-tech",
    name: "Retro Tech",
    description: "Nostalgic computers and terminals",
    emoji: "🖥️",
    category: "tech",
  },
  {
    id: "space-exploration",
    name: "Space Exploration",
    description: "Cosmos, planets, and nebulas",
    emoji: "🪐",
    category: "space",
    season: "summer",
  },
  {
    id: "food-photography",
    name: "Food Photography",
    description: "Delicious dishes to assemble",
    emoji: "🍽️",
    category: "food",
    season: "fall",
  },
  {
    id: "floral",
    name: "Floral",
    description: "Flowers and botanicals",
    emoji: "🌸",
    category: "flowers",
    season: "spring",
  },
  {
    id: "house-pets",
    name: "House Pets",
    description: "Cats, kittens, and rabbits",
    emoji: "🐾",
    category: "pets",
  },
  {
    id: "woodland-friends",
    name: "Woodland Friends",
    description: "Forest critters and cozy wildlife",
    emoji: "🦊",
    category: "woodland",
  },
  {
    id: "garden-blooms-plus",
    name: "Garden Blooms+",
    description: "Fresh flower scenes",
    emoji: "🌼",
    category: "garden",
  },
  {
    id: "cozy-food-delights",
    name: "Cozy Food Delights",
    description: "Comfort foods and warm table scenes",
    emoji: "🍲",
    category: "cozy-food",
  },
  {
    id: "glitch-lab",
    name: "Glitch Lab",
    description: "Retro terminals and hacker vibes",
    emoji: "🧪",
    category: "retro",
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
