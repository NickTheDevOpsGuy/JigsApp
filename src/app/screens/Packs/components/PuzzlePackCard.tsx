import styles from "./PuzzlePackModule.module.css";
import { PuzzlePackProgress } from "./PuzzlePackProgress";

type PuzzlePackCardProps = {
  name: string;
  description: string;
  completed: number;
  total: number;
  coverImageUrl?: string | null;
  emoji: string;
  seasonTag?: string;
  summary?: string;
  onClick?: () => void;
  onCoverError?: () => void;
};

export function PuzzlePackCard({
  name,
  description,
  completed,
  total,
  coverImageUrl,
  emoji,
  seasonTag,
  summary,
  onClick,
  onCoverError,
}: PuzzlePackCardProps) {
  return (
    <button type="button" className={styles.packCard} onClick={onClick}>
      <div className={styles.packCover}>
        {coverImageUrl ? (
          <img
            className={styles.packCoverImage}
            src={coverImageUrl}
            alt=""
            onError={onCoverError}
          />
        ) : (
          <div className={styles.packCoverFallback}>{emoji}</div>
        )}
        <div className={styles.packCoverGlow} aria-hidden="true" />
        {seasonTag ? <span className={styles.seasonTag}>{seasonTag}</span> : null}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.headingRow}>
          <h3 className={styles.name}>{name}</h3>
          {summary ? <span className={styles.summary}>{summary}</span> : null}
        </div>
        <p className={styles.description}>{description}</p>
        <PuzzlePackProgress completed={completed} total={total} />
      </div>
    </button>
  );
}
