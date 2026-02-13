import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import styles from "../PlayScreen.module.css";
import {
  buildMenuItems,
  type HeaderMenuProps,
  type MenuItemConfig,
  type SubMenuId,
} from "./headerMenuConfig";

export type { HeaderMenuProps } from "./headerMenuConfig";

const SUB_MENU_LABELS: Record<SubMenuId, string> = {
  game: "Game",
  view: "View",
  audio: "Audio",
};

/**
 * Single source of truth for the "hamburger" menu.
 * Config-driven to reduce repetition and keep UI consistent.
 */
export function HeaderMenu(props: HeaderMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuId | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = buildMenuItems(props, setOpen, (path) => navigate(path));

  useEffect(() => {
    if (!open) setActiveSubMenu(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el || (e.target && el.contains(e.target as Node))) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeSubMenu) setActiveSubMenu(null);
        else setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, activeSubMenu]);

  const visibleItems = items.filter((i) => i.visible);
  const navItems = visibleItems.filter((i) => i.section === "nav");
  const settingsItems = visibleItems
    .filter((i) => i.section === "settings")
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );
  const otherItems = visibleItems.filter((i) => i.section === "other");

  const topLevelSettings = settingsItems.filter((i) => !i.subMenu);
  const subMenuItems = settingsItems
    .filter((i) => i.subMenu === activeSubMenu)
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );

  const hasSubMenuItems = (id: SubMenuId) => settingsItems.some((i) => i.subMenu === id);

  const closeAnd = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

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

  const renderMainMenu = () => (
    <>
      {navItems.map(renderItem)}
      <div className={styles.headerMenuDivider} />
      <div className={styles.headerMenuSection}>Help</div>
      <button
        type="button"
        className={styles.headerMenuItem}
        role="menuitem"
        onClick={closeAnd(props.onShowHelpChoice)}
      >
        Help
      </button>
      <div className={styles.headerMenuDivider} />
      <div className={styles.headerMenuSection}>Settings</div>
      {hasSubMenuItems("game") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("game")}
        >
          {SUB_MENU_LABELS.game}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {hasSubMenuItems("view") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("view")}
        >
          {SUB_MENU_LABELS.view}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {hasSubMenuItems("audio") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("audio")}
        >
          {SUB_MENU_LABELS.audio}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {topLevelSettings.map(renderItem)}
      {otherItems.map(renderItem)}
    </>
  );

  const renderSubMenu = () => (
    <>
      <button
        type="button"
        className={styles.headerMenuBack}
        role="menuitem"
        onClick={() => setActiveSubMenu(null)}
      >
        <ChevronLeft size={16} />
        Back
      </button>
      <div className={styles.headerMenuDivider} />
      <div className={styles.headerMenuSection}>{SUB_MENU_LABELS[activeSubMenu!]}</div>
      {subMenuItems.map(renderItem)}
    </>
  );

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
          {activeSubMenu ? renderSubMenu() : renderMainMenu()}
        </div>
      )}
    </div>
  );
}
