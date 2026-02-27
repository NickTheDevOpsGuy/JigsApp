/**
 * Loader – inline spinner for async screens (Stats, Packs, etc.).
 */
import styles from "./Loader.module.css";

type Props = {
  /** Optional label (e.g. "Loading…") */
  label?: string;
};

export function Loader({ label = "Loading…" }: Props) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
