/**
 * Dynamically load full pack data (puzzles, images). Use when PackListScreen or
 * PackDetailScreen mounts to avoid pulling samplePuzzles into initial bundle.
 * Result is cached so subsequent calls resolve immediately.
 */
import type { PuzzlePack } from "./puzzlePacks";
import type { SamplePuzzle } from "./samplePuzzles";

export type PacksData = {
  PUZZLE_PACKS: PuzzlePack[];
  getPuzzlesForPack: (pack: PuzzlePack) => SamplePuzzle[];
};

let packsDataPromise: Promise<PacksData> | null = null;

export async function loadPacksData(): Promise<PacksData> {
  if (!packsDataPromise) {
    packsDataPromise = (async () => {
      const { PUZZLE_PACKS, getPuzzlesForPack } = await import("./puzzlePacks");
      return { PUZZLE_PACKS, getPuzzlesForPack };
    })();
  }
  return packsDataPromise;
}

/** Preload pack data (e.g. when menu mounts) so /packs and pack detail are ready. */
export function preloadPacksData(): void {
  void loadPacksData();
}

/** Preload puzzle catalog so Choose Puzzle / Pick an image shows the list with "All Packs" immediately. */
export function preloadPuzzleCatalog(): void {
  void import("./samplePuzzles");
}
