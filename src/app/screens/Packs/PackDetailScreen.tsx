import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PackDetailScreen.module.css";
import { ArrowLeft, Check, Play } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { PACK_METADATA } from "@/data/packMetadata";
import { loadPacksData } from "@/data/loadPacksData";
import type { SamplePuzzle } from "@/data/samplePuzzles";
import { getCompletedPuzzleIds, setCurrentPuzzleId } from "@/data/packCompletion";

export function PackDetailScreen() {
  const nav = useNavigate();
  const { packId } = useParams<{ packId: string }>();
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [packsData, setPacksData] = useState<Awaited<ReturnType<typeof loadPacksData>> | null>(null);

  useEffect(() => {
    loadPacksData().then(setPacksData);
  }, []);

  const packMeta = PACK_METADATA.find((p) => p.id === packId);
  const pack = packsData?.PUZZLE_PACKS.find((p) => p.id === packId);
  const puzzles: SamplePuzzle[] = pack && packsData ? packsData.getPuzzlesForPack(pack) : [];
  const completed = getCompletedPuzzleIds();

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
            <span className={styles.packEmoji}>{packMeta.emoji}</span>
            <div>
              <h1 className={styles.title}>{packMeta.name}</h1>
              <p className={styles.desc}>{packMeta.description}</p>
            </div>
          </div>
        </div>

        <div className={styles.puzzleGrid}>
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
      </div>
    </div>
  );
}
