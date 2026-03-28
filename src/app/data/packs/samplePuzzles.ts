/**
 * samplePuzzles – puzzle catalog; auto-discovers from src/app/assets/puzzles/.
 */
import { CATEGORY_ORDER, getCategorySpotlight } from "@/data/packs/categoryDisplay";

export type SamplePuzzle = {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  fullImage: string;
};

// Folder name = category id (one folder per pack).
const CATEGORY_ALIAS: Record<string, string> = {
  nature: "nature",
  animals: "animals",
  food: "food",
  cozy: "music",
  music: "music",
  space: "space",
  retro: "retro",
  art: "art",
  gaming: "gaming",
  seasonal: "seasonal",
  holidays: "holidays",
};

/**
 * Auto-discover puzzle images from src/app/assets/puzzles/
 *
 * Folder structure (one level or nested subfolders):
 *   src/app/assets/puzzles/
 *     nature/  animals/  food/  music/  space/  retro/  art/  gaming/  seasonal/  holidays/
 *
 * Folder name = category. Puzzle name = filename (kebab-case → Title Case).
 * Add/remove images; rebuild to see changes. Max 10 pack categories.
 */

// Use Vite's glob import to find all images in src/assets/puzzles (any depth)
const puzzleImages = import.meta.glob<{ default: string }>(
  "@/assets/puzzles/**/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

function kebabToTitle(str: string): string {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parsePuzzlePath(path: string, imageUrl: string): SamplePuzzle | null {
  // Match puzzles/.../filename.ext (any depth under puzzles)
  const match = path.match(/puzzles\/(.+)\/([^/]+)\.(jpg|jpeg|png|webp)$/i);
  if (!match) return null;

  const [, categoryPath, filename] = match;
  const rawCategory = categoryPath.toLowerCase();
  const category = CATEGORY_ALIAS[rawCategory] ?? rawCategory;
  const id = `${categoryPath.replace(/\//g, "-")}-${filename}`.toLowerCase();
  const name = kebabToTitle(filename);

  return {
    id,
    name,
    category,
    thumbnail: imageUrl,
    fullImage: imageUrl,
  };
}

// Build puzzle list from discovered images
export const SAMPLE_PUZZLES: SamplePuzzle[] = Object.entries(puzzleImages)
  .map(([path, module]) => parsePuzzlePath(path, module.default))
  .filter((p): p is SamplePuzzle => p !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

// Build categories dynamically from discovered puzzles
const discoveredCategories = [...new Set(SAMPLE_PUZZLES.map((p) => p.category))].sort();

export const CATEGORIES = [
  { id: "all", label: "All", name: "All" },
  ...CATEGORY_ORDER.map((cat) => {
    const v = getCategorySpotlight(cat);
    return { id: cat, label: v.emoji, name: v.name };
  }),
  ...discoveredCategories
    .filter((cat) => !CATEGORY_ORDER.includes(cat as (typeof CATEGORY_ORDER)[number]))
    .map((cat) => {
      const v = getCategorySpotlight(cat);
      return { id: cat, label: v.emoji, name: v.name };
    }),
];

/** Categories used for daily rotation (known order; only ids that have at least one puzzle). */
export function getDailyRotationCategoryIds(): string[] {
  const ordered = CATEGORY_ORDER.filter((id) =>
    SAMPLE_PUZZLES.some((p) => p.category === id),
  );
  if (ordered.length > 0) return [...ordered];
  return [...new Set(SAMPLE_PUZZLES.map((p) => p.category))].sort();
}

export { getCategorySpotlight } from "@/data/packs/categoryDisplay";
