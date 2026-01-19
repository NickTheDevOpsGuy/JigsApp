// src/app/screens/Setup/SetupScreen.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupScreen.module.css";

const STORAGE_KEY = "phuzzle:imageDataUrl";

/**
 * SetupScreen
 *
 * Upload + preview step.
 *
 * IMPORTANT:
 * - We store the image as a Data URL in localStorage.
 * - Do not store blob: URLs in localStorage, they break on refresh.
 */
export function SetupScreen() {
  const nav = useNavigate();
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) setImgDataUrl(existing);
  }, []);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const okType = file.type === "image/png" || file.type === "image/jpeg";
    if (!okType) {
      alert("Please choose a PNG or JPG image.");
      e.currentTarget.value = "";
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("That image is too large. Please choose one under 10 MB.");
      e.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result.startsWith("data:image/")) {
        alert("Could not read that file as an image. Try another image.");
        e.currentTarget.value = "";
        return;
      }

      setImgDataUrl(result);
    };

    reader.onerror = () => {
      alert("Could not read that file. Try another image.");
      e.currentTarget.value = "";
    };

    reader.readAsDataURL(file);
  }

  function onStart() {
    if (!imgDataUrl) {
      alert("Pick an image first.");
      return;
    }

    localStorage.setItem(STORAGE_KEY, imgDataUrl);
    nav("/play");
  }

  function onClear() {
    localStorage.removeItem(STORAGE_KEY);
    setImgDataUrl(null);
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
          {imgDataUrl ? (
            <img className={styles.previewImg} src={imgDataUrl} alt="Preview" />
          ) : (
            <div className={styles.previewEmpty}>Image Preview</div>
          )}
        </div>

        <div className={styles.row}>
          <button className={styles.secondary} onClick={() => nav("/")}>
            Back
          </button>

          <button className={styles.secondary} onClick={onClear} type="button">
            Clear
          </button>

          <button className={styles.primary} onClick={onStart}>
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetupScreen;
