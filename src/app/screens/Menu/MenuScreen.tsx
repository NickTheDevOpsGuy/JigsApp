import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";

export function MenuScreen() {
  const nav = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />

        <button
          className={styles.secondary}
          onClick={() => alert("Hook up modal later")}
        >
          How to Play
        </button>

        <button className={styles.primary} onClick={() => nav("/new")}>
          Choose Puzzle Photo
        </button>
      </div>
    </div>
  );
}
