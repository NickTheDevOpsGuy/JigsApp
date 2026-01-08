import { useNavigate } from 'react-router-dom';
import styles from './NewGameScreen.module.css';

export function NewGameScreen() {
  const nav = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>New Game</h1>

        <label className={styles.label}>
          Photo Source
          <select className={styles.select} defaultValue="upload">
            <option value="upload">Photo Upload</option>
            <option value="catalog">Catalog Search</option>
            <option value="ai">Generate with AI</option>
          </select>
        </label>

        <label className={styles.label}>
          Size
          <select className={styles.select} defaultValue="20">
            <option value="20">20 (4 × 5)</option>
            <option value="30">30 (5 × 6)</option>
            <option value="36">36 (4 × 9)</option>
          </select>
        </label>

        <div className={styles.row}>
          <button className={styles.secondary} onClick={() => nav('/')}>
            Back
          </button>
          <button className={styles.primary} onClick={() => nav('/play')}>
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
}