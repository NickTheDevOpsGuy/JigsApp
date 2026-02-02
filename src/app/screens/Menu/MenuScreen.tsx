import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MenuScreen.module.css";

import logoImg from "@/assets/ui/phuzzle-logo-512.png";
import { Button } from "@/components/Button/Button";
import { TutorialOverlay } from "@/components/HowToPlay";
import { HelpCircle, Image } from "lucide-react";

export function MenuScreen() {
  const nav = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img className={styles.logo} src={logoImg} alt="Phuzzle logo" />

        <Button variant="secondary" onClick={() => setShowHelp(true)} fullWidth>
          <HelpCircle size={18} />
          How to Play
        </Button>

        <Button variant="primary" onClick={() => nav("/new")} fullWidth>
          <Image size={18} />
          Choose Puzzle Photo
        </Button>
      </div>

      <TutorialOverlay isOpen={showHelp} onComplete={() => setShowHelp(false)} />
    </div>
  );
}
