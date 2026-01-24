// src/app/data/samplePuzzles.ts

export type SamplePuzzle = {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  fullImage: string;
};

/**
 * Auto-discover puzzle images from /src/assets/puzzles/ folder
 *
 * Folder structure:
 *   /src/assets/puzzles/
 *     nature/
 *       mountain-lake.jpg
 *       autumn-forest.jpg
 *     animals/
 *       colorful-parrot.jpg
 *
 * Category = folder name
 * Puzzle name = filename (kebab-case converted to Title Case)
 */

// Use Vite's glob import to find all images in src/assets/puzzles
const puzzleImages = import.meta.glob<{ default: string }>(
  "@/assets/puzzles/**/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

function kebabToTitle(str: string): string {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parsePuzzlePath(path: string, imageUrl: string): SamplePuzzle | null {
  // Path format: various patterns depending on how Vite resolves
  // Try to extract category/filename from the path
  const match = path.match(/puzzles\/([^/]+)\/([^/]+)\.(jpg|jpeg|png|webp)$/i);
  if (!match) return null;

  const [, category, filename] = match;
  const id = `${category}-${filename}`;
  const name = kebabToTitle(filename);

  return {
    id,
    name,
    category: category.toLowerCase(),
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
