import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { HowToPlayModal } from "@/components/HowToPlay";

export function MenuScreen() {
  const nav = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />

        <Button variant="secondary" onClick={() => setShowHelp(true)} fullWidth>
          How to Play
        </Button>

        <Button variant="primary" onClick={() => nav("/new")} fullWidth>
          Choose Puzzle Photo
        </Button>
      </div>

      <HowToPlayModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
