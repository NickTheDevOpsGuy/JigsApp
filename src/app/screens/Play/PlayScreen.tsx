import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PlayScreen.module.css';

const STORAGE_KEY = 'phuzzle:imageUrl';

export function PlayScreen() {
  const nav = useNavigate();
  const imgUrl = sessionStorage.getItem(STORAGE_KEY);

  useEffect(() => {
    if (imgUrl) {
      console.info('[Phuzzle] PlayScreen loaded image from sessionStorage', {
        storageKey: STORAGE_KEY,
      });
    } else {
      console.info('[Phuzzle] PlayScreen: no image found in sessionStorage', {
        storageKey: STORAGE_KEY,
      });
    }
  }, [imgUrl]);

  if (!imgUrl) {
    return (
      <div className={styles.page}>
        <header className={styles.topBar}>
          <button className={styles.iconBtn} onClick={() => nav('/')}>
            Back
          </button>
          <div className={styles.title}>Phuzzle</div>
          <div />
        </header>

        <main className={styles.main}>
          <section className={styles.board}>No image selected. Go back and upload one.</section>
        </main>
      </div>
    );
  }

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
        <section className={styles.board}>
          <img className={styles.boardImg} src={imgUrl} alt="Puzzle source" />
          <div className={styles.boardHint}>Board placeholder (next ticket: slicing)</div>
        </section>

        <section className={styles.tray}>Piece tray placeholder</section>
      </main>
    </div>
  );
}