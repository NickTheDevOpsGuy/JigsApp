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
};

export const PACK_METADATA: PackMetadata[] = [
  { id: "cozy-animals", name: "Cozy Animals", description: "Cute critters to piece together", emoji: "🐻", category: "animals" },
  { id: "retro-tech", name: "Retro Tech", description: "Nostalgic computers and terminals", emoji: "🖥️", category: "tech" },
  { id: "space-exploration", name: "Space Exploration", description: "Cosmos, planets, and nebulas", emoji: "🪐", category: "space" },
  { id: "food-photography", name: "Food Photography", description: "Delicious dishes to assemble", emoji: "🍽️", category: "food" },
  { id: "floral", name: "Floral", description: "Flowers and botanicals", emoji: "🌸", category: "flowers" },
];
