import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupScreen.module.css";

const STORAGE_KEY = "phuzzle:imageDataUrl";

export function SetupScreen() {
  const nav = useNavigate();
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);

  // On mount, restore last selected image (optional but nice)
  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) setImgDataUrl(existing);
  }, []);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const okType = file.type === "image/png" || file.type === "image/jpeg";
    if (!okType) {
      console.warn("[Phuzzle] Rejected file (type not allowed)", {
        name: file.name,
        type: file.type,
      });
      alert("Please choose a PNG or JPG image.");
      e.currentTarget.value = "";
      return;
    }

    // Safety limit (10 MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      console.warn("[Phuzzle] Rejected file (too large)", {
        name: file.name,
        sizeBytes: file.size,
        maxBytes,
      });
      alert("That image is too large. Please choose one under 10 MB.");
      e.currentTarget.value = "";
      return;
    }

    console.info("[Phuzzle] Reading image file as Data URL", {
      name: file.name,
      type: file.type,
      sizeKb: Math.round(file.size / 1024),
    });

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        console.warn("[Phuzzle] Unexpected FileReader result type", { result });
        alert("Could not read that file. Try another image.");
        e.currentTarget.value = "";
        return;
      }

      setImgDataUrl(result);

      console.info("[Phuzzle] Image selected (dataUrl ready)", {
        storageKey: STORAGE_KEY,
      });
    };

    reader.onerror = () => {
      console.warn("[Phuzzle] FileReader error", reader.error);
      alert("Could not read that file. Try another image.");
      e.currentTarget.value = "";
    };

    reader.readAsDataURL(file);
  }

  function onStart() {
    if (!imgDataUrl) {
      console.info("[Phuzzle] Start blocked: no image selected");
      alert("Pick an image first.");
      return;
    }

    localStorage.setItem(STORAGE_KEY, imgDataUrl);

    console.info(
      "[Phuzzle] Upload flow complete: saved dataUrl + navigating to /play",
      {
        storageKey: STORAGE_KEY,
      },
    );

    nav("/play");
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
          <button className={styles.primary} onClick={onStart}>
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
}
