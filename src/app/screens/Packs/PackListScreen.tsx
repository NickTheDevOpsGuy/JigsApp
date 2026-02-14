import { useNavigate } from "react-router-dom";
import styles from "./PackListScreen.module.css";
import { ArrowLeft } from "lucide-react";
import { PUZZLE_PACKS, getPuzzlesForPack } from "@/data/puzzlePacks";
import { getPackProgress } from "@/data/packCompletion";

export function PackListScreen() {
  const nav = useNavigate();

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
          {PUZZLE_PACKS.map((pack) => {
            const puzzles = getPuzzlesForPack(pack);
            const { completed, total } = getPackProgress(puzzles.map((p) => p.id));

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
                    {completed}/{total} completed
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
