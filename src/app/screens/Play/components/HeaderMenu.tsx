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
  about: "About",
  audio: "Audio",
  board: "Board",
  controls: "Control",
  display: "Display",
  game: "Game",
  help: "Help",
  navigation: "Navigate",
  share: "Share",
  stats: "Leaderboards",
  view: "View",
};

/** When in About submenu, Back goes to main menu (no longer nested under Help) */
const ABOUT_PARENT = null as SubMenuId | null;

/** When in Display or Board, Back goes to View */
const VIEW_SUBMENU_IDS: SubMenuId[] = ["display", "board"];
const VIEW_PARENT_ID: SubMenuId = "view";

/** Settings submenus in alphabetical order */
const SETTINGS_SUBMENU_ORDER: SubMenuId[] = [
  "audio",
  "controls",
  "game",
  "navigation",
  "share",
  "stats",
  "view",
];

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
  const settingsItems = visibleItems
    .filter((i) => i.section === "settings")
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );
  const helpItems = visibleItems
    .filter((i) => i.section === "help")
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );
  const aboutItems = visibleItems
    .filter((i) => i.section === "about")
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );
  const otherItems = visibleItems.filter((i) => i.section === "other");

  const topLevelSettings = settingsItems.filter((i) => !i.subMenu);
  const subMenuItems =
    activeSubMenu === "help"
      ? helpItems
      : activeSubMenu === "about"
        ? aboutItems
        : settingsItems
            .filter((i) => i.subMenu === activeSubMenu)
            .sort((a, b) =>
              (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
                sensitivity: "base",
              }),
            );

  const hasSubMenuItems = (id: SubMenuId) =>
    id === "help"
      ? helpItems.length > 0
      : id === "about"
        ? aboutItems.length > 0
        : id === "view"
          ? settingsItems.some((i) => i.subMenu === "display" || i.subMenu === "board")
          : settingsItems.some((i) => i.subMenu === id);

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
      <div className={styles.headerMenuSection}>Help</div>
      {hasSubMenuItems("help") && props.onShowHelpChoice && (
        <button
          type="button"
          className={styles.headerMenuItem}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            props.onShowHelpChoice();
          }}
        >
          {SUB_MENU_LABELS.help}
        </button>
      )}
      {hasSubMenuItems("about") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("about")}
        >
          {SUB_MENU_LABELS.about}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      <div className={styles.headerMenuDivider} />
      <div className={styles.headerMenuSection}>Settings</div>
      {SETTINGS_SUBMENU_ORDER.filter((id) => hasSubMenuItems(id)).map((id) => (
        <button
          key={id}
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu(id)}
        >
          {SUB_MENU_LABELS[id]}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      ))}
      {topLevelSettings.map(renderItem)}
      {otherItems.map(renderItem)}
    </>
  );

  const handleBack = () => {
    if (activeSubMenu === "about") setActiveSubMenu(ABOUT_PARENT);
    else if (VIEW_SUBMENU_IDS.includes(activeSubMenu!)) setActiveSubMenu(VIEW_PARENT_ID);
    else setActiveSubMenu(null);
  };

  const renderSubMenu = () => (
    <>
      <button
        type="button"
        className={styles.headerMenuBack}
        role="menuitem"
        onClick={handleBack}
      >
        <ChevronLeft size={16} />
        Back
      </button>
      <div className={styles.headerMenuDivider} />
      <div className={styles.headerMenuSection}>{SUB_MENU_LABELS[activeSubMenu!]}</div>
      {activeSubMenu === "view" && (
        <>
          <button
            type="button"
            className={styles.headerMenuSubmenuTrigger}
            role="menuitem"
            onClick={() => setActiveSubMenu("display")}
          >
            {SUB_MENU_LABELS.display}
            <ChevronRight size={16} className={styles.headerMenuChevron} />
          </button>
          <button
            type="button"
            className={styles.headerMenuSubmenuTrigger}
            role="menuitem"
            onClick={() => setActiveSubMenu("board")}
          >
            {SUB_MENU_LABELS.board}
            <ChevronRight size={16} className={styles.headerMenuChevron} />
          </button>
        </>
      )}
      {activeSubMenu === "view" && (
        <>
          <button
            type="button"
            className={styles.headerMenuSubmenuTrigger}
            role="menuitem"
            onClick={() => setActiveSubMenu("display")}
          >
            {SUB_MENU_LABELS.display}
            <ChevronRight size={16} className={styles.headerMenuChevron} />
          </button>
          <button
            type="button"
            className={styles.headerMenuSubmenuTrigger}
            role="menuitem"
            onClick={() => setActiveSubMenu("board")}
          >
            {SUB_MENU_LABELS.board}
            <ChevronRight size={16} className={styles.headerMenuChevron} />
          </button>
        </>
      )}
      {subMenuItems.map(renderItem)}
    </>
  );

  return (
    <div className={styles.headerMenuWrap} ref={rootRef}>
      <Button
        size="sm"
        className={styles.headerMenuTrigger}
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
