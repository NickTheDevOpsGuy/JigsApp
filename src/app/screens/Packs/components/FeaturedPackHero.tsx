/**
 * Featured Pack – large hero card: pack image, name, short description, progress, Continue Pack or Play Pack.
 */
import styles from "./PuzzlePackModule.module.css";

type FeaturedPackHeroProps = {
  name: string;
  description: string;
  completed: number;
  total: number;
  coverImageUrl: string | null;
  emoji: string;
  onCoverError?: () => void;
  onClick: () => void;
};

export function FeaturedPackHero({
  name,
  description,
  completed,
  total,
  coverImageUrl,
  emoji,
  onCoverError,
  onClick,
}: FeaturedPackHeroProps) {
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isStarted = completed > 0;
  const buttonLabel = isStarted ? "Continue Pack" : "Play Pack";

  return (
    <section className={styles.featuredHero} aria-label="Featured pack">
      <button
        type="button"
        className={styles.featuredHeroCard}
        onClick={onClick}
        aria-label={`${buttonLabel}: ${name}`}
        title={`${buttonLabel}: ${name}`}
      >
        <div className={styles.featuredHeroCover}>
          {coverImageUrl ? (
            <img
              className={styles.featuredHeroImage}
              src={coverImageUrl}
              alt=""
              loading="eager"
              decoding="async"
              onError={onCoverError}
            />
          ) : (
            <div className={styles.featuredHeroFallback}>{emoji}</div>
          )}
          <div className={styles.featuredHeroGlow} aria-hidden />
        </div>
        <div className={styles.featuredHeroBody}>
          <h2 className={styles.featuredHeroName}>{name}</h2>
          <p className={styles.featuredHeroDesc}>{description}</p>
          <div className={styles.featuredHeroProgress}>
            <div className={styles.progressBlock}>
              <div className={styles.progressBarRow}>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={styles.progressPercent}>{progressPercent}%</span>
              </div>
              <p className={styles.progressText}>
                {completed} / {total} puzzles
              </p>
            </div>
          </div>
          <span className={styles.featuredHeroCta}>{buttonLabel}</span>
        </div>
      </button>
    </section>
  );
}
