/**
 * ShortcutsModal – keyboard shortcuts reference overlay (accessible dialog).
 */
import React, { useState, useMemo, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
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
import { useModalBodyScrollLock } from "@/hooks/useModalBodyScrollLock";
import { useDialogKeyboard } from "@/hooks/useDialogKeyboard";
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
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

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

  useModalBodyScrollLock(isOpen);
  useDialogKeyboard(isOpen, dialogRef, onClose);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const focusRaf = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusRaf);
      const prev = restoreFocusRef.current;
      if (prev && typeof prev.focus === "function" && document.contains(prev)) {
        window.requestAnimationFrame(() => {
          prev.focus({ preventScroll: true });
        });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className={styles.overlay}
        onClick={onClose}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        role="presentation"
        tabIndex={-1}
      >
        <div
          ref={dialogRef}
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <Keyboard size={22} aria-hidden />
              <h2 id={titleId}>Keyboard Shortcuts</h2>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <p id={descId} className={styles.srOnly}>
            Reference of keyboard shortcuts and pointer controls. Use the search field to
            filter. Press Escape to close.
          </p>

          <div className={styles.searchWrap}>
            <input
              ref={searchInputRef}
              type="search"
              className={styles.searchInput}
              placeholder="Search shortcuts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search shortcuts"
              title="Search shortcuts"
            />
          </div>

          <div className={styles.content}>
            <div className={styles.grid}>
              {filteredGroups.map((group) => {
                const Icon = SECTION_ICONS[group.id];
                return (
                  <section
                    key={group.id}
                    className={styles.section}
                    data-group={group.id}
                    aria-label={group.title}
                  >
                    <h3 className={styles.sectionTitle}>
                      {Icon && (
                        <Icon size={14} className={styles.sectionIcon} aria-hidden />
                      )}
                      {group.title}
                    </h3>
                    <table className={styles.table}>
                      <caption className={styles.srOnly}>
                        {group.title} shortcuts: key combinations and actions
                      </caption>
                      <tbody>
                        {group.shortcuts.map((shortcut, i) => {
                          const disabled = disabledActions.includes(shortcut.action);
                          return (
                            <tr
                              key={`${group.id}-${i}`}
                              className={disabled ? styles.rowDisabled : undefined}
                            >
                              <th scope="row" className={styles.keys}>
                                {shortcut.keys.map((key, j) => (
                                  <React.Fragment key={j}>
                                    {j > 0 && (
                                      <span className={styles.separator}>or</span>
                                    )}
                                    <kbd className={styles.key}>{formatKey(key)}</kbd>
                                  </React.Fragment>
                                ))}
                              </th>
                              <td className={styles.action}>{shortcut.action}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </section>
                );
              })}

              <section
                className={`${styles.section} ${styles.sectionInputRef}`}
                aria-label="Input reference"
              >
                <h3 className={styles.sectionTitleInput}>
                  <Mouse size={14} className={styles.sectionIcon} aria-hidden />
                  Input Reference
                </h3>
                <table className={styles.table}>
                  <caption className={styles.srOnly}>
                    Mouse and touch controls for moving and rotating pieces
                  </caption>
                  <tbody>
                    <tr>
                      <th scope="row" className={styles.keys}>
                        <kbd className={styles.key}>Click</kbd> + Drag
                      </th>
                      <td className={styles.action}>Move piece</td>
                    </tr>
                    <tr>
                      <th scope="row" className={styles.keys}>
                        <kbd className={styles.key}>Right Click</kbd>
                      </th>
                      <td className={styles.action}>Rotate piece</td>
                    </tr>
                    <tr>
                      <th scope="row" className={styles.keys}>
                        <kbd className={styles.key}>Drag</kbd> to drawer
                      </th>
                      <td className={styles.action}>Store piece</td>
                    </tr>
                    <tr>
                      <th scope="row" className={styles.keys}>
                        <kbd className={styles.key}>Tap</kbd>
                      </th>
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
    </>,
    document.body,
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
