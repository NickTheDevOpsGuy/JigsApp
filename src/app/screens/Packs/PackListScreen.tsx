/**
 * PackListScreen – list puzzle packs with progress; links to PackDetailScreen.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PackListScreen.module.css";
import { ArrowLeft } from "lucide-react";
import { Loader } from "@/components/Loader";
import { PACK_METADATA } from "@/data/packMetadata";
import { loadPacksData } from "@/data/loadPacksData";
import { getPackProgress } from "@/data/packCompletion";
import { getCurrentSeason } from "@/utils/seasons";

export function PackListScreen() {
  const nav = useNavigate();
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);

  const season = useMemo(() => getCurrentSeason(), []);
  const seasonPack = useMemo(
    () => PACK_METADATA.find((p) => p.season === season),
    [season],
  );
  const orderedPacks = useMemo(() => {
    if (!seasonPack) return PACK_METADATA;
    return [seasonPack, ...PACK_METADATA.filter((p) => p.id !== seasonPack.id)];
  }, [seasonPack]);

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
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Puzzle Packs</h1>
        </div>

        <div className={styles.cardScroll}>
          <p className={styles.subtitle}>
            Curated themes to explore. Complete puzzles to track your progress.
          </p>

          {seasonPack && (
            <p className={styles.seasonNote} aria-live="polite">
              Season&apos;s pick: {season.charAt(0).toUpperCase() + season.slice(1)}
            </p>
          )}

          {!packsData ? (
            <Loader label="Loading packs…" />
          ) : (
            <div className={styles.packGrid}>
              {orderedPacks.map((pack) => {
                const puzzlesData = packsData
                  ? packsData.getPuzzlesForPack(
                      pack as (typeof packsData.PUZZLE_PACKS)[0],
                    )
                  : [];
                const { completed, total } = packsData
                  ? getPackProgress(puzzlesData.map((p) => p.id))
                  : { completed: 0, total: 0 };

                const isSeasonPick = seasonPack?.id === pack.id;

                return (
                  <button
                    key={pack.id}
                    type="button"
                    className={`${styles.packCard} ${isSeasonPick ? styles.packCardSeasonal : ""}`}
                    onClick={() => nav(`/packs/${pack.id}`)}
                  >
                    <div className={styles.packEmoji}>{pack.emoji}</div>
                    <div className={styles.packInfo}>
                      <span className={styles.packName}>{pack.name}</span>
                      {isSeasonPick && (
                        <span className={styles.seasonBadge}>Season&apos;s pick</span>
                      )}
                      <span className={styles.packDesc}>{pack.description}</span>
                      <span className={styles.packProgress}>
                        {packsData ? `${completed}/${total} completed` : "…"}
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
