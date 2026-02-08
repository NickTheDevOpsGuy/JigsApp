import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import styles from "../PlayScreen.module.css";
import {
  buildMenuItems,
  type HeaderMenuProps,
  type MenuItemConfig,
} from "./headerMenuConfig";

export type { HeaderMenuProps } from "./headerMenuConfig";

/**
 * Single source of truth for the "hamburger" menu.
 * Config-driven to reduce repetition and keep UI consistent.
 */
export function HeaderMenu(props: HeaderMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = buildMenuItems(props, setOpen, (path) => navigate(path));

  useEffect(() => {
    if (!open) {
      setHelpExpanded(false);
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el || (e.target && el.contains(e.target as Node))) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const visibleItems = items.filter((i) => i.visible);
  const navItems = visibleItems.filter((i) => i.section === "nav");
  const settingsItems = visibleItems
    .filter((i) => i.section === "settings")
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );
  const helpItems = visibleItems.filter((i) => i.section === "help");
  const otherItems = visibleItems.filter((i) => i.section === "other");

  const renderItem = (item: MenuItemConfig) => {
    if (item.isTheme) {
      return (
        <div
          key={item.id}
          className={styles.headerMenuToggle}
          role="menuitem"
          onClick={item.onClick}
        >
          <ThemeToggle variant="menuItem" />
        </div>
      );
    }
    return (
      <button
        key={item.id}
        className={styles.headerMenuItem}
        role="menuitem"
        disabled={item.disabled}
        onClick={item.onClick}
      >
        {item.label}
      </button>
    );
  };

  return (
    <div className={styles.headerMenuWrap} ref={rootRef}>
      <Button
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((s) => !s)}
      >
        <Menu size={16} />
        <span className={styles.btnText}>Menu</span>
      </Button>

      {open && (
        <div className={styles.headerMenuPanel} role="menu">
          {navItems.map(renderItem)}
          <div className={styles.headerMenuDivider} />
          <div className={styles.headerMenuSection}>Settings</div>
          {settingsItems.map(renderItem)}
          <div className={styles.headerMenuDivider} />
          <div className={styles.headerMenuSection}>Help</div>
          <button
            type="button"
            className={styles.headerMenuHelpTrigger}
            onClick={() => setHelpExpanded((e) => !e)}
            aria-expanded={helpExpanded}
          >
            Choose help
            <ChevronRight
              size={16}
              className={styles.headerMenuChevron}
              style={{ transform: helpExpanded ? "rotate(90deg)" : undefined }}
            />
          </button>
          {helpExpanded && (
            <div className={styles.headerMenuHelpSubmenu}>
              {helpItems.map(renderItem)}
            </div>
          )}
          {otherItems.map(renderItem)}
        </div>
      )}
    </div>
  );
}
