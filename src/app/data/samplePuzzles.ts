// src/app/data/samplePuzzles.ts

export type SamplePuzzle = {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  fullImage: string;
};

/**
 * Auto-discover puzzle images from src/app/assets/puzzles/
 *
 * Folder structure (one level or nested subfolders):
 *   src/app/assets/puzzles/
 *     nature/
 *       mountain-lake.jpg
 *     animals/
 *       bear.png
 *       cute/
 *         kitten.png
 *       realistic/
 *         wolf.png
 *
 * Category = path under puzzles/ (e.g. "animals", "animals/cute", "animals/realistic")
 * Puzzle name = filename (kebab-case converted to Title Case)
 * Add/remove images and folders; rebuild to see changes.
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
  const category = categoryPath.toLowerCase();
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
  { id: "all", label: "All" },
  ...discoveredCategories.map((cat) => ({
    id: cat,
    label: kebabToTitle(cat),
  })),
];
