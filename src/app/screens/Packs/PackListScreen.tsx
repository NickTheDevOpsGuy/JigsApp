/**
 * PackListScreen – list puzzle packs with progress; links to PackDetailScreen.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PackListScreen.module.css";
import { ArrowLeft } from "lucide-react";
import { Loader } from "@/components/Loader";
import { loadPacksData } from "@/data/packs/loadPacksData";
import { getPackProgress } from "@/data/packs/packCompletion";
import { getCurrentSeason } from "@/utils/seasons";
import type { PuzzlePack } from "@/data/packs/puzzlePacks";
import { PackCarouselWithNav, PuzzlePackCard, PuzzlePackModule } from "./components";

export function PackListScreen() {
  const nav = useNavigate();
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

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
            <PuzzlePackModule
              eyebrow="Collections"
              title="Choose Your Next Pack"
              subtitle="Seasonal favorites and progress that carries with you."
            >
              <PackCarouselWithNav>
                {orderedPacks.map((pack) => {
                  const puzzlesData = packsData.getPuzzlesForPack(pack);
                  const { completed, total } = getPackProgress(
                    puzzlesData.map((p) => p.id),
                  );
                  const isSeasonPick = pack.season === season;
                  const heroPuzzle = puzzlesData[0];
                  const progressPercent =
                    total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <PuzzlePackCard
                      key={pack.id}
                      onClick={() => nav(`/packs/${pack.id}`)}
                      name={pack.name}
                      completed={completed}
                      total={total}
                      coverImageUrl={
                        !imgError[pack.id] ? (heroPuzzle?.thumbnail ?? null) : null
                      }
                      onCoverError={() =>
                        setImgError((prev) => ({ ...prev, [pack.id]: true }))
                      }
                      emoji={pack.emoji}
                      seasonTag={isSeasonPick ? "Season's Pick" : undefined}
                      summary={`${progressPercent}%`}
                    />
                  );
                })}
              </PackCarouselWithNav>
            </PuzzlePackModule>
          )}
        </div>
      </div>
    </div>
  );
}
