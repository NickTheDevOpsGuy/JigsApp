import type { Season } from "@/utils/seasons";
import type { SamplePuzzle } from "./samplePuzzles";
import { SAMPLE_PUZZLES } from "./samplePuzzles";
import { PACK_ROWS_FROM_CATEGORIES } from "./packRowsFromCategories";

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
 * Curated puzzle packs (max 10). Names/emojis match Choose Puzzle categories (categoryDisplay).
 */
export const PUZZLE_PACKS: PuzzlePack[] = PACK_ROWS_FROM_CATEGORIES.map((r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  emoji: r.emoji,
  category: r.category,
  season: r.season,
}));

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
