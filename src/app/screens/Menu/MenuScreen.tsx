// src/app/screens/Menu/MenuScreen.tsx

import styles from './MenuScreen.module.css';
// Once you add the file: import logoImg from '@assets/ui/jigsaw-logo.png';

export function MenuScreen() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          {/* <img className={styles.logo} src={logoImg} alt="JigsApp logo" /> */}
          <div className={styles.logoPlaceholder}>LOGO</div>
        </div>

        <div className={styles.row}>
          <button className={styles.secondary}>How to Play</button>
          <button className={styles.secondary}>Settings</button>
        </div>

        <select className={styles.select} defaultValue="Easy">
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        <button className={styles.primary}>Choose Puzzle Photo</button>
      </div>
    </div>
  );
}
