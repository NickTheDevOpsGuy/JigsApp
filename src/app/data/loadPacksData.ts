/**
 * Dynamically load full pack data (puzzles, images). Use when PackListScreen or
 * PackDetailScreen mounts to avoid pulling samplePuzzles into initial bundle.
 */
import type { PuzzlePack } from "./puzzlePacks";
import type { SamplePuzzle } from "./samplePuzzles";

export type PacksData = {
  PUZZLE_PACKS: PuzzlePack[];
  getPuzzlesForPack: (pack: PuzzlePack) => SamplePuzzle[];
};

export async function loadPacksData(): Promise<PacksData> {
  const { PUZZLE_PACKS, getPuzzlesForPack } = await import("./puzzlePacks");
  return { PUZZLE_PACKS, getPuzzlesForPack };
}
