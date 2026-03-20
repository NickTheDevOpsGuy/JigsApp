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
    id: "cozy",
    name: "Music",
    description: "Instruments, concerts, vinyl records, musicians",
    emoji: "🎵",
    category: "cozy",
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
