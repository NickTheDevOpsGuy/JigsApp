/**
 * PackDetailScreen – pack puzzle list with completion checkmarks; launch to Play.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PackDetailScreen.module.css";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { PACK_METADATA } from "@/data/packMetadata";
import { loadPacksData } from "@/data/loadPacksData";
import type { SamplePuzzle } from "@/data/samplePuzzles";
import { getCompletedPuzzleIds, setCurrentPuzzleId } from "@/data/packCompletion";

export function PackDetailScreen() {
  const nav = useNavigate();
  const { packId } = useParams<{ packId: string }>();
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const puzzleGridRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [packsData, setPacksData] = useState<Awaited<
    ReturnType<typeof loadPacksData>
  > | null>(null);

  useEffect(() => {
    loadPacksData().then(setPacksData);
  }, []);

  const packMeta = PACK_METADATA.find((p) => p.id === packId);
  const pack = packsData?.PUZZLE_PACKS.find((p) => p.id === packId);
  const puzzles: SamplePuzzle[] =
    pack && packsData ? packsData.getPuzzlesForPack(pack) : [];
  const completed = getCompletedPuzzleIds();

  useEffect(() => {
    const el = puzzleGridRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;
      const hasOverflow = maxScroll > 8;
      setCanScrollLeft(hasOverflow && scrollLeft > 4);
      setCanScrollRight(hasOverflow && scrollLeft < maxScroll - 4);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const t = setTimeout(update, 100);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      clearTimeout(t);
    };
  }, [puzzles.length, packId]);

  const handlePlay = (puzzle: SamplePuzzle) => {
    setCurrentPuzzleId(puzzle.id);
    nav(`/new?puzzle=${encodeURIComponent(puzzle.id)}`);
  };

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
          >
            <ArrowLeft size={20} />
          </button>
          <div className={styles.packHeader}>
            <div>
              <h1 className={styles.title}>{packMeta.name}</h1>
              <p className={styles.desc}>{packMeta.description}</p>
            </div>
          </div>
        </div>

        <div className={styles.puzzleGridWrap}>
          <button
            type="button"
            className={styles.puzzleScrollBtn}
            aria-label="Scroll puzzles left"
            disabled={!canScrollLeft}
            onClick={() =>
              puzzleGridRef.current?.scrollBy({ left: -220, behavior: "smooth" })
            }
          >
            <ChevronLeft size={18} />
          </button>

          <div className={styles.puzzleGrid} ref={puzzleGridRef}>
            {puzzles.map((puzzle) => {
              const isCompleted = completed.has(puzzle.id);
              return (
                <button
                  key={puzzle.id}
                  type="button"
                  className={styles.puzzleCard}
                  onClick={() => handlePlay(puzzle)}
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
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.puzzleScrollBtn}
            aria-label="Scroll puzzles right"
            disabled={!canScrollRight}
            onClick={() =>
              puzzleGridRef.current?.scrollBy({ left: 220, behavior: "smooth" })
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
