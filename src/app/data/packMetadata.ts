import type { Season } from "@/utils/seasons";

/**
 * Lightweight pack metadata only. No puzzle data or image imports.
 * Load this for pack list; use loadPacksData() for full pack + puzzle details.
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

export const PACK_METADATA: PackMetadata[] = [
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
];
