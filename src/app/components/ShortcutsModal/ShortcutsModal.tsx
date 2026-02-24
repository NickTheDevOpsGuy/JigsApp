/**
 * ShortcutsModal – keyboard shortcuts reference overlay.
 */
import React, { useState, useMemo } from "react";
import { X, Keyboard, Gamepad2, Compass, Settings, Mouse } from "lucide-react";
import { SHORTCUTS, SHORTCUT_GROUPS } from "@/hooks/useKeyboardShortcuts";
import type { ShortcutId } from "@/hooks/useKeyboardShortcuts";
import styles from "./ShortcutsModal.module.css";

const SECTION_ICONS = {
  gameplay: Gamepad2,
  navigation: Compass,
  system: Settings,
} as const;

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: dim these shortcuts when not available */
  disabledIds?: ShortcutId[];
}

export function ShortcutsModal({
  isOpen,
  onClose,
  disabledIds = [],
}: ShortcutsModalProps) {
  const [search, setSearch] = useState("");
  const shortcutsById = useMemo(() => new Map(SHORTCUTS.map((s) => [s.id, s])), []);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return SHORTCUT_GROUPS;
    const q = search.toLowerCase().trim();
    const navTerms = ["zoom", "pan", "scroll", "pinch", "middle"];
    return SHORTCUT_GROUPS.map((g) => {
      const shortcutIds = g.shortcutIds.filter((id) => {
        const s = shortcutsById.get(id);
        return (
          s &&
          (s.action.toLowerCase().includes(q) ||
            s.keys.some((k) => formatKey(k).toLowerCase().includes(q)))
        );
      });
      if (g.id === "navigation" && navTerms.some((t) => t.includes(q) || q.includes(t))) {
        return {
          ...g,
          shortcutIds: shortcutIds.length > 0 ? shortcutIds : g.shortcutIds,
        };
      }
      return { ...g, shortcutIds };
    }).filter((g) => g.shortcutIds.length > 0);
  }, [search, shortcutsById]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
              const isNav = group.id === "navigation";
              return (
                <section key={group.id} className={styles.section} data-group={group.id}>
                  <h3 className={styles.sectionTitle}>
                    {Icon && <Icon size={14} className={styles.sectionIcon} />}
                    {group.title}
                  </h3>
                  <table className={styles.table}>
                    <tbody>
                      {isNav && (
                        <>
                          <tr>
                            <td className={styles.keys}>
                              <kbd className={styles.key}>Scroll</kbd>
                            </td>
                            <td className={styles.action}>Zoom</td>
                          </tr>
                          <tr>
                            <td className={styles.keys}>
                              <kbd className={styles.key}>Middle</kbd> + Drag
                            </td>
                            <td className={styles.action}>Pan</td>
                          </tr>
                          <tr>
                            <td className={styles.keys}>
                              <kbd className={styles.key}>Pinch</kbd> /{" "}
                              <kbd className={styles.key}>Two-finger drag</kbd>
                            </td>
                            <td className={styles.action}>Zoom & pan (touch)</td>
                          </tr>
                        </>
                      )}
                      {group.shortcutIds.map((id) => {
                        const shortcut = shortcutsById.get(id);
                        if (!shortcut) return null;
                        const disabled = disabledIds.includes(id);
                        return (
                          <tr
                            key={id}
                            className={disabled ? styles.rowDisabled : undefined}
                            aria-label={`${shortcut.ariaAction}: ${shortcut.keys.join(" or ")}`}
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
                  {isNav && (
                    <p className={styles.navNote}>
                      Board fits your screen. Use the piece tray and arrow keys to nudge
                      selected pieces.
                    </p>
                  )}
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
  };
  return keyMap[key] ?? key;
}
