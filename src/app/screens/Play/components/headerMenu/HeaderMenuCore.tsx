/**
 * HeaderMenu – root: About, Leaderboard, Play, Settings (alpha). Settings submenus ordered by label in headerMenuConstants.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronRight, ChevronLeft, Check } from "lucide-react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import {
  buildMenuItems,
  type HeaderMenuProps,
  type MenuItemConfig,
  type SubMenuId,
  type RootMenuId,
} from "@/screens/Play/components/headerMenu/headerMenuConfig";
import {
  SUB_MENU_LABELS,
  getSettingsSubmenuIdsAlphabetical,
  ROOT_MENU_ORDER,
  ROOT_MENU_LABELS,
  getSubmenuDescription,
} from "@/screens/Play/components/headerMenu/headerMenuConstants";
import { HeaderMenuSubmenuPanel } from "@/screens/Play/components/headerMenu/HeaderMenuSubmenuPanel";
import {
  buildHeaderMenuGroups,
  getMenuItemAriaLabel,
  getSubMenuItems,
  hasSubMenuItems,
} from "@/screens/Play/components/headerMenu/headerMenuViewModel";
import { loadStatsScreenModule } from "@/screens/routeLoaders";
import {
  getLayoutViewportSize,
  subscribeViewportResizeOnly,
} from "@/utils/layoutViewport";

export type { HeaderMenuProps } from "@/screens/Play/components/headerMenu/headerMenuConfig";

export function HeaderMenu(props: HeaderMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeRoot, setActiveRoot] = useState<RootMenuId | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuId | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerWrapRef = useRef<HTMLDivElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelId = "play-header-menu-panel";

  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);

  const items = buildMenuItems(props, setOpen, (path) => navigate(path));

  const measurePanelPlacement = useCallback(() => {
    const el = triggerWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const { width: vw, height: vh } = getLayoutViewportSize();
    const maxWidth = Math.min(360, vw - 24);
    const left = Math.min(Math.max(8, rect.left), vw - maxWidth - 8);
    setMenuRect({
      top: Math.min(rect.bottom + gap, Math.max(12, vh - 24)),
      left,
      minWidth: Math.min(rect.width, maxWidth),
    });
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveRoot(null);
      setActiveSubMenu(null);
      setMenuRect(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerWrapRef.current) {
      setMenuRect(null);
      return;
    }
    measurePanelPlacement();
  }, [open, activeRoot, activeSubMenu, measurePanelPlacement]);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measurePanelPlacement);
    };
    const unsub = subscribeViewportResizeOnly(schedule);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [open, activeRoot, activeSubMenu, measurePanelPlacement]);

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
        if (activeSubMenu && activeRoot === "settings") {
          setActiveSubMenu(null);
        } else if (activeRoot) {
          setActiveRoot(null);
          setActiveSubMenu(null);
        } else {
          closeMenu();
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

    const onScroll = () => closeMenu();

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, activeRoot, activeSubMenu, closeMenu]);

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

  const settingsSubmenus = getSettingsSubmenuIdsAlphabetical(groups.settingsItems).filter(
    (id) => hasSubMenuItems(id, groups),
  );
  const hasSubMenu = (id: SubMenuId) => hasSubMenuItems(id, groups);

  const helpPanelItems = [
    ...groups.helpItems,
    ...groups.aboutItems,
    ...groups.contributeItems,
  ].sort((a, b) =>
    (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
      sensitivity: "base",
    }),
  );
  const handleRootClick = (root: RootMenuId) => {
    if (root === "resume") {
      closeMenu();
      return;
    }
    if (root === "newPuzzle") {
      props.onNewPuzzle();
      closeMenu();
      return;
    }
    if (root === "leaderboard") {
      void loadStatsScreenModule();
      navigate("/stats");
      closeMenu();
      return;
    }
    setActiveRoot(root);
  };

  const handleBack = () => {
    if (activeSubMenu) {
      setActiveSubMenu(null);
    } else {
      setActiveRoot(null);
      setActiveSubMenu(null);
    }
  };

  const showRootMenu = !activeRoot && !activeSubMenu;
  const showSettingsList = activeRoot === "settings" && !activeSubMenu;
  const showHelpList = activeRoot === "help";
  const showSubPanel = (activeRoot === "settings" || activeRoot === "help") && activeSubMenu;

  return (
    <div className={styles.headerMenuWrap} ref={rootRef}>
      <div className={styles.headerMenuTriggerWrap} ref={triggerWrapRef}>
        <button
          ref={triggerButtonRef}
          type="button"
          className={styles.headerMenuTrigger}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={open ? "Close menu" : "Open menu"}
          title={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((s) => !s)}
        >
          <Menu size={20} aria-hidden />
        </button>
      </div>

      {open &&
        menuRect &&
        createPortal(
          <div
            data-header-menu-panel="true"
            id={panelId}
            className={`${styles.headerMenuPanel} ${styles.headerMenuPanelPortal}`}
            role="menu"
            style={{
              top: menuRect.top,
              left: menuRect.left,
              minWidth: menuRect.minWidth,
            }}
          >
            {showSubPanel && activeSubMenu ? (
              <HeaderMenuSubmenuPanel
                activeSubMenu={activeSubMenu}
                setActiveSubMenu={setActiveSubMenu}
                subMenuItems={subMenuItems}
                hasSubMenuItems={hasSubMenu}
                renderItem={renderItem}
                headerMenuProps={props}
                setOpen={setOpen}
                onBack={handleBack}
                backLabel={activeRoot === "settings" ? "Settings" : "Help"}
              />
            ) : showRootMenu ? (
              <>
                {ROOT_MENU_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={styles.headerMenuSubmenuTrigger}
                    role="menuitem"
                    onClick={() => handleRootClick(id)}
                    aria-haspopup={
                      id === "settings" || id === "help" ? "menu" : undefined
                    }
                    aria-expanded={
                      activeRoot === id && (id === "settings" || id === "help")
                        ? true
                        : undefined
                    }
                    aria-label={ROOT_MENU_LABELS[id]}
                    title={
                      id === "leaderboard"
                        ? "View leaderboards"
                        : id === "settings"
                          ? "Gameplay, appearance, audio, and advanced settings"
                          : id === "newPuzzle"
                            ? "Choose a different puzzle"
                            : id === "resume"
                              ? "Close this menu and resume playing"
                              : id === "help"
                                ? "How to play and keyboard shortcuts"
                          : ROOT_MENU_LABELS[id]
                    }
                  >
                    {ROOT_MENU_LABELS[id]}
                    {(id === "settings" || id === "help") && (
                      <ChevronRight size={16} className={styles.headerMenuChevron} />
                    )}
                  </button>
                ))}
              </>
            ) : showSettingsList || showHelpList ? (
              <>
                <button
                  type="button"
                  className={styles.headerMenuBack}
                  role="menuitem"
                  onClick={handleBack}
                  aria-label="Back"
                  title="Back to main menu"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className={styles.headerMenuDivider} />
                {showSettingsList &&
                  settingsSubmenus.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={styles.headerMenuSubmenuTrigger}
                      role="menuitem"
                      onClick={() => setActiveSubMenu(id)}
                      aria-label={SUB_MENU_LABELS[id]}
                      title={getSubmenuDescription(id)}
                    >
                      {SUB_MENU_LABELS[id]}
                      <ChevronRight size={16} className={styles.headerMenuChevron} />
                    </button>
                  ))}
                {showHelpList &&
                  helpPanelItems.map((item) => (
                    <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
                  ))}
              </>
            ) : null}
          </div>,
          document.body,
        )}
    </div>
  );
}
