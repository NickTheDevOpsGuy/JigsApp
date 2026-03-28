import type { Season } from "@/utils/seasons";

/** Long-form blurbs for pack screens; names/emojis come from categoryDisplay. */
export type PackCategoryDef = {
  id: string;
  description: string;
  season?: Season;
};

export const PACK_CATEGORY_DEFS: PackCategoryDef[] = [
  {
    id: "nature",
    description: "Flowers, forests, mountains, lakes, sunsets",
    season: "spring",
  },
  {
    id: "animals",
    description: "Pets, wildlife, birds, cute animals",
  },
  {
    id: "food",
    description: "Desserts, coffee, burgers, pasta, fruit",
  },
  {
    id: "music",
    description: "Instruments, concerts, vinyl records, musicians",
  },
  {
    id: "space",
    description: "Galaxies, planets, astronauts",
  },
  {
    id: "retro",
    description: "Synthwave, vaporwave, neon sunsets, 80s",
    season: "fall",
  },
  {
    id: "art",
    description: "Paintings, digital art, illustrations",
  },
  {
    id: "gaming",
    description: "Pixel art, controllers, retro arcades",
  },
  {
    id: "seasonal",
    description: "Spring blossoms, fall leaves, winter snow",
  },
  {
    id: "holidays",
    description: "Christmas, Halloween, Easter, New Year celebrations",
    season: "winter",
  },
];
