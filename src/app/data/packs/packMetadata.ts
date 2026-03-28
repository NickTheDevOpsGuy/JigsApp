import type { Season } from "@/utils/seasons";
import { PACK_ROWS_FROM_CATEGORIES } from "@/data/packs/packRowsFromCategories";

/**
 * Lightweight pack metadata only. No puzzle data or image imports.
 * Names/emojis are aligned with categoryDisplay + Choose Puzzle modal.
 */
export type PackMetadata = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category?: string;
  puzzleIds?: string[];
  /** Pack surfaces as "Season's pick" when current season matches */
  season?: Season;
};

export const PACK_METADATA: PackMetadata[] = PACK_ROWS_FROM_CATEGORIES.map((r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  emoji: r.emoji,
  category: r.category,
  season: r.season,
}));
