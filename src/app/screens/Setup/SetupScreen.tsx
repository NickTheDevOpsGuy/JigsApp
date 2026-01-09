import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SetupScreen.module.css';

const STORAGE_KEY = 'phuzzle:imageUrl';

export function SetupScreen() {
  const nav = useNavigate();
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const okType = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!okType) {
      console.warn('[Phuzzle] Rejected file (type not allowed)', {
        name: file.name,
        type: file.type,
      });
      alert('Please choose a PNG or JPG image.');
      e.currentTarget.value = '';
      return;
    }

    // Optional safety limit (10 MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      console.warn('[Phuzzle] Rejected file (too large)', {
        name: file.name,
        sizeBytes: file.size,
        maxBytes,
      });
      alert('That image is too large. Please choose one under 10 MB.');
      e.currentTarget.value = '';
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    // Revoke old URL before replacing
    if (imgUrl) URL.revokeObjectURL(imgUrl);

    console.info('[Phuzzle] Image selected', {
      name: file.name,
      type: file.type,
      sizeKb: Math.round(file.size / 1024),
    });

    setImgUrl(nextUrl);
  }

  function onStart() {
    if (!imgUrl) {
      console.info('[Phuzzle] Start blocked: no image selected');
      alert('Pick an image first.');
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, imgUrl);

    console.info('[Phuzzle] Upload flow complete: saved imageUrl + navigating to /play', {
      storageKey: STORAGE_KEY,
    });

    nav('/play');
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>New Game</h1>

        <label className={styles.label}>
          Choose a Photo (PNG/JPG)
          <input
            className={styles.file}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onPickFile}
          />
        </label>

        <div className={styles.preview}>
          {imgUrl ? (
            <img className={styles.previewImg} src={imgUrl} alt="Preview" />
          ) : (
            <div className={styles.previewEmpty}>Image Preview</div>
          )}
        </div>

        <div className={styles.row}>
          <button className={styles.secondary} onClick={() => nav('/')}>
            Back
          </button>
          <button className={styles.primary} onClick={onStart}>
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
}