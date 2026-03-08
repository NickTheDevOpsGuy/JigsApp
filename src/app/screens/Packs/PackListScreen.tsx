/**
 * PackListScreen – list puzzle packs with progress; links to PackDetailScreen.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PackListScreen.module.css";
import { ArrowLeft } from "lucide-react";
import { Loader } from "@/components/Loader";
import { loadPacksData } from "@/data/loadPacksData";
import { getPackProgress } from "@/data/packCompletion";
import { getCurrentSeason } from "@/utils/seasons";
import type { PuzzlePack } from "@/data/puzzlePacks";

export function PackListScreen() {
  const nav = useNavigate();
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);

  const season = useMemo(() => getCurrentSeason(), []);

  /** Order packs: season's pick first, then the rest. Use loaded PUZZLE_PACKS so we pass real PuzzlePack to getPuzzlesForPack. */
  const orderedPacks = useMemo((): PuzzlePack[] => {
    if (!packsData) return [];
    const { PUZZLE_PACKS } = packsData;
    const seasonPack = PUZZLE_PACKS.find((p) => p.season === season);
    if (!seasonPack) return [...PUZZLE_PACKS];
    return [seasonPack, ...PUZZLE_PACKS.filter((p) => p.id !== seasonPack.id)];
  }, [packsData, season]);

  useEffect(() => {
    loadPacksData().then(setPacksData);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => nav("/")}
            aria-label="Back to menu"
            title="Back to menu"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Puzzle Packs</h1>
        </div>

        <div className={styles.cardScroll}>
          <p className={styles.subtitle}>
            Curated themes to explore. Complete puzzles to track your progress.
          </p>

          {season && (
            <p className={styles.seasonNote} aria-live="polite">
              Season&apos;s pick: {season.charAt(0).toUpperCase() + season.slice(1)}
            </p>
          )}

          {!packsData ? (
            <Loader label="Loading packs…" />
          ) : (
            <div className={styles.packGrid}>
              {orderedPacks.map((pack) => {
                const puzzlesData = packsData.getPuzzlesForPack(pack);
                const { completed, total } = getPackProgress(
                  puzzlesData.map((p) => p.id),
                );
                const isSeasonPick = pack.season === season;

                return (
                  <button
                    key={pack.id}
                    type="button"
                    className={`${styles.packCard} ${isSeasonPick ? styles.packCardSeasonal : ""}`}
                    onClick={() => nav(`/packs/${pack.id}`)}
                    title={`Open ${pack.name}`}
                    aria-label={`Open ${pack.name}: ${pack.description}`}
                  >
                    <div className={styles.packEmoji}>{pack.emoji}</div>
                    <div className={styles.packInfo}>
                      <span className={styles.packName}>{pack.name}</span>
                      {isSeasonPick && (
                        <span className={styles.seasonBadge}>Season&apos;s pick</span>
                      )}
                      <span className={styles.packDesc}>{pack.description}</span>
                      <span className={styles.packProgress}>
                        {total > 0 ? `${completed}/${total} completed` : "0 puzzles"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
