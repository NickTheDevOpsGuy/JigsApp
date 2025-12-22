import styles from '@/screens/Menu/MenuScreen.module.css';
import logoImg from '@/assets/ui/jigsaw-logo.png';

export function MenuScreen() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <img
            src={logoImg}
            alt="JigsApp logo"
            className={styles.logo}
          />
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