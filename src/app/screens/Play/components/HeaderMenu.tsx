/**
 * HeaderMenu – hamburger menu with Theme, Gameplay, Display, Audio, Advanced.
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "../PlayScreen.module.css";
import {
  buildMenuItems,
  type HeaderMenuProps,
  type MenuItemConfig,
  type SubMenuId,
} from "./headerMenuConfig";

export type { HeaderMenuProps } from "./headerMenuConfig";

const SUB_MENU_LABELS: Record<SubMenuId, string> = {
  about: "ℹ️ About",
  advanced: "⚙️ Advanced",
  audio: "🔊 Audio",
  contribute: "ℹ️ About",
  controls: "🎮 Controls",
  display: "👁️ Display",
  gameplay: "🎯 Gameplay",
  help: "❓ Help",
  navigation: "🧭 Navigate",
  share: "👥 Share",
  stats: "🏆 Leaderboards",
  theme: "🎨 Theme",
};

const SUBMENU_PARENT: Partial<Record<SubMenuId, SubMenuId>> = {
  controls: "gameplay",
  contribute: "about",
  help: "about",
};

const SETTINGS_SUBMENU_ORDER: SubMenuId[] = [
  "advanced",
  "audio",
  "display",
  "gameplay",
  "navigation",
  "share",
  "stats",
];

export function HeaderMenu(props: HeaderMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuId | null>(null);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = buildMenuItems(props, setOpen, (path) => navigate(path));

  useEffect(() => {
    if (!open) {
      setActiveSubMenu(null);
    }
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
        if (activeSubMenu) {
          const parent = SUBMENU_PARENT[activeSubMenu];
          setActiveSubMenu(parent ?? null);
        } else {
          setOpen(false);
        }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const panel = rootRef.current?.querySelector("[role='menu']");
        if (!panel) return;
        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(
            "button[role='menuitem'], [role='menuitem']",
          ),
        ).filter((el) => !(el as HTMLButtonElement).disabled);
        const idx = focusable.indexOf(document.activeElement as HTMLElement);
        if (idx === -1) {
          focusable[0]?.focus();
        } else if (e.key === "ArrowDown" && idx < focusable.length - 1) {
          focusable[idx + 1]?.focus();
        } else if (e.key === "ArrowUp" && idx > 0) {
          focusable[idx - 1]?.focus();
        }
        e.preventDefault();
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
  const contributeItems = visibleItems
    .filter((i) => i.section === "contribute")
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );

  const subMenuItems =
    activeSubMenu === "help"
      ? helpItems
      : activeSubMenu === "about"
        ? aboutItems
        : activeSubMenu === "contribute"
          ? contributeItems
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
        ? aboutItems.length > 0 || contributeItems.length > 0 || helpItems.length > 0
        : id === "contribute"
          ? contributeItems.length > 0
          : settingsItems.some((i) => i.subMenu === id);

  const getAriaLabel = (item: MenuItemConfig): string => {
    if (item.ariaLabel) return item.ariaLabel;
    const base = item.sortKey ?? item.label;
    if (item.label.includes("✨")) return `${base}, on`;
    if (item.label.includes("🌙")) return `${base}, off`;
    return base;
  };

  const renderItem = (item: MenuItemConfig) => {
    if (item.isSectionLabel) {
      return null;
    }
    return (
      <button
        key={item.id}
        className={styles.headerMenuItem}
        role="menuitem"
        disabled={item.disabled}
        onClick={item.onClick}
        aria-label={getAriaLabel(item)}
        title={item.disabled && item.disabledTitle ? item.disabledTitle : undefined}
      >
        {item.label}
      </button>
    );
  };

  const handleBack = () => {
    const parent = activeSubMenu ? SUBMENU_PARENT[activeSubMenu] : null;
    setActiveSubMenu(parent ?? null);
  };

  const renderSubMenu = () => (
    <>
      <button
        type="button"
        className={styles.headerMenuBack}
        role="menuitem"
        onClick={handleBack}
        aria-label="Back"
      >
        <ChevronLeft size={16} />
        Back
      </button>
      <div className={styles.headerMenuDivider} />
      {activeSubMenu === "gameplay" && hasSubMenuItems("controls") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("controls")}
          aria-label="Controls"
        >
          {SUB_MENU_LABELS.controls}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {activeSubMenu === "about" && (
        <>
          {hasSubMenuItems("contribute") && (
            <button
              type="button"
              className={styles.headerMenuSubmenuTrigger}
              role="menuitem"
              onClick={() => setActiveSubMenu("contribute")}
              aria-label="About"
            >
              {SUB_MENU_LABELS.contribute}
              <ChevronRight size={16} className={styles.headerMenuChevron} />
            </button>
          )}
          {hasSubMenuItems("help") && (
            <button
              type="button"
              className={styles.headerMenuSubmenuTrigger}
              role="menuitem"
              onClick={() => setActiveSubMenu("help")}
              aria-label="Help"
            >
              {SUB_MENU_LABELS.help}
              <ChevronRight size={16} className={styles.headerMenuChevron} />
            </button>
          )}
        </>
      )}
      {subMenuItems.map((item) => (
        <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
      ))}
      {activeSubMenu === "display" && (
        <div className={styles.headerMenuRangeWrap}>
          <label htmlFor="snap-tolerance-range" className={styles.headerMenuRangeLabel}>
            Snap Assist: {Math.round(props.snapToleranceOverride * 100)}%
          </label>
          <input
            id="snap-tolerance-range"
            type="range"
            min={60}
            max={160}
            step={5}
            value={Math.round(props.snapToleranceOverride * 100)}
            onChange={(e) => props.onSnapToleranceOverrideChange(Number(e.target.value) / 100)}
            className={styles.headerMenuRange}
            aria-label="Snap tolerance override"
          />
          <p className={styles.headerMenuRangeHint}>
            Lower = tighter snaps, higher = more forgiving.
          </p>
        </div>
      )}
      {activeSubMenu === "display" && props.onOpenThemeModal && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            props.onOpenThemeModal!();
          }}
          aria-label="Theme"
          data-testid="open-theme-modal"
        >
          {SUB_MENU_LABELS.theme}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
    </>
  );

  const mainMenuSubmenus = SETTINGS_SUBMENU_ORDER.filter((id) => hasSubMenuItems(id));

  return (
    <div className={styles.headerMenuWrap} ref={rootRef}>
      <Button
        size="sm"
        className={styles.headerMenuTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? "Close settings" : "Open settings"}
        onClick={() => setOpen((s) => !s)}
      >
        <Menu size={16} />
        <span className={styles.btnText}>Settings</span>
      </Button>

      {open && (
        <div className={styles.headerMenuPanel} role="menu">
          {activeSubMenu ? (
            renderSubMenu()
          ) : (
            <>
              {hasSubMenuItems("about") && (
                <button
                  type="button"
                  className={styles.headerMenuSubmenuTrigger}
                  role="menuitem"
                  onClick={() => setActiveSubMenu("about")}
                  aria-label="About"
                >
                  {SUB_MENU_LABELS.about}
                  <ChevronRight size={16} className={styles.headerMenuChevron} />
                </button>
              )}
              <div className={styles.headerMenuDivider} />
              {mainMenuSubmenus.map((id) => (
                <React.Fragment key={id}>
                  <button
                    type="button"
                    className={styles.headerMenuSubmenuTrigger}
                    role="menuitem"
                    onClick={() => {
                      if (id === "advanced") setAdvancedExpanded((e) => !e);
                      else setActiveSubMenu(id);
                    }}
                    aria-label={
                      SUB_MENU_LABELS[id].replace(/\p{Emoji}/gu, "").trim() || id
                    }
                  >
                    {SUB_MENU_LABELS[id]}
                    <ChevronRight
                      size={16}
                      className={`${styles.headerMenuChevron} ${id === "advanced" && advancedExpanded ? styles.headerMenuChevronExpanded : ""}`}
                    />
                  </button>
                  {id === "advanced" && advancedExpanded && (
                    <div className={styles.headerMenuNested}>
                      {settingsItems
                        .filter((i) => i.subMenu === "advanced")
                        .sort((a, b) =>
                          (a.sortKey ?? "").localeCompare(b.sortKey ?? "", undefined, {
                            sensitivity: "base",
                          }),
                        )
                        .map(renderItem)}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
