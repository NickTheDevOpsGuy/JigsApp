/**
 * PackListScreen – list puzzle packs with progress; links to PackDetailScreen.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PackListScreen.module.css";
import { ArrowLeft } from "lucide-react";
import { PACK_METADATA } from "@/data/packMetadata";
import { loadPacksData } from "@/data/loadPacksData";
import { getPackProgress } from "@/data/packCompletion";

export function PackListScreen() {
  const nav = useNavigate();
  const [packsData, setPacksData] = useState<Awaited<ReturnType<typeof loadPacksData>> | null>(null);

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

        <p className={styles.subtitle}>
          Curated themes to explore. Complete puzzles to track your progress.
        </p>

        <div className={styles.packGrid}>
          {PACK_METADATA.map((pack) => {
            const puzzlesData = packsData
              ? packsData.getPuzzlesForPack(pack as (typeof packsData.PUZZLE_PACKS)[0])
              : [];
            const { completed, total } = packsData
              ? getPackProgress(puzzlesData.map((p) => p.id))
              : { completed: 0, total: 0 };

            return (
              <button
                key={pack.id}
                type="button"
                className={styles.packCard}
                onClick={() => nav(`/packs/${pack.id}`)}
              >
                <div className={styles.packEmoji}>{pack.emoji}</div>
                <div className={styles.packInfo}>
                  <span className={styles.packName}>{pack.name}</span>
                  <span className={styles.packDesc}>{pack.description}</span>
                  <span className={styles.packProgress}>
                    {packsData ? `${completed}/${total} completed` : "…"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
