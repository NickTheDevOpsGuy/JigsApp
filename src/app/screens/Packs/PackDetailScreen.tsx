/**
 * PackDetailScreen – pack puzzle list with completion checkmarks; launch to Play.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PackDetailScreen.module.css";
import { ArrowLeft, Check, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { PACK_METADATA } from "@/data/packs/packMetadata";
import { loadPacksData } from "@/data/packs/loadPacksData";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import { getCompletedPuzzleIds, setCurrentPuzzleId } from "@/data/packs/packCompletion";
import { PuzzlePackDetail } from "./components";

const SCROLL_STEP = 220;

export function PackDetailScreen() {
  const nav = useNavigate();
  const { packId } = useParams<{ packId: string }>();
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPacksData().then(setPacksData);
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const packMeta = PACK_METADATA.find((p) => p.id === packId);
  const pack = packsData?.PUZZLE_PACKS.find((p) => p.id === packId);
  const puzzles: SamplePuzzle[] =
    pack && packsData ? packsData.getPuzzlesForPack(pack) : [];
  const completed = getCompletedPuzzleIds();
  const completedCount = puzzles.filter((puzzle) => completed.has(puzzle.id)).length;
  const nextPuzzle =
    puzzles.find((puzzle) => !completed.has(puzzle.id)) ?? puzzles[0] ?? null;

  const handlePlay = (puzzle: SamplePuzzle) => {
    setCurrentPuzzleId(puzzle.id);
    nav(`/new?puzzle=${encodeURIComponent(puzzle.id)}`);
  };

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => updateScrollState());
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [packId, packsData, updateScrollState]);

  if (!packMeta) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p>Pack not found</p>
          <Button onClick={() => nav("/packs")}>Back to Packs</Button>
        </div>
      </div>
    );
  }

  if (!packsData) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.loading}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => nav("/packs")}
            aria-label="Back to packs"
            title="Back to packs"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={styles.packHeader}>
            <PuzzlePackDetail
              title={packMeta.name}
              description={packMeta.description}
              completed={completedCount}
              total={puzzles.length}
              nextLabel={nextPuzzle?.name ?? null}
            >
              <div />
            </PuzzlePackDetail>
          </div>
        </div>

        <div className={styles.puzzleGridWrap}>
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollBy(-SCROLL_STEP)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            title="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <div
            ref={scrollRef}
            className={styles.scrollViewport}
            role="list"
            aria-label="Puzzle list"
          >
            <div className={styles.puzzleGrid}>
              {puzzles.map((puzzle) => {
                const isCompleted = completed.has(puzzle.id);
                return (
                  <button
                    key={puzzle.id}
                    type="button"
                    className={`${styles.puzzleCard} ${nextPuzzle?.id === puzzle.id ? styles.puzzleCardFeatured : ""}`}
                    onClick={() => handlePlay(puzzle)}
                    title={`Play ${puzzle.name}`}
                    aria-label={`Play ${puzzle.name}`}
                  >
                    <div className={styles.puzzleThumb}>
                      {imgError[puzzle.id] ? (
                        <div className={styles.placeholder}>?</div>
                      ) : (
                        <img
                          src={puzzle.thumbnail}
                          alt={puzzle.name}
                          onError={() =>
                            setImgError((prev) => ({ ...prev, [puzzle.id]: true }))
                          }
                        />
                      )}
                      {isCompleted && (
                        <div className={styles.completedBadge}>
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    <span className={styles.puzzleName}>{puzzle.name}</span>
                    <span className={styles.playHint}>
                      <Play size={12} /> Play
                    </span>
                    {nextPuzzle?.id === puzzle.id && (
                      <span className={styles.nextBadge}>Next</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollBy(SCROLL_STEP)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            title="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
