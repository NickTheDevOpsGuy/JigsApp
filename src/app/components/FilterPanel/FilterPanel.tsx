/**
 * FilterPanel – clean filter sheet/popover for Puzzle Packs and Pick a Puzzle.
 * Mobile: bottom sheet. Desktop: compact modal panel.
 */
import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./FilterPanel.module.css";

export type FilterOption = { id: string; name: string; label?: string };

export interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Category options: first is typically "All" */
  categoryOptions: FilterOption[];
  selectedCategoryId: string;
  onCategorySelect: (id: string) => void;
  /** Optional status filter (e.g. for packs) */
  statusOptions?: FilterOption[];
  selectedStatusId?: string;
  onStatusSelect?: (id: string) => void;
  /** Optional difficulty filter */
  difficultyOptions?: FilterOption[];
  selectedDifficultyId?: string;
  onDifficultySelect?: (id: string) => void;
  onApply: () => void;
  onReset: () => void;
  /** Anchor for desktop popover; if not set, panel is centered */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const DEFAULT_STATUS: FilterOption[] = [
  { id: "all", name: "All" },
  { id: "not_started", name: "Not Started" },
  { id: "in_progress", name: "In Progress" },
  { id: "completed", name: "Completed" },
];

const DEFAULT_DIFFICULTY: FilterOption[] = [
  { id: "any", name: "Any" },
  { id: "easy", name: "Easy" },
  { id: "medium", name: "Medium" },
  { id: "hard", name: "Hard" },
  { id: "expert", name: "Expert" },
];

export function FilterPanel({
  isOpen,
  onClose,
  title = "Filter",
  categoryOptions,
  selectedCategoryId,
  onCategorySelect,
  statusOptions = DEFAULT_STATUS,
  selectedStatusId = "all",
  onStatusSelect,
  difficultyOptions = DEFAULT_DIFFICULTY,
  selectedDifficultyId = "any",
  onDifficultySelect,
  onApply,
  onReset,
}: FilterPanelProps) {
  const isMobile = useMediaQuery("(max-width: 600px)");

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleReset = () => {
    onReset();
  };

  if (!isOpen) return null;

  const content = (
    <div
      className={isMobile ? styles.sheet : styles.popover}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className={styles.body}>
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Category</legend>
          <div className={styles.optionList}>
            {categoryOptions.map((opt) => (
              <label key={opt.id} className={styles.optionRow}>
                <input
                  type="radio"
                  name="filter-category"
                  value={opt.id}
                  checked={selectedCategoryId === opt.id}
                  onChange={() => onCategorySelect(opt.id)}
                  className={styles.radio}
                />
                <span>{opt.label ?? opt.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {onStatusSelect && statusOptions.length > 0 && (
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Status</legend>
            <div className={styles.optionList}>
              {statusOptions.map((opt) => (
                <label key={opt.id} className={styles.optionRow}>
                  <input
                    type="radio"
                    name="filter-status"
                    value={opt.id}
                    checked={(selectedStatusId ?? "all") === opt.id}
                    onChange={() => onStatusSelect(opt.id)}
                    className={styles.radio}
                  />
                  <span>{opt.label ?? opt.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {onDifficultySelect && difficultyOptions.length > 0 && (
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Difficulty</legend>
            <div className={styles.optionList}>
              {difficultyOptions.map((opt) => (
                <label key={opt.id} className={styles.optionRow}>
                  <input
                    type="radio"
                    name="filter-difficulty"
                    value={opt.id}
                    checked={(selectedDifficultyId ?? "any") === opt.id}
                    onChange={() => onDifficultySelect(opt.id)}
                    className={styles.radio}
                  />
                  <span>{opt.label ?? opt.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
        <button type="button" className={styles.applyBtn} onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        role="presentation"
        onClick={onClose}
        aria-hidden
      />
      {content}
    </>,
    document.body,
  );
}
