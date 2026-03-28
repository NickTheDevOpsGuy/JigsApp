/**
 * PackDetailScreen – pack puzzle list with completion checkmarks; launch to Play.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PackDetailScreen.module.css";
import { ArrowLeft, Check, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { loadPacksData } from "@/data/packs/loadPacksData";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";
import { getCompletedPuzzleIds, setCurrentPuzzleId } from "@/data/packs/packCompletion";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { STORAGE_KEY, GRID_ONCE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import { GRID_OPTIONS } from "@/daily/dailyPuzzleCore";
import { loadPlayScreenModule } from "@/screens/Play/loadPlayScreen";
import { loadPackListScreenModule } from "@/screens/routeLoaders";
import { PuzzlePackDetail } from "./components";

const DEFAULT_GRID_INDEX = 1;

export function PackDetailScreen() {
  const nav = useNavigate();
  const { packId } = useParams<{ packId: string }>();
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPacksData().then(setPacksData);
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const threshold = 2;
    setCanScrollLeft(maxScroll > threshold && scrollLeft > threshold);
    setCanScrollRight(maxScroll > threshold && scrollLeft < maxScroll - threshold);
    setScrollProgress(maxScroll <= 0 ? 0 : scrollLeft / maxScroll);
  }, []);

  const pack = packsData?.PUZZLE_PACKS.find((p) => p.id === packId);
  const puzzles: SamplePuzzle[] =
    pack && packsData ? packsData.getPuzzlesForPack(pack) : [];
  const completed = getCompletedPuzzleIds();
  const completedCount = puzzles.filter((puzzle) => completed.has(puzzle.id)).length;
  const nextPuzzle =
    puzzles.find((puzzle) => !completed.has(puzzle.id)) ?? puzzles[0] ?? null;

  const handlePlay = (puzzle: SamplePuzzle) => {
    setCurrentPuzzleId(puzzle.id);
    const grid = GRID_OPTIONS[DEFAULT_GRID_INDEX] ?? GRID_OPTIONS[0];
    clearPuzzleState();
    safeLocalStorage.setItem(STORAGE_KEY, puzzle.fullImage);
    safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
    void loadPlayScreenModule();
    nav("/play");
  };

  const scrollByOneCard = (direction: 1 | -1) => {
    const el = scrollRef.current;
    const grid = gridRef.current;
    if (!el) return;
    const first = grid?.firstElementChild as HTMLElement | null;
    const cardWidth = first?.offsetWidth ?? 160;
    const gridStyles = grid ? window.getComputedStyle(grid) : null;
    const gap = Number.parseFloat(gridStyles?.columnGap || gridStyles?.gap || "0") || 8;
    const stepPx = Math.max(120, cardWidth + gap);
    const step = stepPx * direction;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + step));
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    const t1 = setTimeout(updateScrollState, 0);
    const t2 = setTimeout(updateScrollState, 150);
    const t3 = setTimeout(updateScrollState, 400);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [packId, packsData, updateScrollState]);

  if (!packsData) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.loading}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p>Pack not found</p>
          <Button onClick={() => nav("/packs")}>Back to Packs</Button>
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
            onClick={() => {
              void loadPackListScreenModule();
              nav("/packs");
            }}
            aria-label="Back to packs"
            title="Back to packs"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={styles.packHeaderRow}>
            <div className={styles.packHeader}>
              <PuzzlePackDetail
                title={pack.name}
                description={pack.description}
                completed={completedCount}
                total={puzzles.length}
                nextLabel={nextPuzzle?.name ?? null}
              >
                <div />
              </PuzzlePackDetail>
            </div>
            <nav
              className={styles.stepIndicator}
              aria-label="Steps: Pack, Puzzle, Difficulty"
            >
              <button
                type="button"
                className={`${styles.stepItem} ${styles.stepItemDone}`}
                onClick={() => {
                  void loadPackListScreenModule();
                  nav("/packs");
                }}
                title="Back to packs"
              >
                <span className={styles.stepNum} aria-hidden>
                  ✓
                </span>
                <span className={styles.stepLabel}>Pack</span>
              </button>
              <span className={styles.stepConnector} aria-hidden />
              <span className={`${styles.stepItem} ${styles.stepItemActive}`}>
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

        <div className={styles.puzzleGridWrap}>
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollByOneCard(-1)}
            disabled={!canScrollLeft}
            aria-label="Previous puzzles"
            title="Previous"
          >
            <ChevronLeft size={22} />
          </button>
          <div
            ref={scrollRef}
            className={styles.scrollViewport}
            role="list"
            aria-label="Puzzle list"
          >
            <div ref={gridRef} className={styles.puzzleGrid}>
              {puzzles.map((puzzle, index) => {
                const isCompleted = completed.has(puzzle.id);
                const isUpNext = nextPuzzle?.id === puzzle.id;
                const eagerLoad = index < 8;
                return (
                  <button
                    key={puzzle.id}
                    type="button"
                    className={`${styles.puzzleCard} ${isUpNext ? styles.puzzleCardFeatured : ""}`}
                    onClick={() => handlePlay(puzzle)}
                    title={`Solve ${puzzle.name}`}
                    aria-label={`Solve ${puzzle.name}`}
                  >
                    <div className={styles.puzzleThumb}>
                      {imgError[puzzle.id] ? (
                        <div className={styles.placeholder}>?</div>
                      ) : (
                        <img
                          src={puzzle.thumbnail}
                          alt={puzzle.name}
                          loading={eagerLoad ? "eager" : "lazy"}
                          decoding="async"
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
                      <Play size={14} aria-hidden /> Solve
                    </span>
                    {isUpNext && <span className={styles.nextBadge}>Up next</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollByOneCard(1)}
            disabled={!canScrollRight}
            aria-label="Next puzzles"
            title="Next"
          >
            <ChevronRight size={22} />
          </button>
        </div>
        <div className={styles.scrollProgressWrap} aria-hidden="true">
          <div className={styles.scrollProgressTrack}>
            <div
              className={styles.scrollProgressFill}
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
