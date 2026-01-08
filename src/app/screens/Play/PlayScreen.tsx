import { useNavigate } from 'react-router-dom';
import styles from './PlayScreen.module.css';

export function PlayScreen() {
  const nav = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => nav('/')}>
          Back
        </button>
        <div className={styles.title}>Phuzzle</div>
        <button className={styles.iconBtn} onClick={() => alert('Settings later')}>
          Settings
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.board}>Board placeholder</section>
        <section className={styles.tray}>Piece tray placeholder</section>
      </main>
    </div>
  );
}