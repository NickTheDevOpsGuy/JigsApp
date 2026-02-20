/**
 * Dropdown – select input for grid size, theme, etc.
 */
import React from "react";
import styles from "./Dropdown.module.css";

type DropdownOption = {
  value: string | number;
  label: string;
};

type DropdownProps = {
  value: string | number;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  className?: string;
};

export function Dropdown({
  value,
  onChange,
  options,
  label,
  disabled = false,
  fullWidth = false,
  compact = false,
  className = "",
}: DropdownProps) {
  return (
    <div
      className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""} ${compact ? styles.compact : ""} ${className}`}
    >
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectWrapper}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow}>▼</span>
      </div>
    </div>
  );
}

export default Dropdown;
