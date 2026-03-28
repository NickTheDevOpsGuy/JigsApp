import type { Season } from "@/utils/seasons";
import { getCategorySpotlight } from "@/data/packs/categoryDisplay";
import { PACK_CATEGORY_DEFS } from "@/data/packs/packCategoryDefs";

/**
 * Shared pack row shape: same name/emoji as Choose Puzzle categories & daily spotlight.
 */
export type PackRow = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  season?: Season;
};

export const PACK_ROWS_FROM_CATEGORIES: PackRow[] = PACK_CATEGORY_DEFS.map((d) => {
  const v = getCategorySpotlight(d.id);
  return {
    id: d.id,
    name: v.name,
    description: d.description,
    emoji: v.emoji,
    category: d.id,
    season: d.season,
  };
});
