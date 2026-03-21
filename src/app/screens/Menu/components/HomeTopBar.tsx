import type { ReactNode } from "react";

import styles from "../MenuScreen.module.css";

type HomeTopBarProps = {
  logoSrc: string;
  menuDate: string;
  onOpenStats: () => void;
  onOpenHelp: () => void;
  statsIcon: ReactNode;
};

export function HomeTopBar({
  logoSrc,
  menuDate,
  onOpenStats,
  onOpenHelp,
  statsIcon,
}: HomeTopBarProps) {
  return (
    <div className={styles.homeBar}>
      <button
        type="button"
        className={styles.cornerBtn}
        onClick={onOpenStats}
        aria-label="Leaderboard"
        data-testid="menu-stats"
      >
        {statsIcon}
      </button>
      <div className={styles.brandBlock}>
        <div className={styles.brandRow}>
          <img className={styles.brandLogo} src={logoSrc} alt="Phuzzle logo" />
          <div className={styles.brandCopy}>
            <p className={styles.brandTitle}>Phuzzle</p>
            <p className={styles.brandDate} aria-live="polite">
              {menuDate}
            </p>
          </div>
        </div>
      </div>
      <div className={styles.cornerBtns}>
        <button
          type="button"
          className={styles.cornerBtn}
          onClick={onOpenHelp}
          aria-label="Help"
          data-testid="menu-help"
        >
          ?
        </button>
      </div>
    </div>
  );
}
