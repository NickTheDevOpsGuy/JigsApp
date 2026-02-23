/**
 * SnapComboMeter – shows combo count when 2+ quick placements.
 * Visible excitement feedback; breaks on idle.
 */
import React, { useEffect, useState } from "react";
import styles from "./SnapComboMeter.module.css";

const COMBO_IDLE_MS = 2500;

type Props = {
  combo: number;
  onComboBreak?: () => void;
};

export function SnapComboMeter({ combo, onComboBreak }: Props) {
  const [visible, setVisible] = useState(combo >= 2);
  const prevCombo = React.useRef(combo);

  useEffect(() => {
    if (combo >= 2) {
      setVisible(true);
      prevCombo.current = combo;
      const t = setTimeout(() => {
        setVisible(false);
        onComboBreak?.();
      }, COMBO_IDLE_MS);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [combo, onComboBreak]);

  if (!visible || combo < 2) return null;

  return (
    <div
      className={styles.comboMeter}
      role="status"
      aria-live="polite"
      aria-label={`Combo ${combo}`}
    >
      <span className={styles.comboLabel}>Combo</span>
      <span className={styles.comboValue}>×{combo}</span>
    </div>
  );
}
