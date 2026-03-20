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
import {
  FeaturedPackHero,
  PackCarouselWithNav,
  PuzzlePackCard,
  PuzzlePackModule,
} from "./components";

export function PackListScreen() {
  const nav = useNavigate();
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const season = useMemo(() => getCurrentSeason(), []);

  /** Featured pack: season's pick or first pack. */
  const featuredPack = useMemo((): PuzzlePack | null => {
    if (!packsData) return null;
    const { PUZZLE_PACKS } = packsData;
    const seasonPack = PUZZLE_PACKS.find((p) => p.season === season);
    return seasonPack ?? PUZZLE_PACKS[0] ?? null;
  }, [packsData, season]);

  /** Packs already started (completed > 0). */
  const continuePacks = useMemo((): PuzzlePack[] => {
    if (!packsData) return [];
    return packsData.PUZZLE_PACKS.filter((pack) => {
      const puzzlesData = packsData.getPuzzlesForPack(pack);
      const { completed } = getPackProgress(puzzlesData.map((p) => p.id));
      return completed > 0;
    });
  }, [packsData]);

  /** All packs for horizontal rail (snap, arrows, no half cards). */
  const allPacks = useMemo(() => packsData?.PUZZLE_PACKS ?? [], [packsData]);

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
          <div className={styles.headerTitleRow}>
            <h1 className={styles.title}>Puzzle Packs</h1>
            <nav
              className={styles.stepIndicator}
              aria-label="Steps: Pack, Puzzle, Difficulty"
            >
              <span className={`${styles.stepItem} ${styles.stepItemActive}`}>
                <span className={styles.stepNum} aria-hidden>
                  1
                </span>
                <span className={styles.stepLabel}>Pack</span>
              </span>
              <span className={styles.stepConnector} aria-hidden />
              <span className={`${styles.stepItem} ${styles.stepItemFuture}`}>
                <span className={styles.stepNum} aria-hidden>
                  2
                </span>
                <span className={styles.stepLabel}>Puzzle</span>
              </span>
              <span className={styles.stepConnector} aria-hidden />
              <span className={`${styles.stepItem} ${styles.stepItemFuture}`}>
                <span className={styles.stepNum} aria-hidden>
                  3
                </span>
                <span className={styles.stepLabel}>Difficulty</span>
              </span>
            </nav>
          </div>
        </div>

        <div className={styles.cardScroll}>
          <p className={styles.subtitle}>
            Curated themes to explore. Complete puzzles to track your progress.
          </p>

          {!packsData ? (
            <Loader label="Loading packs…" />
          ) : (
            <>
              {featuredPack && (
                <FeaturedPackHero
                  name={featuredPack.name}
                  description={featuredPack.description}
                  completed={
                    getPackProgress(
                      packsData.getPuzzlesForPack(featuredPack).map((p) => p.id),
                    ).completed
                  }
                  total={
                    getPackProgress(
                      packsData.getPuzzlesForPack(featuredPack).map((p) => p.id),
                    ).total
                  }
                  coverImageUrl={
                    !imgError[featuredPack.id]
                      ? (packsData.getPuzzlesForPack(featuredPack)[0]?.thumbnail ?? null)
                      : null
                  }
                  onCoverError={() =>
                    setImgError((prev) => ({ ...prev, [featuredPack.id]: true }))
                  }
                  emoji={featuredPack.emoji}
                  onClick={() => nav(`/packs/${featuredPack.id}`)}
                />
              )}

              {continuePacks.length > 0 && (
                <PuzzlePackModule
                  eyebrow="Continue Playing"
                  title="Pick up where you left off"
                  subtitle="Packs you've already started."
                >
                  <div className={styles.packRow}>
                    {continuePacks.map((pack) => {
                      const puzzlesData = packsData.getPuzzlesForPack(pack);
                      const { completed, total } = getPackProgress(
                        puzzlesData.map((p) => p.id),
                      );
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
                          summary={`${progressPercent}%`}
                        />
                      );
                    })}
                  </div>
                </PuzzlePackModule>
              )}

              <PuzzlePackModule
                eyebrow="All Packs"
                title="Browse all packs"
                subtitle="Scroll for more. Tap a pack to see puzzles."
              >
                <PackCarouselWithNav>
                  {allPacks.map((pack) => {
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
