/**
 * HeaderMenu – hamburger menu with Theme, Gameplay, Display, Audio, Advanced.
 * Fix: render menu in a portal (document.body) so it stays above the board/canvas layers.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Settings, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import {
  buildMenuItems,
  type HeaderMenuProps,
  type MenuItemConfig,
  type SubMenuId,
} from "@/screens/Play/components/headerMenu/headerMenuConfig";
import {
  SUB_MENU_LABELS,
  SUBMENU_PARENT,
  SETTINGS_SUBMENU_ORDER,
  getSubmenuDescription,
} from "@/screens/Play/components/headerMenu/headerMenuConstants";
import { HeaderMenuSubmenuPanel } from "@/screens/Play/components/headerMenu/HeaderMenuSubmenuPanel";
import {
  buildHeaderMenuGroups,
  getMenuItemAriaLabel,
  getSubMenuItems,
  hasSubMenuItems,
} from "@/screens/Play/components/headerMenu/headerMenuViewModel";

export type { HeaderMenuProps } from "@/screens/Play/components/headerMenu/headerMenuConfig";

export function HeaderMenu(props: HeaderMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuId | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // Button does not forward refs; use wrapper for measuring
  const triggerWrapRef = useRef<HTMLDivElement | null>(null);

  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);

  const items = buildMenuItems(props, setOpen, (path) => navigate(path));

  useEffect(() => {
    if (!open) {
      setActiveSubMenu(null);
      setMenuRect(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerWrapRef.current) {
      setMenuRect(null);
      return;
    }

    const rect = triggerWrapRef.current.getBoundingClientRect();
    const gap = 6;

    const maxWidth = Math.min(360, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - maxWidth - 8);

    setMenuRect({
      top: rect.bottom + gap,
      left,
      minWidth: Math.min(rect.width, maxWidth),
    });
  }, [open, activeSubMenu]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      // clicks inside trigger wrapper: do not close
      const wrap = rootRef.current;
      if (wrap && e.target && wrap.contains(e.target as Node)) return;

      // clicks inside portal panel: do not close
      const panel = document.querySelector(
        "[data-header-menu-panel='true']",
      ) as HTMLElement | null;
      if (panel && e.target && panel.contains(e.target as Node)) return;

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
        const panel = document.querySelector(
          "[data-header-menu-panel='true']",
        ) as HTMLElement | null;
        if (!panel) return;

        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(
            "button[role='menuitem'], button[role='menuitemcheckbox'], [role='menuitem'], [role='menuitemcheckbox']",
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

    const onScroll = () => setOpen(false);

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, activeSubMenu]);

  const groups = buildHeaderMenuGroups(items);

  const subMenuItems = getSubMenuItems({
    activeSubMenu,
    settingsItems: groups.settingsItems,
    helpItems: groups.helpItems,
    aboutItems: groups.aboutItems,
    contributeItems: groups.contributeItems,
  });

  const renderItem = (item: MenuItemConfig) => {
    if (item.isSectionLabel) return null;

    if (item.isToggle) {
      return (
        <button
          key={item.id}
          type="button"
          className={styles.headerMenuToggleRow}
          role="menuitemcheckbox"
          aria-checked={item.checked}
          aria-label={getMenuItemAriaLabel(item)}
          disabled={item.disabled}
          title={
            item.disabled && item.disabledTitle
              ? item.disabledTitle
              : (item.title ?? `Toggle ${item.label}`)
          }
          onClick={item.onClick}
        >
          <span className={styles.headerMenuToggleLabel}>{item.label}</span>
          <span
            className={`${styles.headerMenuSwitch} ${item.checked ? styles.headerMenuSwitchOn : ""}`}
            aria-hidden
          >
            <span className={styles.headerMenuSwitchThumb} />
          </span>
        </button>
      );
    }

    return (
      <button
        key={item.id}
        className={styles.headerMenuItem}
        role="menuitem"
        disabled={item.disabled}
        onClick={item.onClick}
        aria-label={getMenuItemAriaLabel(item)}
        aria-checked={item.radioSelected}
        title={
          item.disabled && item.disabledTitle
            ? item.disabledTitle
            : (item.title ?? item.ariaLabel ?? item.sortKey ?? item.label)
        }
      >
        <span className={styles.headerMenuToggleLabel}>{item.label}</span>
        {item.radioSelected && (
          <Check size={16} className={styles.headerMenuCheck} aria-hidden />
        )}
      </button>
    );
  };

  const mainMenuSubmenus = SETTINGS_SUBMENU_ORDER.filter((id) =>
    hasSubMenuItems(id, groups),
  );
  const hasSubMenu = (id: SubMenuId) => hasSubMenuItems(id, groups);

  return (
    <div className={styles.headerMenuWrap} ref={rootRef}>
      <div className={styles.headerMenuTriggerWrap} ref={triggerWrapRef}>
        <Button
          size="sm"
          className={styles.headerMenuTrigger}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={open ? "Close settings" : "Open settings"}
          title={open ? "Close settings" : "Open settings menu"}
          onClick={() => setOpen((s) => !s)}
        >
          <Settings size={18} aria-hidden />
          <span className={styles.btnText}>Settings</span>
        </Button>
      </div>

      {open &&
        menuRect &&
        createPortal(
          <div
            data-header-menu-panel="true"
            className={`${styles.headerMenuPanel} ${styles.headerMenuPanelPortal}`}
            role="menu"
            style={{
              top: menuRect.top,
              left: menuRect.left,
              minWidth: menuRect.minWidth,
            }}
          >
            {activeSubMenu ? (
              <HeaderMenuSubmenuPanel
                activeSubMenu={activeSubMenu}
                setActiveSubMenu={setActiveSubMenu}
                subMenuItems={subMenuItems}
                hasSubMenuItems={hasSubMenu}
                renderItem={renderItem}
                headerMenuProps={props}
                setOpen={setOpen}
              />
            ) : (
              <>
                {hasSubMenu("about") && (
                  <button
                    type="button"
                    className={styles.headerMenuSubmenuTrigger}
                    role="menuitem"
                    onClick={() => setActiveSubMenu("about")}
                    aria-label="About"
                    title="About Phuzzle, help, and contributors"
                  >
                    {SUB_MENU_LABELS.about}
                    <ChevronRight size={16} className={styles.headerMenuChevron} />
                  </button>
                )}

                <div className={styles.headerMenuDivider} />

                {mainMenuSubmenus.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={styles.headerMenuSubmenuTrigger}
                    role="menuitem"
                    onClick={() => setActiveSubMenu(id)}
                    aria-label={
                      SUB_MENU_LABELS[id].replace(/\p{Emoji}/gu, "").trim() || id
                    }
                    title={getSubmenuDescription(id)}
                  >
                    {SUB_MENU_LABELS[id]}
                    <ChevronRight size={16} className={styles.headerMenuChevron} />
                  </button>
                ))}
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
