/**
 * ShortcutsModal – keyboard shortcuts reference overlay.
 */
import React, { useState, useMemo } from "react";
import {
  X,
  Keyboard,
  Gamepad2,
  Compass,
  Settings,
  HelpCircle,
  Mouse,
} from "lucide-react";
import { SHORTCUT_GROUPS } from "@/hooks/useKeyboardShortcuts";
import styles from "./ShortcutsModal.module.css";

type GroupId = (typeof SHORTCUT_GROUPS)[number]["id"];
const SECTION_ICONS: Record<GroupId, typeof Gamepad2> = {
  gameplay: Gamepad2,
  pieceControl: Compass,
  displayAudio: Settings,
  help: HelpCircle,
};

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: dim these shortcuts when not available (match by action text) */
  disabledActions?: string[];
}

export function ShortcutsModal({
  isOpen,
  onClose,
  disabledActions = [],
}: ShortcutsModalProps) {
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return SHORTCUT_GROUPS;
    const q = search.toLowerCase().trim();
    return SHORTCUT_GROUPS.map((g) => ({
      ...g,
      shortcuts: g.shortcuts.filter(
        (s) =>
          s.action.toLowerCase().includes(q) ||
          s.keys.some((k) => formatKey(k).toLowerCase().includes(q)),
      ),
    })).filter((g) => g.shortcuts.length > 0);
  }, [search]);

  if (!isOpen) return null;

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Keyboard size={22} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.searchWrap}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search shortcuts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search shortcuts"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.grid}>
            {filteredGroups.map((group) => {
              const Icon = SECTION_ICONS[group.id];
              return (
                <section key={group.id} className={styles.section} data-group={group.id}>
                  <h3 className={styles.sectionTitle}>
                    {Icon && <Icon size={14} className={styles.sectionIcon} />}
                    {group.title}
                  </h3>
                  <table className={styles.table}>
                    <tbody>
                      {group.shortcuts.map((shortcut, i) => {
                        const disabled = disabledActions.includes(shortcut.action);
                        const keysLabel = shortcut.keys.map(formatKey).join(" or ");
                        return (
                          <tr
                            key={`${group.id}-${i}`}
                            className={disabled ? styles.rowDisabled : undefined}
                            aria-label={`${shortcut.action}: ${keysLabel}`}
                          >
                            <td className={styles.keys}>
                              {shortcut.keys.map((key, j) => (
                                <React.Fragment key={j}>
                                  {j > 0 && <span className={styles.separator}>or</span>}
                                  <kbd className={styles.key}>{formatKey(key)}</kbd>
                                </React.Fragment>
                              ))}
                            </td>
                            <td className={styles.action}>{shortcut.action}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              );
            })}

            <section className={`${styles.section} ${styles.sectionInputRef}`}>
              <h3 className={styles.sectionTitleInput}>
                <Mouse size={14} className={styles.sectionIcon} />
                Input Reference
              </h3>
              <table className={styles.table}>
                <tbody>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Click</kbd> + Drag
                    </td>
                    <td className={styles.action}>Move piece</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Right Click</kbd>
                    </td>
                    <td className={styles.action}>Rotate piece</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Drag</kbd> to drawer
                    </td>
                    <td className={styles.action}>Store piece</td>
                  </tr>
                  <tr>
                    <td className={styles.keys}>
                      <kbd className={styles.key}>Tap</kbd>
                    </td>
                    <td className={styles.action}>Rotate (touch)</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>
            Press <kbd className={styles.key}>?</kbd> anytime
          </span>
        </div>
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    " ": "Space",
    Space: "Space",
    Shift: "⇧",
    Tab: "Tab",
    Esc: "Esc",
    Escape: "Esc",
    F1: "F1",
    "Ctrl+Z": "Ctrl+Z",
    "⌘Z": "⌘Z",
    "Ctrl+Shift+Z": "Ctrl+Shift+Z",
    "⌘⇧Z": "⌘⇧Z",
    "Ctrl+Y": "Ctrl+Y",
    "⌘Y": "⌘Y",
    "↑": "↑",
    "↓": "↓",
    "←": "←",
    "→": "→",
  };
  return keyMap[key] ?? key;
}
